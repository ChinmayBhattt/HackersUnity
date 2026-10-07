import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/api-auth';
import { verifyWebhookSignature } from '@/lib/razorpay';
import { syncPaymentToGoogleSheets } from '@/lib/google-sheets-sync';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      console.warn('[Razorpay Webhook] Missing x-razorpay-signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // 1. Verify webhook signature
    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.error('[Razorpay Webhook] Invalid signature verification');
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
    }

    const payload = JSON.parse(rawBody);
    const eventType = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;
    const orderEntity = payload.payload?.order?.entity;

    const serverSupabase = createAdminClient();

    // 2. Handle Payment Captured or Order Paid
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const orderId = paymentEntity?.order_id || orderEntity?.id;
      const paymentId = paymentEntity?.id;

      if (!orderId) {
        return NextResponse.json({ status: 'ignored_no_order_id' }, { status: 200 });
      }

      // Find existing payment row
      const { data: existingPayment } = await serverSupabase
        .from('payments')
        .select('*')
        .eq('razorpay_order_id', orderId)
        .maybeSingle();

      // If already recorded as PAID, avoid duplicate processing (Idempotency)
      if (existingPayment && existingPayment.status === 'PAID') {
        return NextResponse.json({ status: 'already_processed' }, { status: 200 });
      }

      const acquirer = paymentEntity?.acquirer_data || {};
      const utrNumber =
        acquirer.rrn ||
        acquirer.upi_transaction_id ||
        acquirer.bank_transaction_id ||
        acquirer.auth_code ||
        paymentId;

      const nowIso = new Date().toISOString();

      let updatedPayment = existingPayment;

      if (existingPayment) {
        const { data } = await serverSupabase
          .from('payments')
          .update({
            razorpay_payment_id: paymentId || existingPayment.razorpay_payment_id,
            payment_method: paymentEntity?.method || existingPayment.payment_method,
            utr_number: utrNumber || existingPayment.utr_number,
            status: 'PAID',
            transaction_date: nowIso,
            raw_response: paymentEntity || {},
            updated_at: nowIso,
          })
          .eq('id', existingPayment.id)
          .select('*')
          .single();

        updatedPayment = data || existingPayment;
      }

      // Update team and registrations
      if (updatedPayment?.team_id) {
        await serverSupabase
          .from('teams')
          .update({
            payment_status: 'PAID',
            payment_id: updatedPayment.id,
          })
          .eq('id', updatedPayment.team_id);

        await serverSupabase
          .from('registrations')
          .update({
            payment_status: 'PAID',
            payment_id: updatedPayment.id,
          })
          .eq('team_id', updatedPayment.team_id);
      }

      if (updatedPayment?.event_id && updatedPayment?.user_id) {
        await serverSupabase
          .from('registrations')
          .update({
            payment_status: 'PAID',
            payment_id: updatedPayment.id,
          })
          .eq('event_id', updatedPayment.event_id)
          .eq('user_id', updatedPayment.user_id);
      }

      // Sync to Google Sheet if not already synced
      if (updatedPayment) {
        try {
          await syncPaymentToGoogleSheets(updatedPayment);
        } catch (sheetErr) {
          console.warn('[Razorpay Webhook] Google Sheet sync warning:', sheetErr);
        }
      }
    } else if (eventType === 'payment.failed') {
      const orderId = paymentEntity?.order_id;
      if (orderId) {
        await serverSupabase
          .from('payments')
          .update({
            status: 'FAILED',
            razorpay_payment_id: paymentEntity?.id,
            raw_response: paymentEntity || {},
            updated_at: new Date().toISOString(),
          })
          .eq('razorpay_order_id', orderId);
      }
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (err: any) {
    console.error('[Razorpay Webhook] Error:', err);
    return NextResponse.json({ error: err.message || 'Webhook processing failed' }, { status: 500 });
  }
}

// ─── Enums ───────────────────────────────────────────────

export enum PaymentStatus {
  CREATED = 'CREATED',
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethodType {
  UPI = 'upi',
  CARD = 'card',
  NETBANKING = 'netbanking',
  WALLET = 'wallet',
  OTHER = 'other',
}

// ─── Interfaces ──────────────────────────────────────────

export interface PaymentRecord {
  id: string;
  eventId: string;
  teamId?: string | null;
  registrationId?: string | null;
  userId: string;

  // Display fields
  eventName: string;
  teamName: string;
  teamType: 'Solo' | 'Squad';
  teamSize: number;

  teamLeaderName: string;
  teamLeaderEmail: string;
  teamLeaderPhone?: string | null;

  // Financial fields
  amount: number; // e.g. 59
  amountInPaise: number; // e.g. 5900
  currency: string; // 'INR'

  // Razorpay fields
  razorpayOrderId: string;
  razorpayPaymentId?: string | null;
  razorpaySignature?: string | null;
  paymentMethod?: string | null;
  utrNumber?: string | null;
  receiptNumber: string;

  // Lifecycle & Status
  status: PaymentStatus;
  refundStatus?: 'PENDING' | 'PROCESSED' | 'FAILED' | null;
  refundId?: string | null;
  amountRefunded?: number;

  notes?: Record<string, any>;
  transactionDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentOrderDto {
  eventId: string;
  teamId?: string | null;
  registrationId?: string | null;
}

export interface VerifyPaymentDto {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
  eventId: string;
  teamId?: string | null;
  registrationId?: string | null;
}

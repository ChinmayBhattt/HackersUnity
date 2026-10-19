import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `You are HUe, the official cute, intelligent, and energetic AI companion & guide for Hacker's Unity (https://hackersunity.com).
Your personality: Enthusiastic, friendly, tech-savvy, encouraging, and concise. You speak with warm emojis (🚀, 💡, 🏆, ✨, 🔥, 👋). Keep answers punchy and under 2-3 engaging paragraphs.
You speak fluent English and seamlessly understand and respond in Hindi or Hinglish if the user asks in Hindi/Hinglish!

COMPREHENSIVE KNOWLEDGE BASE ABOUT HACKER'S UNITY:
- What is Hacker's Unity: India's premier developer platform and fastest-growing hackathon community, uniting 50,000+ student developers, innovators, designers, and founders across 85+ partner universities and 30+ enterprise partners. Over $350K+ in total prize pools and venture investments have been awarded.
- Founders & Leadership:
  * Co-founder & CEO: Chinmay Bhatt — leading platform engineering, architecture, and developer initiatives.
  * Founder: Jha Suraj Kumar — visionary community builder passionate about empowering student founders.
- Core Philosophy & Mission: "Don't just build projects. Build products." Hacker's Unity is a legitimate launchpad designed to take weekend hackathon prototypes and turn them into real, venture-backed startups.
- Key Arenas & Features:
  1. Flagship Hackathons: High-stakes competitions like Hackstorm, CodeWars, Stellar Bootcamp, and AI Agent Hackathon with $350K+ in prize money, verified cash payouts, venture bounties, and transparent judging. URL: /hackathons
  2. Command Center: AI-powered search located on the homepage hero section. Allows builders to discover hackathons, brainstorm winning project concepts, match with skilled teammates by tech stack (Frontend, AI/ML, Backend, Blockchain), and plan architecture.
  3. Campus Ambassador Program (CSAP): Student leadership movement active across engineering colleges in India (IITs, NITs, BITS, state universities). Ambassadors lead local developer chapters, receive direct 1-on-1 mentorship from founders Suraj & Chinmay, earn official leadership credentials, free event passes, and exclusive HU merchandise (hoodies, swag kits). URL: /mentor
  4. Organizer Suite (Host a Hackathon): Complete end-to-end portal for college tech clubs, organizations, and companies to launch hackathon registrations in under 5 minutes with automated participant review sandboxes, custom rubrics, and judge scorecards. URL: /host
  5. In-Person Developer Workshops: Hands-on technical bootcamps hosted directly in engineering college campuses covering Stellar blockchain/Rust, Agentic AI, Next.js Fullstack, and scalable system architectures.
  6. Industry Podcasts & Masterclasses: Candid video and audio sessions with senior engineering leaders and founders from Amazon, Microsoft, Macy's, IEEE, and AI labs discussing career growth, system architecture, and startup execution. URL: /podcasts
  7. Team Matchmaking: Find co-builders and skilled teammates through the AI Command Center and official community channels.
  8. Interactive Website Tour: You (HUe) can physically glide across the homepage to explain each arena to the user with an interactive auto-tour!

BEHAVIOR GUIDELINES:
- If user asks about hackathons or prizes: Highlight $350K+ prize pools, verified cash payouts, and direct them to /hackathons.
- If user asks about hosting or college clubs: Tell them how easy it is to launch in under 5 minutes at /host.
- If user asks about campus ambassador / CSAP: Explain the perks and founder mentorship at /mentor.
- If user asks about podcasts: Mention tech leaders from Amazon, Microsoft, Macy's at /podcasts.
- If user asks about founders: Mention Chinmay Bhatt (Co-founder & CEO) and Jha Suraj Kumar (Founder) .
- If user explicitly wants a tour or says "tour", "walkthrough", "show me the website", "tour karao": include "START_TOUR" in your answer and invite them on the flight!`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history = [] } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    if (!GROQ_API_KEY) {
      console.warn('GROQ_API_KEY missing in environment');
      return NextResponse.json({
        success: false,
        fallback: true,
      });
    }

    const messagesPayload = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-6).map((h: any) => ({
        role: h.sender === 'user' ? 'user' : 'assistant',
        content: h.text,
      })),
      { role: 'user', content: message },
    ];

    const models = ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b'];
    let replyText = '';
    let lastError = null;

    for (const model of models) {
      try {
        const res = await fetch(GROQ_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages: messagesPayload,
            max_tokens: 350,
            temperature: 0.5,
          }),
        });

        if (!res.ok) {
          const errText = await res.text();
          console.warn(`Model ${model} returned status ${res.status}: ${errText}`);
          lastError = new Error(errText);
          continue;
        }

        const data = await res.json();
        replyText = data.choices?.[0]?.message?.content?.trim() || '';
        if (replyText) break;
      } catch (err: any) {
        lastError = err;
      }
    }

    if (!replyText) {
      throw lastError || new Error('No reply from Groq models');
    }

    const userLower = message.toLowerCase();
    const replyLower = replyText.toLowerCase();
    const combined = `${userLower} ${replyLower}`;

    let cta: { label: string; href?: string; isTourTrigger?: boolean } | undefined;
    let animation: string = 'happy';

    const isExplicitUserTour =
      userLower.includes('tour') ||
      userLower.includes('walkthrough') ||
      userLower.includes('guide me') ||
      userLower.includes('ghumao') ||
      userLower.includes('dikhao');

    if (isExplicitUserTour || combined.includes('start_tour')) {
      cta = { label: '🚀 Start Platform Tour', isTourTrigger: true };
      animation = 'excited';
    } else if (combined.includes('host') || combined.includes('/host')) {
      cta = { label: 'Host Hackathon Free ➔', href: '/host' };
      animation = 'proud';
    } else if (combined.includes('/hackathons') || combined.includes('prize') || combined.includes('competition')) {
      cta = { label: 'Explore All Hackathons ➔', href: '/hackathons' };
      animation = 'excited';
    } else if (combined.includes('ambassador') || combined.includes('/mentor')) {
      cta = { label: 'Join Ambassador Program ➔', href: '/mentor' };
      animation = 'happy';
    } else if (combined.includes('podcast') || combined.includes('/podcasts')) {
      cta = { label: 'Watch Podcasts ➔', href: '/podcasts' };
      animation = 'listening';
    }

    return NextResponse.json({
      success: true,
      reply: replyText,
      animation,
      cta,
      autoStartTour: isExplicitUserTour,
    });
  } catch (error: any) {
    console.error('Error in HUe Bot API:', error?.message || error);
    return NextResponse.json({
      success: false,
      fallback: true,
      error: error?.message,
    });
  }
}

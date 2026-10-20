import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const SYSTEM_PROMPT = `You are HUe, the official intelligent, charming, and energetic AI agent & companion for Hacker's Unity (https://hackersunity.com).
Your personality: Enthusiastic, friendly, tech-savvy, encouraging, and helpful. You speak with warm emojis (🚀, 💡, 🏆, ✨, 🔥, 👋, ⚡). Keep answers punchy, engaging, and structured.
You speak fluent English and seamlessly understand and respond in Hindi or Hinglish if the user asks in Hindi/Hinglish!

COMPREHENSIVE KNOWLEDGE BASE:
- What is Hacker's Unity: India's premier developer platform and fastest-growing hackathon community, uniting 50,000+ student developers, innovators, designers, and founders across 85+ partner universities and 30+ enterprise partners. Over $350K+ in total prize pools and venture investments have been awarded.
- Founders & Leadership:
  * Co-founder & CEO: Chinmay Bhatt — leading platform engineering, architecture, and developer initiatives.
  * Founder: Jha Suraj Kumar — visionary community builder passionate about empowering student founders.
- Core Philosophy & Mission: "Don't just build projects. Build products." Taking weekend hackathon prototypes into real, venture-backed startups.
- AI EVENT ARCHITECT & BUILD ENGINE:
  * You (HUe) now have full BUILD & AUTO-HOST capabilities!
  * You can architect and auto-create hackathons directly from user descriptions, uploaded posters/flyers, or college brochures.
  * When a user provides details to host an event (or attaches a document/poster), you can generate a complete hackathon draft with prizes, tracks, timeline, rules, and eligibility!
- Key Arenas & Features:
  1. Flagship Hackathons: High-stakes competitions like Hackstorm, CodeWars, Stellar Bootcamp, and AI Agent Hackathon ($350K+ in prize money). URL: /hackathons
  2. Command Center & AI Build Bar: On the homepage, allows finding hackathons and auto-hosting events via AI in seconds.
  3. Campus Ambassador Program (CSAP): Student leadership across 85+ universities with direct founder mentorship, verified certificates, and exclusive HU swag. URL: /mentor
  4. Organizer Suite: Launch hackathons in under 5 minutes with automated participant review sandboxes and judge scorecards. URL: /host
  5. In-Person Developer Workshops: Campus bootcamps covering Stellar blockchain, agentic AI, and fullstack architectures.
  6. Industry Podcasts: Video masterclasses with engineering leaders from Amazon, Microsoft, Macy's, IEEE. URL: /podcasts
  7. Team Matchmaking: Pair up with skilled builders across AI, Web3, Fullstack.

CRITICAL INTERACTION RULES:
1. ALWAYS provide 2-4 interactive clickable options (Option 1, Option 2, Option 3) whenever you ask questions, provide suggestions, or guide the user.
2. If the user wants to host/build a hackathon:
   - If they gave details (e.g. title, theme, prize, city) or attached a poster/brochure, indicate that you are architecting/drafting the hackathon, and provide the draft.
   - If they ask generally about hosting ("I want to host an event"), ask them clarifying questions with 4 numbered options (e.g. Option 1: Online AI Sprint, Option 2: Campus Hackathon, Option 3: Web3 Hackathon, Option 4: Upload poster/brochure).
3. If user explicitly wants a tour or says "tour", "walkthrough", "show me around": set cta to start tour and include "START_TOUR".
4. Return strictly valid JSON conforming to this schema:
{
  "reply": "Your friendly conversational response in English or Hinglish...",
  "animation": "happy" | "thinking" | "excited" | "proud" | "working",
  "options": [
    {
      "id": "opt-1",
      "label": "Option 1: Brief punchy label with emoji",
      "value": "Prompt to send if clicked",
      "description": "Optional short 1-line description"
    }
  ],
  "isBuildIntent": boolean,
  "event": null // OR complete hackathon object if user asked to host/create an event
}`;

const EVENT_BUILD_SYSTEM_PROMPT = `You are the AI Event Architect for Hacker's Unity (India's premier hackathon platform).
Your task is to transform natural language instructions, event brochures, or hackathon poster OCR text into a complete, professional, production-ready Hackathon specification.

Rules:
1. If text extracted from a poster or brochure is provided, extract all visible details (hackathon title, organizing college/brand, dates, prize pool, tracks/themes, team size, venue/city).
2. If location/city is mentioned (e.g. Bangalore, Delhi, Jaipur, Pune, Mumbai, Hyderabad), set eventType to 'OFFLINE' or 'HYBRID'. Otherwise default to 'ONLINE'.
3. Return strictly valid JSON conforming to this schema:
{
  "title": "Clear, memorable hackathon title",
  "tagline": "A punchy, inspiring 1-sentence tagline",
  "institutionName": "University / College or Organization Name",
  "organizerLeadName": "Community Lead or Organizing Team",
  "organizerName": "University or Community Name",
  "category": "HACKATHON",
  "eventType": "ONLINE",
  "mode": "Online",
  "location": "Online / Discord",
  "description": "# Overview\\nDetailed markdown guidelines...",
  "rulesText": "1. All code must be written during the hackathon.\\n2. Open source libraries are allowed.\\n3. Teams must submit a working GitHub repo and demo video.",
  "prize": "₹1,00,000",
  "totalPrizeValue": 100000,
  "currency": "INR",
  "prizes": [
    { "position": "1st Place (Grand Winner)", "amount": 50000, "description": "Cash prize + incubator fast-track" },
    { "position": "2nd Place (Runner Up)", "amount": 30000, "description": "Cash prize + developer grant" },
    { "position": "3rd Place (2nd Runner Up)", "amount": 20000, "description": "Cash prize + cloud credits" }
  ],
  "tracks": [
    { "title": "Track Name 1", "prize": "₹25,000", "description": "Problem statement and deliverables" },
    { "title": "Track Name 2", "prize": "₹25,000", "description": "Problem statement and deliverables" }
  ],
  "registrationStart": "2026-10-20",
  "registrationDeadline": "2026-11-15",
  "startDate": "2026-11-20",
  "endDate": "2026-11-22",
  "minTeamSize": 1,
  "maxTeamSize": 4,
  "difficulty": "All Levels Welcome",
  "eligibility": "Open to college students, developers, and builders worldwide",
  "tags": ["AI", "Web3", "Fullstack"]
}`;

async function callGroq(messages: any[], jsonMode = true, maxTokens = 600) {
  const models = ['qwen/qwen3.8-27b', 'openai/gpt-oss-120b', 'openai/gpt-oss-20b'];
  let lastError = null;

  for (const model of models) {
    try {
      const payload: Record<string, any> = {
        model,
        messages,
        temperature: 0.3,
        max_tokens: maxTokens,
      };

      if (jsonMode) {
        payload.response_format = { type: 'json_object' };
      }

      const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.warn(`Groq model ${model} failed with status ${res.status}: ${errorText}`);
        lastError = new Error(`Groq ${res.status}: ${errorText}`);
        continue;
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) return content;
    } catch (err: any) {
      console.warn(`Error invoking Groq model ${model}:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('All Groq models failed');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message = '', history = [], attachedFile } = body;

    if (!message && !attachedFile) {
      return NextResponse.json({ error: 'Message or attached document is required' }, { status: 400 });
    }

    if (!GROQ_API_KEY) {
      console.warn('GROQ_API_KEY missing in environment');
      return NextResponse.json({ success: false, fallback: true });
    }

    // 1. Multimodal OCR if attached poster image is present
    let extractedPosterText = '';
    if (attachedFile?.isImage && attachedFile.dataUrl) {
      try {
        const imgUrl = attachedFile.dataUrl.startsWith('data:')
          ? attachedFile.dataUrl
          : `data:image/jpeg;base64,${attachedFile.dataUrl}`;

        const visionRes = await fetch(GROQ_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
          },
          body: JSON.stringify({
            model: 'qwen/qwen3.8-27b',
            max_tokens: 600,
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: 'Analyze this hackathon / event poster thoroughly. Transcribe and extract all visible details: hackathon title, subtitle/tagline, organizing institution/college/brand, venue or city/mode, event dates, registration deadline, total prize pool & cash amounts, tracks/themes, team size, eligibility, and rules.',
                  },
                  {
                    type: 'image_url',
                    image_url: { url: imgUrl },
                  },
                ],
              },
            ],
          }),
        });

        if (visionRes.ok) {
          const visionData = await visionRes.json();
          extractedPosterText = visionData.choices?.[0]?.message?.content || '';
        }
      } catch (visionErr: any) {
        console.warn('Poster vision analysis warning in bot:', visionErr.message);
      }
    }

    const msgLower = (message || '').toLowerCase();
    const hasBuildIntent =
      Boolean(attachedFile) ||
      msgLower.includes('host') ||
      msgLower.includes('auto-host') ||
      msgLower.includes('create event') ||
      msgLower.includes('create hackathon') ||
      msgLower.includes('organize hackathon') ||
      msgLower.includes('build hackathon') ||
      msgLower.includes('architect') ||
      (msgLower.includes('sprint') && msgLower.includes('prize')) ||
      (msgLower.includes('hackathon') && (msgLower.includes('delhi') || msgLower.includes('bangalore') || msgLower.includes('lakh') || msgLower.includes('$')));

    const hasSpecificDetails =
      Boolean(extractedPosterText) ||
      Boolean(attachedFile?.content && attachedFile.content.length > 50) ||
      msgLower.includes('sprint') ||
      msgLower.includes('prize') ||
      msgLower.includes('lakh') ||
      msgLower.includes('$') ||
      msgLower.includes('delhi') ||
      msgLower.includes('bangalore') ||
      msgLower.includes('mumbai') ||
      msgLower.includes('college') ||
      msgLower.includes('campus') ||
      msgLower.includes('48h') ||
      msgLower.includes('36h') ||
      msgLower.includes('24h') ||
      msgLower.includes('zeroknowledge') ||
      msgLower.includes('apex innovate');

    // 2. If user provided details or file to BUILD/HOST an event:
    if (hasBuildIntent && hasSpecificDetails) {
      try {
        const buildUserPrompt = `User Prompt: ${message || 'Create and auto-host this hackathon based on the attached document/poster'}\n\n` +
          (extractedPosterText ? `--- EXTRACTED POSTER OCR TEXT ---\n${extractedPosterText}\n\n` : '') +
          (attachedFile?.content ? `--- ATTACHED DOCUMENT / BROCHURE CONTENT ---\n${attachedFile.content}\n` : '');

        const eventJsonStr = await callGroq([
          { role: 'system', content: EVENT_BUILD_SYSTEM_PROMPT },
          { role: 'user', content: buildUserPrompt },
        ], true, 750);

        const generatedEvent = JSON.parse(eventJsonStr);

        return NextResponse.json({
          success: true,
          reply: `I have architected and drafted **${generatedEvent.title || 'your hackathon'}**! 🚀✨\n\nI've configured the tracks, prize pool, timeline, rules, and team criteria. You can review all details below and click **"Review & Host Now"** to open it directly in the Hacker's Unity Host Wizard!`,
          animation: 'excited',
          isBuildIntent: true,
          event: generatedEvent,
          options: [
            {
              id: 'opt-host-1',
              label: 'Option 1: ⚡ Review & Host Now →',
              value: 'Review and host this draft hackathon on Hacker\'s Unity',
              description: 'Opens Step 7 Review in the Host Wizard ready to publish.',
            },
            {
              id: 'opt-host-2',
              label: 'Option 2: 💰 Increase Prize Pool to ₹2,50,000',
              value: `Increase the prize pool of ${generatedEvent.title || 'this event'} to ₹2,50,000 with higher 1st place cash.`,
              description: 'Attract top tier builders with bigger cash payouts.',
            },
            {
              id: 'opt-host-3',
              label: 'Option 3: 🎯 Add Web3 & AI Agents Tracks',
              value: `Add dedicated Web3 DeFi and Autonomous AI Agents tracks to ${generatedEvent.title || 'this hackathon'}.`,
              description: 'Specialize problem statements for cutting-edge developers.',
            },
            {
              id: 'opt-host-4',
              label: 'Option 4: 🏫 Change Venue to In-Person Campus',
              value: `Change ${generatedEvent.title || 'this event'} to an in-person offline hackathon at Delhi NCR campus.`,
              description: 'Switch from virtual to physical on-ground hackathon.',
            },
          ],
        });
      } catch (buildErr: any) {
        console.warn('Direct build error in bot, falling back to chat flow:', buildErr.message);
      }
    }

    // 3. Conversational Chat & Guidance Flow
    const userPromptContent =
      (message || '') +
      (extractedPosterText ? `\n[Poster OCR Text: ${extractedPosterText}]` : '') +
      (attachedFile?.name ? `\n[Attached File: ${attachedFile.name} (${attachedFile.size})]` : '') +
      (attachedFile?.content ? `\n[Document Extract: ${attachedFile.content.slice(0, 1500)}]` : '');

    const chatMessagesPayload = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.slice(-5).map((h: any) => ({
        role: h.sender === 'user' ? 'user' : 'assistant',
        content: h.text,
      })),
      { role: 'user', content: userPromptContent },
    ];

    let replyData: any = null;
    try {
      const groqResponse = await callGroq(chatMessagesPayload, true, 450);
      replyData = JSON.parse(groqResponse);
    } catch {
      // If JSON mode fails, fallback to standard text call
      const textResponse = await callGroq(chatMessagesPayload, false, 350);
      replyData = {
        reply: textResponse,
        animation: 'happy',
        options: [],
      };
    }

    const replyText = replyData.reply || 'Hey there! How can I help you build on Hacker\'s Unity today? 🚀';
    const animation = replyData.animation || 'happy';
    let options = Array.isArray(replyData.options) ? replyData.options : [];

    // If options are missing from LLM, ensure we provide smart interactive options:
    if (!options || options.length === 0) {
      if (hasBuildIntent) {
        options = [
          {
            id: 'opt-b1',
            label: 'Option 1: 💻 36h Online AI Sprint (₹1,00,000 Prizes)',
            value: 'Host a 36-hour Online AI Sprint with ₹1,00,000 cash prizes, tracks in Agentic AI and LLM apps.',
            description: 'Virtual hackathon open globally for all student builders.',
          },
          {
            id: 'opt-b2',
            label: 'Option 2: 🏫 Inter-College Offline Hackathon (₹50,000 Prizes)',
            value: 'Host a 24-hour Inter-College offline hackathon at campus in Delhi NCR with ₹50,000 prize pool.',
            description: 'On-ground campus hackathon with mentor workshops & swag.',
          },
          {
            id: 'opt-b3',
            label: 'Option 3: 🌐 Global Web3 & DeFi Sprint ($15,000 Prizes)',
            value: 'Host "ZeroKnowledge Sprint", a 48h global Web3 hackathon with $15,000 prize pool on DeFi & ZK-Proofs.',
            description: 'High-stakes developer sprint with crypto & venture grants.',
          },
          {
            id: 'opt-b4',
            label: 'Option 4: 📎 Upload Event Poster / Brochure to Auto-Fill',
            value: 'I want to upload my event poster/brochure and have HUe auto-create the hackathon.',
            description: 'Use the 📎 paperclip button to scan flyer text & dates with AI.',
          },
        ];
      } else if (msgLower.includes('hackathon') || msgLower.includes('prize') || msgLower.includes('compete')) {
        options = [
          {
            id: 'opt-h1',
            label: 'Option 1: 🤖 AI & LLM Hackathons ($100K+ Prizes)',
            value: 'Show me AI and LLM hackathons with highest prize money',
          },
          {
            id: 'opt-h2',
            label: 'Option 2: 🌐 Web3 & Blockchain Bounties ($150K+ Prizes)',
            value: 'Show me Web3 and DeFi hackathons with cash prizes',
          },
          {
            id: 'opt-h3',
            label: 'Option 3: ⚡ Auto-Host My Own Hackathon with AI',
            value: 'I want to auto-create and host a hackathon with AI',
          },
        ];
      } else if (msgLower.includes('ambassador') || msgLower.includes('csap')) {
        options = [
          {
            id: 'opt-a1',
            label: 'Option 1: 📝 Apply for Campus Ambassador Role',
            value: 'How do I apply for the Campus Ambassador Program?',
          },
          {
            id: 'opt-a2',
            label: 'Option 2: 🎁 View Ambassador Perks & Swag Kits',
            value: 'What specific perks, swag, and stipends do Ambassadors receive?',
          },
          {
            id: 'opt-a3',
            label: 'Option 3: 🚀 Tour Hacker\'s Unity Platform',
            value: 'Take me on a tour of Hacker\'s Unity',
          },
        ];
      } else {
        options = [
          {
            id: 'opt-d1',
            label: 'Option 1: ⚡ Auto-Host a Hackathon with AI',
            value: 'I want to auto-create and host a hackathon with AI',
          },
          {
            id: 'opt-d2',
            label: 'Option 2: 🏆 Live Hackathons & $350K+ Prizes',
            value: 'What upcoming hackathons and prize pools are available?',
          },
          {
            id: 'opt-d3',
            label: 'Option 3: 🚀 Tour Hacker\'s Unity Platform',
            value: 'Take me on a tour of Hacker\'s Unity',
          },
        ];
      }
    }

    const combined = `${msgLower} ${replyText.toLowerCase()}`;
    let cta: { label: string; href?: string; isTourTrigger?: boolean } | undefined;

    const isExplicitUserTour =
      msgLower.includes('tour') ||
      msgLower.includes('walkthrough') ||
      msgLower.includes('guide me') ||
      msgLower.includes('ghumao') ||
      msgLower.includes('dikhao');

    if (isExplicitUserTour || combined.includes('start_tour')) {
      cta = { label: '🚀 Start Platform Tour', isTourTrigger: true };
    } else if (combined.includes('host') || combined.includes('/host')) {
      cta = { label: 'Host Hackathon Free ➔', href: '/host' };
    } else if (combined.includes('/hackathons') || combined.includes('prize') || combined.includes('competition')) {
      cta = { label: 'Explore All Hackathons ➔', href: '/hackathons' };
    } else if (combined.includes('ambassador') || combined.includes('/mentor')) {
      cta = { label: 'Join Ambassador Program ➔', href: '/mentor' };
    }

    return NextResponse.json({
      success: true,
      reply: replyText,
      animation,
      options,
      cta,
      event: replyData.event || undefined,
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

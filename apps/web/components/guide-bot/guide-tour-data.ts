import type { AnimationName } from '@/components/avatar';

export interface TourStep {
  id: string;
  targetId: string;
  badge: string;
  title: string;
  message: string;
  animation: AnimationName;
  durationMs: number; // 3-5 seconds per step
  dockPosition: 'top-left' | 'right' | 'top-right' | 'bottom-right' | 'left' | 'bottom-left' | 'top-center' | 'bottom-center' | 'center-right';
  action?: {
    label: string;
    href?: string;
  };
}

export interface ChatSuggestion {
  id: string;
  label: string;
  query: string;
  isTourTrigger?: boolean;
}

export interface BotChatOption {
  id: string;
  label: string;
  value: string;
  description?: string;
  isBuildTrigger?: boolean;
}

export interface AttachedFileMeta {
  name: string;
  size: string;
  content: string;
  isImage?: boolean;
  dataUrl?: string;
}

export interface BotChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  options?: BotChatOption[];
  eventDraft?: any; // ExtendedEvent
  attachedFile?: {
    name: string;
    size: string;
    isImage?: boolean;
    dataUrl?: string;
  };
  cta?: {
    label: string;
    href?: string;
    isTourTrigger?: boolean;
    action?: string;
  };
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'hero',
    targetId: 'hero-pill',
    badge: 'Hacker\'s Unity Arena',
    title: 'Welcome to Hacker\'s Unity 🚀',
    message: 'India\'s premier developer platform uniting 50,000+ student builders & founders!',
    animation: 'happy',
    durationMs: 4000,
    dockPosition: 'top-left',
  },
  {
    id: 'ai-command',
    targetId: 'ai-command',
    badge: 'AI Innovation Hub',
    title: 'Groq AI Command Center ⚡',
    message: 'Brainstorm hackathon projects, match with skilled teammates, and discover events instantly.',
    animation: 'thinking',
    durationMs: 4200,
    dockPosition: 'right',
  },
  {
    id: 'metrics',
    targetId: 'metrics-ticker',
    badge: 'Community Impact',
    title: '50,000+ Strong Network 📈',
    message: '10+ flagship hackathons, 30+ physical events, and 5M+ developer impressions across India.',
    animation: 'proud',
    durationMs: 4000,
    dockPosition: 'top-center',
  },
  {
    id: 'hackathons',
    targetId: 'first-hackathon-card',
    badge: 'Flagship Arenas',
    title: 'Compete & Win $350K+ Prizes 🏆',
    message: 'Explore active hackathons across AI, Web3 & DeepTech with verified cash payouts.',
    animation: 'excited',
    durationMs: 4500,
    dockPosition: 'bottom-left',
    action: {
      label: 'Explore Hackathons →',
      href: '/hackathons',
    },
  },
  {
    id: 'gallery',
    targetId: 'gallery',
    badge: 'Live Experience',
    title: 'Hackstorm & CodeWars Arena 📸',
    message: 'Real on-ground glimpses of builders collaborating and pitching to industry leaders!',
    animation: 'curious',
    durationMs: 4000,
    dockPosition: 'top-right',
  },
  {
    id: 'builder-standard',
    targetId: 'builder-card-1',
    badge: 'The Builder Standard',
    title: 'From Projects to Startups 💡',
    message: 'We help promising builders validate prototypes and turn them into venture-funded startups.',
    animation: 'proud',
    durationMs: 4200,
    dockPosition: 'left',
  },
  {
    id: 'podcasts',
    targetId: 'podcasts',
    badge: 'Industry Masterclasses',
    title: 'Learn from Tech Pioneers 🎙️',
    message: 'Candid podcasts with engineering leaders from Amazon, Microsoft, IEEE & top AI labs.',
    animation: 'listening',
    durationMs: 4200,
    dockPosition: 'bottom-right',
    action: {
      label: 'Watch Podcasts →',
      href: '/podcasts',
    },
  },
  {
    id: 'workshops',
    targetId: 'workshop-card',
    badge: 'Developer Sprints',
    title: 'Hands-on Tech Workshops 🛠️',
    message: 'In-person developer workshops on Web3, Stellar & AI hosted directly at top campuses.',
    animation: 'working',
    durationMs: 4200,
    dockPosition: 'top-left',
  },
  {
    id: 'host-hackathon',
    targetId: 'host-cta-card',
    badge: 'Organizer Suite',
    title: 'Host Your Own Hackathon 🌟',
    message: 'Launch your hackathon in under 5 minutes with automated review sandboxes & 50k+ reach.',
    animation: 'playful',
    durationMs: 4500,
    dockPosition: 'bottom-center',
    action: {
      label: 'Host Free →',
      href: '/host',
    },
  },
  {
    id: 'campus-ambassador',
    targetId: 'campus-ambassador',
    badge: 'Student Leadership',
    title: 'Become a Campus Ambassador 🎓',
    message: 'Lead the developer movement at your university with founder mentorship & exclusive perks!',
    animation: 'celebrate',
    durationMs: 4500,
    dockPosition: 'top-right',
    action: {
      label: 'Join Program →',
      href: '/mentor',
    },
  },
];

export const CHAT_SUGGESTIONS: ChatSuggestion[] = [
  {
    id: 'build',
    label: '⚡ Auto-Host / Create Hackathon',
    query: 'I want to auto-create and host a hackathon with AI',
  },
  {
    id: 'tour',
    label: '🚀 Tour Hacker\'s Unity platform',
    query: 'Take me on a tour of Hacker\'s Unity',
    isTourTrigger: true,
  },
  {
    id: 'host',
    label: '🌟 How to host a hackathon?',
    query: 'How can I host a hackathon on Hacker\'s Unity?',
  },
  {
    id: 'hackathons',
    label: '🏆 Live hackathons & prizes',
    query: 'What upcoming hackathons and prize pools are available?',
  },
  {
    id: 'ambassador',
    label: '🎓 Campus Ambassador program',
    query: 'Tell me about the Campus Ambassador Program',
  },
  {
    id: 'team',
    label: '👥 How to find teammates?',
    query: 'How do I find teammates to build hackathon projects?',
  },
  {
    id: 'expressions',
    label: '✨ HUe\'s 30+ Expressions',
    query: 'Show me your expressions and moods',
  },
];

// Fallback Smart Query Resolver for Hacker's Unity
export function resolveBotQuery(query: string): {
  text: string;
  animation: AnimationName;
  options?: BotChatOption[];
  cta?: { label: string; href?: string; isTourTrigger?: boolean };
} {
  const q = query.toLowerCase().trim();

  // Specific emotion / expression triggers
  if (q.includes('wink')) {
    return {
      text: "Always got your back! 😉 Keep innovating and building products that matter! ✨",
      animation: 'wink',
    };
  }
  if (q.includes('love') || q.includes('pyaar') || q.includes('dil')) {
    return {
      text: "Sending all my love to you and the incredible Hacker's Unity developer community! 💖🚀",
      animation: 'love',
    };
  }
  if (q.includes('cool') || q.includes('swagger') || q.includes('shades')) {
    return {
      text: "Smooth, confident, and ready to ship production code. Let's do this! 😎⚡",
      animation: 'cool',
    };
  }
  if (q.includes('starstruck') || q.includes('awe') || q.includes('wow') || q.includes('wonder')) {
    return {
      text: "Whoa! Over $350K+ in prize pools and 50,000+ top builders across India?! Truly mind-blowing! 🤩🏆",
      animation: 'starstruck',
    };
  }
  if (q.includes('determined') || q.includes('focus') || q.includes('locked in') || q.includes('code')) {
    return {
      text: "Locked in! Focused builder mode engaged. Time to turn ideas into high-impact startups! 💻⚡",
      animation: 'determined',
    };
  }
  if (q.includes('dance') || q.includes('party') || q.includes('nach')) {
    return {
      text: "Hackathon submission accepted! Let's celebrate with a victory dance! 🕺🎉",
      animation: 'dance',
    };
  }
  if (q.includes('giggle') || q.includes('laugh') || q.includes('tickle') || q.includes('joke')) {
    return {
      text: "Hehehe that tickles! 🤭 Why do programmers prefer dark mode? Because light attracts bugs! 🐛😂",
      animation: 'giggle',
    };
  }
  if (q.includes('dizzy') || q.includes('spin') || q.includes('chakkar')) {
    return {
      text: "Whoa... too many recursive function calls without a base case! Head is spinning! 😵‍💫💫",
      animation: 'dizzy',
    };
  }
  if (
    q.includes('expression') ||
    q.includes('mood') ||
    q.includes('feeling') ||
    q.includes('kya kar sakte')
  ) {
    return {
      text: "I have over 30+ interactive animated moods and 40+ procedural 3D expressions! ✨ From charming winks 😉, starry-eyed wonder 🤩, loving glances 💖, to builder focus ⚡ and celebration dances 🕺!\n\nPick a mood below or use the quick Moods bar above to see me in action:",
      animation: 'dance',
      options: [
        {
          id: 'opt-e1',
          label: 'Option 1: 😉 Show a cheeky wink',
          value: 'Show me your charming wink expression',
        },
        {
          id: 'opt-e2',
          label: 'Option 2: 💖 Show some love to Hacker\'s Unity',
          value: 'Show me your love and appreciation expression',
        },
        {
          id: 'opt-e3',
          label: 'Option 3: 🤩 Starstruck by hackathons',
          value: 'Show me your starstruck wonder expression',
        },
        {
          id: 'opt-e4',
          label: 'Option 4: ⚡ Ultra-focused builder mode',
          value: 'Show me your locked in determined builder expression',
        },
      ],
    };
  }

  // Tour trigger
  if (
    q.includes('tour') ||
    q.includes('walkthrough') ||
    q.includes('guide me') ||
    q.includes('show me around') ||
    q.includes('explain website')
  ) {
    return {
      text: 'Starting your automatic platform tour now! 🚀 Hang tight while I fly to each card and explain how it works.',
      animation: 'excited',
      cta: {
        label: 'Starting Tour...',
        isTourTrigger: true,
      },
    };
  }

  // Host / Auto-Build Hackathon
  if (
    q.includes('host') ||
    q.includes('organize') ||
    q.includes('organizer') ||
    q.includes('conduct hackathon') ||
    q.includes('create event') ||
    q.includes('build') ||
    q.includes('auto-host') ||
    q.includes('auto host')
  ) {
    return {
      text: 'I can auto-architect and host your entire hackathon in seconds! ⚡ You get automated submission review sandboxes, verified judge rubrics, and reach across 50,000+ developers.\n\nChoose an option below or describe your event (or attach a poster/brochure with 📎):',
      animation: 'proud',
      options: [
        {
          id: 'opt-1',
          label: 'Option 1: 💻 36h Online AI Sprint (₹1,00,000 Prizes)',
          value: 'Host a 36-hour Online AI Sprint with ₹1,00,000 cash prizes, tracks in Agentic AI and LLM apps.',
          description: 'Virtual hackathon open globally for all student builders.',
          isBuildTrigger: true,
        },
        {
          id: 'opt-2',
          label: 'Option 2: 🏫 Inter-College Offline Hackathon (₹50,000 Prizes)',
          value: 'Host a 24-hour Inter-College offline hackathon at campus in Delhi NCR with ₹50,000 prize pool.',
          description: 'On-ground campus hackathon with mentor workshops & swag.',
          isBuildTrigger: true,
        },
        {
          id: 'opt-3',
          label: 'Option 3: 🌐 Global Web3 & DeFi Sprint ($15,000 Prizes)',
          value: 'Host "ZeroKnowledge Sprint", a 48h global Web3 hackathon with $15,000 prize pool on DeFi & ZK-Proofs.',
          description: 'High-stakes developer sprint with crypto & venture grants.',
          isBuildTrigger: true,
        },
        {
          id: 'opt-4',
          label: 'Option 4: 📎 Attach Event Poster / Brochure to Auto-Fill',
          value: 'I want to upload my event poster/brochure and have HUe auto-create the hackathon.',
          description: 'Use the 📎 paperclip button to scan flyer text & dates with AI.',
        },
      ],
      cta: {
        label: 'Open Host Portal ➔',
        href: '/host',
      },
    };
  }

  // Hackathons & Prizes
  if (
    q.includes('hackathon') ||
    q.includes('prize') ||
    q.includes('compete') ||
    q.includes('competition') ||
    q.includes('events') ||
    q.includes('cash')
  ) {
    return {
      text: 'We feature 15+ live & upcoming hackathons across AI Agents, Web3 & DeepTech with over $350,000+ in verified cash payouts! 🏆\n\nWhich category would you like to explore?',
      animation: 'excited',
      options: [
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
          label: 'Option 3: 🎓 Beginner Friendly & Student Hackathons',
          value: 'What are the best beginner-friendly student hackathons?',
        },
        {
          id: 'opt-h4',
          label: 'Option 4: ⚡ Auto-Host My Own Hackathon with AI',
          value: 'I want to auto-create and host a hackathon with AI',
        },
      ],
      cta: {
        label: 'Explore All Hackathons ➔',
        href: '/hackathons',
      },
    };
  }

  // Campus Ambassador / CSAP
  if (
    q.includes('ambassador') ||
    q.includes('csap') ||
    q.includes('campus') ||
    q.includes('college lead') ||
    q.includes('representative')
  ) {
    return {
      text: 'The Hacker\'s Unity Campus Ambassador Program (CSAP) empowers student leaders across 85+ partner universities! 🎓 You receive 1-on-1 mentorship from founders Suraj & Chinmay, official leadership certificates, free VIP event passes, and exclusive HU merchandise.\n\nWhat would you like to do next?',
      animation: 'happy',
      options: [
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
      ],
      cta: {
        label: 'Apply for Ambassador Program ➔',
        href: '/mentor',
      },
    };
  }

  // Teammates & Matchmaking
  if (
    q.includes('team') ||
    q.includes('teammate') ||
    q.includes('partner') ||
    q.includes('find members') ||
    q.includes('solo')
  ) {
    return {
      text: 'Need an unstoppable hackathon squad? 👥 You can find verified builders through our AI Command Center by role and tech stack!\n\nWhich role are you looking for?',
      animation: 'thinking',
      options: [
        {
          id: 'opt-t1',
          label: 'Option 1: 🤖 AI / ML & PyTorch Engineer',
          value: 'Find AI and Machine Learning teammates for hackathons',
        },
        {
          id: 'opt-t2',
          label: 'Option 2: 💻 Next.js & Fullstack Frontend Builder',
          value: 'Find Next.js and Fullstack developer teammates',
        },
        {
          id: 'opt-t3',
          label: 'Option 3: 🌐 Web3 & Smart Contract Developer',
          value: 'Find Web3 and Solidity/Rust developers for hackathons',
        },
      ],
      cta: {
        label: 'Try AI Teammate Finder ➔',
        href: '#ai-command',
      },
    };
  }

  // Podcasts
  if (
    q.includes('podcast') ||
    q.includes('interview') ||
    q.includes('watch') ||
    q.includes('video') ||
    q.includes('leaders')
  ) {
    return {
      text: 'Tune into our exclusive masterclass podcasts with engineering directors & founders from Amazon, Microsoft, Macy\'s, and IEEE discussing AI architectures, career growth, and startup execution! 🎙️',
      animation: 'listening',
      cta: {
        label: 'Watch Podcast Episodes ➔',
        href: '/podcasts',
      },
    };
  }

  // Workshops
  if (
    q.includes('workshop') ||
    q.includes('bootcamp') ||
    q.includes('learn') ||
    q.includes('stellar') ||
    q.includes('deeptech')
  ) {
    return {
      text: 'We organize hands-on developer sprints and bootcamps at engineering colleges covering Stellar blockchain, agentic AI, and system design with direct mentor feedback! 🛠️',
      animation: 'working',
      cta: {
        label: 'Check Workshops Section ➔',
        href: '#workshops',
      },
    };
  }

  // Founders & About
  if (
    q.includes('founder') ||
    q.includes('who made') ||
    q.includes('about') ||
    q.includes('team behind') ||
    q.includes('suraj') ||
    q.includes('chinmay')
  ) {
    return {
      text: 'Hacker\'s Unity is India\'s fastest-growing hackathon community and developer platform, founded by Jha Suraj Kumar and co-founded by Chinmay Bhatt. We are uniting 50,000+ builders to turn weekend prototypes into real venture-backed startups! 🚀',
      animation: 'celebrate',
      options: [
        {
          id: 'opt-f1',
          label: 'Option 1: ⚡ Auto-Host a Hackathon with AI',
          value: 'I want to auto-create and host a hackathon with AI',
        },
        {
          id: 'opt-f2',
          label: 'Option 2: 🏆 Browse Live Hackathons',
          value: 'What upcoming hackathons and prize pools are available?',
        },
        {
          id: 'opt-f3',
          label: 'Option 3: 🚀 Tour Hacker\'s Unity Platform',
          value: 'Take me on a tour of Hacker\'s Unity',
        },
      ],
      cta: {
        label: 'About Hacker\'s Unity ➔',
        href: '/about',
      },
    };
  }

  return {
    text: 'Hacker\'s Unity is India\'s premier builder platform for 50,000+ developers! You can discover hackathons, auto-host your own event, match with teammates, or learn from tech founders. What would you like to explore?',
    animation: 'playful',
    options: [
      {
        id: 'opt-d1',
        label: 'Option 1: ⚡ Auto-Host a Hackathon with AI',
        value: 'I want to auto-create and host a hackathon with AI',
      },
      {
        id: 'opt-d2',
        label: 'Option 2: 🏆 Browse Live Hackathons & Prizes',
        value: 'What upcoming hackathons and prize pools are available?',
      },
      {
        id: 'opt-d3',
        label: 'Option 3: 🚀 Tour Hacker\'s Unity Platform',
        value: 'Take me on a tour of Hacker\'s Unity',
      },
      {
        id: 'opt-d4',
        label: 'Option 4: 👥 Find Teammates for Hackathons',
        value: 'How do I find teammates to build hackathon projects?',
      },
    ],
    cta: {
      label: '🚀 Start Platform Tour',
      isTourTrigger: true,
    },
  };
}

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

export interface BotChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  cta?: {
    label: string;
    href?: string;
    isTourTrigger?: boolean;
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
];

// Fallback Smart Query Resolver for Hacker's Unity
export function resolveBotQuery(query: string): {
  text: string;
  animation: AnimationName;
  cta?: { label: string; href?: string; isTourTrigger?: boolean };
} {
  const q = query.toLowerCase().trim();

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

  // Host Hackathon
  if (
    q.includes('host') ||
    q.includes('organize') ||
    q.includes('organizer') ||
    q.includes('conduct hackathon') ||
    q.includes('create event')
  ) {
    return {
      text: 'You can host your hackathon on Hacker\'s Unity in under 5 minutes! 🌟 You get access to our 50,000+ developer community, automated submission reviews, verified judge scorecards, and live participant analytics.',
      animation: 'proud',
      cta: {
        label: 'Host Hackathon Free ➔',
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
      text: 'We feature 15+ live & upcoming hackathons across AI Agents, Web3 & DeepTech with over $350,000+ in total prize pools! 🏆 Participating is free and open to student developers worldwide.',
      animation: 'excited',
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
      text: 'The Hacker\'s Unity Campus Ambassador Program empowers students to lead developer initiatives at their universities. 🎓 You receive direct mentorship from founders, official leadership credentials, free event passes, and exclusive HU swag!',
      animation: 'happy',
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
      text: 'Need a team? Use our AI Command Center right on the homepage to find teammates by tech stack (Frontend, Backend, AI/ML, Smart Contracts), or join our Discord & Telegram builder network to pair up! 👥',
      animation: 'thinking',
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
      text: 'Tune into our exclusive podcast episodes with engineering directors & founders from Amazon, Microsoft, Macy\'s, and IEEE discussing AI architectures, career growth, and startup execution! 🎙️',
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
      text: 'Hacker\'s Unity is India\'s fastest-growing hackathon community and developer platform, founded by Jha Suraj Kumar and co-founded by Chinmay Bhatt. We are uniting 50,000+ builders to create real-world impact! 🚀',
      animation: 'celebrate',
      cta: {
        label: 'About Hacker\'s Unity ➔',
        href: '/about',
      },
    };
  }

  return {
    text: 'Hacker\'s Unity is India\'s premier builder platform for 50,000+ developers! You can discover hackathons, host your own event, match with teammates, or learn from tech founders. Would you like a 1-minute guided card tour?',
    animation: 'playful',
    cta: {
      label: '🚀 Start Platform Tour',
      isTourTrigger: true,
    },
  };
}

import { ExtendedEvent } from '@/lib/mock-data';
import { EventCategory, EventType } from '@hackers-unity/shared-types';
import { saveDraftEvent } from '@/lib/storage';

export function createDraftEventFromAi(
  aiEvent: any,
  bannerUrl?: string
): ExtendedEvent {
  const draftId = `evt_ai_${Date.now()}`;
  const now = new Date();
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const totalPrize =
    typeof aiEvent.totalPrizeValue === 'number'
      ? aiEvent.totalPrizeValue
      : parseInt(String(aiEvent.prize || aiEvent.totalPrizeValue || '100000').replace(/\D/g, '')) || 100000;

  return {
    id: draftId,
    slug: draftId,
    title: aiEvent.title || 'AI Generated Hackathon',
    name: aiEvent.title || 'AI Generated Hackathon',
    tagline: aiEvent.tagline || "Built with Hacker's Unity AI Architect",
    organizerId: 'org_ai_host',
    organizerName: aiEvent.institutionName
      ? `${aiEvent.institutionName} • ${aiEvent.organizerLeadName || "Hacker's Unity"}`
      : aiEvent.organizerName || "Hacker's Unity Community",
    organizerAvatar: '⚡',
    organizerLogo: '',
    description: aiEvent.description || 'Complete hackathon guidelines and problem statements.',
    category: (aiEvent.category as EventCategory) || EventCategory.HACKATHON,
    eventType:
      aiEvent.eventType === 'OFFLINE'
        ? EventType.OFFLINE
        : aiEvent.eventType === 'HYBRID'
          ? EventType.HYBRID
          : EventType.ONLINE,
    mode: aiEvent.mode || (aiEvent.eventType === 'OFFLINE' ? 'In-Person' : 'Online'),
    location: aiEvent.location || (aiEvent.eventType === 'OFFLINE' ? 'Delhi NCR / Campus' : 'Online / Discord'),
    domain: (aiEvent.tags && aiEvent.tags.join(', ')) || 'AI, Web3, Fullstack',
    tags: Array.isArray(aiEvent.tags) && aiEvent.tags.length > 0 ? aiEvent.tags : ['AI', 'Innovation'],
    startDate: aiEvent.startDate ? `${aiEvent.startDate}T09:00:00Z` : nextMonth.toISOString(),
    endDate: aiEvent.endDate
      ? `${aiEvent.endDate}T18:00:00Z`
      : new Date(nextMonth.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    registrationStart: aiEvent.registrationStart
      ? `${aiEvent.registrationStart}T00:00:00Z`
      : now.toISOString(),
    registrationDeadline: aiEvent.registrationDeadline
      ? `${aiEvent.registrationDeadline}T23:59:59Z`
      : new Date(nextMonth.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    prize: aiEvent.prize || (totalPrize ? `₹${totalPrize.toLocaleString('en-IN')}` : '₹1,00,000'),
    totalPrizeValue: totalPrize,
    currency: aiEvent.currency || 'INR',
    participantsCount: 0,
    participantsDisplay: '0 Builders Registered',
    maxParticipants: 500,
    isTeamEvent: true,
    bannerUrl: bannerUrl || (aiEvent.image || ''),
    image: bannerUrl || (aiEvent.image || ''),
    rulesDocUrl: '',
    registrationLink: '',
    createdAt: now.toISOString(),
    bannerGradient: 'from-blue-600 via-indigo-600 to-sky-500',
    minTeamSize: Number(aiEvent.minTeamSize) || 1,
    maxTeamSize: Number(aiEvent.maxTeamSize) || 4,
    teamSize: `${Number(aiEvent.minTeamSize) || 1}-${Number(aiEvent.maxTeamSize) || 4} Members`,
    eligibilityRules: {
      teamSize: `${Number(aiEvent.minTeamSize) || 1}-${Number(aiEvent.maxTeamSize) || 4} Members`,
      eligibility: aiEvent.eligibility || 'Open to all developers and students worldwide',
    },
    eligibility: aiEvent.eligibility || 'Open to all developers and students worldwide',
    difficulty: aiEvent.difficulty || 'All Levels Welcome',
    rulesText: aiEvent.rulesText || aiEvent.rules || 'Standard hackathon code of conduct applies.',
    prizes: Array.isArray(aiEvent.prizes) && aiEvent.prizes.length > 0
      ? aiEvent.prizes.map((p: any) => ({
        position: p.position || p.title || 'Winner',
        amount: typeof p.amount === 'number' ? p.amount : parseInt(String(p.amount).replace(/\D/g, '')) || 50000,
        description: p.description || '',
      }))
      : [
        { position: '1st Place', amount: Math.round(totalPrize * 0.5), description: 'Grand Prize Winner' },
        { position: '2nd Place', amount: Math.round(totalPrize * 0.3), description: 'Runner Up' },
        { position: '3rd Place', amount: Math.round(totalPrize * 0.2), description: '2nd Runner Up' },
      ],
    tracks: Array.isArray(aiEvent.tracks) && aiEvent.tracks.length > 0
      ? aiEvent.tracks.map((t: any) => ({
        title: t.title || 'Open Track',
        prize: t.prize || t.prizePool || '₹25,000',
        description: t.description || 'Build innovative solutions',
      }))
      : [
        { title: 'AI & Agents Track', prize: '₹40,000', description: 'Autonomous agents, workflow automations, and LLM apps' },
        { title: 'Open Innovation Track', prize: '₹30,000', description: 'Any breakthrough prototype solving real-world challenges' },
      ],
    stages: [
      {
        id: 'stage_1',
        eventId: draftId,
        stageName: 'Registration Phase',
        stageOrder: 1,
        startDate: aiEvent.registrationStart || now.toISOString().split('T')[0],
        endDate: aiEvent.registrationDeadline || nextMonth.toISOString().split('T')[0],
        description: 'Team formation and registration confirmation.',
      },
      {
        id: 'stage_2',
        eventId: draftId,
        stageName: 'Hacking Sprint',
        stageOrder: 2,
        startDate: aiEvent.startDate || nextMonth.toISOString().split('T')[0],
        endDate: aiEvent.endDate || nextMonth.toISOString().split('T')[0],
        description: 'Intense sprint to build and ship the prototype.',
      },
    ],
    faqs: [
      {
        id: 'faq_1',
        eventId: draftId,
        question: 'Who can participate?',
        answer: 'Anyone with a passion for building! College students, self-taught devs, and professionals are welcome.',
        createdAt: now.toISOString(),
      },
      {
        id: 'faq_2',
        eventId: draftId,
        question: 'Is there any registration fee?',
        answer: 'No, participation is completely free.',
        createdAt: now.toISOString(),
      },
      {
        id: 'faq_3',
        eventId: draftId,
        question: 'What is the team size?',
        answer: `Teams can have between ${aiEvent.minTeamSize || 1} to ${aiEvent.maxTeamSize || 4} members.`,
        createdAt: now.toISOString(),
      },
    ],
    sponsors: [],
    status: 'DRAFT' as any,
  };
}

export function commitDraftAndLaunch(
  event: ExtendedEvent,
  router: { push: (url: string) => void }
): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('hackers_unity_edit_event', JSON.stringify(event));
    saveDraftEvent(event);
    router.push(`/host?edit=${event.id}&step=8`);
  }
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  User,
  UserMinus,
  Crown,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  Share2,
  GraduationCap,
  Sparkles,
  LogOut,
  Mail,
  RefreshCw,
} from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import { fetchUserTeamForEvent, removeTeamMemberSupabase, deleteTeamSupabase } from '@/lib/supabase-service';

export interface ManageTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  eventName: string;
  eventSlug?: string;
  teamId?: string;
  teamName?: string;
  currentUserId: string;
  currentUserRole?: string;
  onTeamUpdated?: () => void;
}

interface TeamMember {
  id?: string;
  user_id: string;
  role: 'LEADER' | 'MEMBER' | string;
  profiles?: {
    name?: string;
    email?: string;
    avatar_url?: string;
    college?: string;
    skills?: string[];
    phone?: string;
  };
  name?: string;
  user_name?: string;
}

interface JoinRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  college?: string;
  skills?: string[];
  message?: string;
  createdAt: string;
}

export function ManageTeamModal({
  isOpen,
  onClose,
  eventId,
  eventName,
  eventSlug,
  teamId,
  teamName,
  currentUserId,
  currentUserRole,
  onTeamUpdated,
}: ManageTeamModalProps) {
  const [loading, setLoading] = useState(true);
  const [teamData, setTeamData] = useState<any | null>(null);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [activeTab, setActiveTab] = useState<'roster' | 'requests'>('roster');

  // Action states
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Confirmation states
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch Team Data & Join Requests
  const loadTeamData = useCallback(async () => {
    if (!eventId || !currentUserId) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Fetch team info
      let foundTeam: any = null;

      // Try server endpoint first
      try {
        const res = await fetch(
          `/api/teams?action=get_user_team&eventId=${encodeURIComponent(eventId)}&userId=${encodeURIComponent(currentUserId)}`
        );
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.team) {
            foundTeam = json.team;
          }
        }
      } catch (err) {
        console.warn('API get_user_team error:', err);
      }

      // If teamId was passed and not found above, try fetching by teamId
      if (!foundTeam && teamId) {
        try {
          const res = await fetch(`/api/teams?teamId=${encodeURIComponent(teamId)}`);
          if (res.ok) {
            const json = await res.json();
            if (json.success && json.team) {
              foundTeam = json.team;
            }
          }
        } catch (err) {
          console.warn('API get by teamId error:', err);
        }
      }

      // Fallback to client helper
      if (!foundTeam) {
        foundTeam = await fetchUserTeamForEvent(eventId, currentUserId);
      }

      setTeamData(foundTeam);

      // 2. If user is squad leader, fetch join requests
      const isLeader =
        foundTeam?.leader_id === currentUserId ||
        currentUserRole?.toLowerCase().includes('lead') ||
        currentUserRole?.toLowerCase().includes('squad leader');

      if (foundTeam?.id && isLeader) {
        try {
          const reqRes = await fetch(
            `/api/teams?action=get_join_requests&teamId=${encodeURIComponent(foundTeam.id)}`
          );
          if (reqRes.ok) {
            const reqJson = await reqRes.json();
            if (reqJson.success && Array.isArray(reqJson.requests)) {
              setJoinRequests(reqJson.requests);
            }
          }
        } catch (err) {
          console.warn('Join requests fetch notice:', err);
        }
      }
    } catch (err: any) {
      console.error('Failed to load team data:', err);
      setErrorMsg(err?.message || 'Failed to load team details.');
    } finally {
      setLoading(false);
    }
  }, [eventId, currentUserId, teamId, currentUserRole]);

  useEffect(() => {
    if (isOpen) {
      loadTeamData();
    } else {
      setTeamData(null);
      setJoinRequests([]);
      setErrorMsg(null);
      setSuccessMsg(null);
      setMemberToRemove(null);
      setShowLeaveConfirm(false);
      setShowDeleteConfirm(false);
    }
  }, [isOpen, loadTeamData]);

  if (!isOpen) return null;

  const currentTeamName = teamData?.name || teamName || 'Squad';
  const inviteToken =
    teamData?.invite_token ||
    teamData?.team_invitations?.find((i: any) => i.invite_token)?.invite_token ||
    teamData?.team_invitations?.[0]?.invite_token ||
    currentTeamName;

  const isLeader =
    teamData?.leader_id === currentUserId ||
    currentUserRole?.toLowerCase().includes('lead') ||
    currentUserRole?.toLowerCase().includes('squad leader');

  // Resolved members list
  const members: TeamMember[] =
    teamData?.team_members && teamData.team_members.length > 0
      ? teamData.team_members
      : [
          {
            user_id: currentUserId,
            role: isLeader ? 'LEADER' : 'MEMBER',
            profiles: teamData?.profiles,
            name: teamData?.profiles?.name || 'Squad Leader',
          },
        ];

  // Origin for links
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://hackersunity.com';
  const targetSlug = eventSlug || teamData?.events?.slug || eventId;
  const inviteLink = `${siteUrl}/hackathons/${targetSlug}/register/${encodeURIComponent(inviteToken)}`;

  // Copy Code Handler
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteToken);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      setErrorMsg('Could not copy code to clipboard.');
    }
  };

  // Copy Link Handler
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      setErrorMsg('Could not copy link to clipboard.');
    }
  };

  // Share to WhatsApp
  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `Hey! Join my squad "${currentTeamName}" for ${eventName} on Hacker's Unity!\n\nUse Invite Code: ${inviteToken}\nOr join directly with this link:\n${inviteLink}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // Remove Member (Leader action)
  const handleConfirmRemoveMember = async () => {
    if (!memberToRemove || !teamData?.id) return;
    const targetUserId = memberToRemove.user_id || memberToRemove.id;
    if (!targetUserId) return;

    setActionLoadingId(targetUserId);
    setErrorMsg(null);

    try {
      const res = await removeTeamMemberSupabase(teamData.id, targetUserId, currentUserId);
      if (res.success) {
        setSuccessMsg(`Removed ${memberToRemove.profiles?.name || 'member'} from the squad.`);
        setMemberToRemove(null);
        await loadTeamData();
        if (onTeamUpdated) onTeamUpdated();
      } else {
        throw new Error(res.error || 'Failed to remove member.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error removing member.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Leave Team (Member action)
  const handleConfirmLeaveTeam = async () => {
    if (!teamData?.id) return;
    setActionLoadingId('leave');
    setErrorMsg(null);

    try {
      const res = await removeTeamMemberSupabase(teamData.id, currentUserId, teamData.leader_id || currentUserId);
      if (res.success) {
        setSuccessMsg('You have successfully left the squad.');
        setShowLeaveConfirm(false);
        if (onTeamUpdated) onTeamUpdated();
        setTimeout(() => onClose(), 1200);
      } else {
        throw new Error(res.error || 'Failed to leave squad.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error leaving squad.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete Squad (Leader action)
  const handleConfirmDeleteSquad = async () => {
    if (!teamData?.id) return;
    setActionLoadingId('delete');
    setErrorMsg(null);

    try {
      const res = await deleteTeamSupabase(teamData.id, currentUserId, eventId);
      if (res.success) {
        setSuccessMsg('Squad successfully disbanded.');
        setShowDeleteConfirm(false);
        if (onTeamUpdated) onTeamUpdated();
        setTimeout(() => onClose(), 1200);
      } else {
        throw new Error(res.error || 'Failed to delete squad.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error deleting squad.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Approve Join Request
  const handleApproveRequest = async (requestId: string) => {
    setActionLoadingId(`approve_${requestId}`);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve_join_request',
          requestId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to approve join request.');
      }

      setSuccessMsg('Applicant approved and added to your squad!');
      await loadTeamData();
      if (onTeamUpdated) onTeamUpdated();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error approving request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Decline Join Request
  const handleDeclineRequest = async (requestId: string) => {
    setActionLoadingId(`decline_${requestId}`);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'decline_join_request',
          requestId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to decline request.');
      }

      setJoinRequests((prev) => prev.filter((r) => r.id !== requestId));
      setSuccessMsg('Join request declined.');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error declining request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#0c1017] rounded-3xl shadow-2xl dark:shadow-black/95 border border-slate-200 dark:border-white/[0.1] overflow-hidden my-6">
        
        {/* Top Gradient Banner & Header */}
        <div className="relative p-5 sm:p-6 border-b border-slate-100 dark:border-white/[0.08] bg-gradient-to-r from-sky-50/70 via-indigo-50/30 to-orange-50/40 dark:from-sky-950/25 dark:via-[#0c1017] dark:to-orange-950/20">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0099e6] to-[#0284c7] text-white flex items-center justify-center text-lg font-black shadow-lg shadow-sky-500/25 shrink-0">
                {currentTeamName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                    {currentTeamName}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-100 dark:bg-sky-500/15 text-[#0099e6] dark:text-sky-400 border border-sky-200/60 dark:border-sky-500/20">
                    {isLeader ? 'Squad Leader' : 'Team Member'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                  {eventName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={loadTeamData}
                disabled={loading}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer"
                title="Refresh Team Data"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.06] rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Tabs (Roster vs Join Requests) */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-200/60 dark:border-white/[0.06]">
            <button
              type="button"
              onClick={() => setActiveTab('roster')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'roster'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                  : 'bg-white/80 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-white/[0.08]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Squad Roster ({members.length})</span>
            </button>

            {isLeader && (
              <button
                type="button"
                onClick={() => setActiveTab('requests')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'requests'
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                    : 'bg-white/80 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-white/[0.08]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Join Requests</span>
                {joinRequests.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white">
                    {joinRequests.length}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Alerts & Messages */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span className="flex-1 font-medium">{errorMsg}</span>
            <button onClick={() => setErrorMsg(null)} className="cursor-pointer text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
            <span className="flex-1 font-medium">{successMsg}</span>
            <button onClick={() => setSuccessMsg(null)} className="cursor-pointer text-slate-400 hover:text-slate-600">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Confirmation Overlay: Remove Member */}
        {memberToRemove && (
          <div className="p-5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/40 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span>
                Remove{' '}
                <strong>{memberToRemove.profiles?.name || memberToRemove.name || 'this member'}</strong> from the squad?
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              Their slot will become open for new applicants, and they will lose access to team submissions.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleConfirmRemoveMember}
                disabled={Boolean(actionLoadingId)}
                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {actionLoadingId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserMinus className="w-3.5 h-3.5" />}
                <span>Confirm Remove</span>
              </button>
              <button
                type="button"
                onClick={() => setMemberToRemove(null)}
                className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Confirmation Overlay: Leave Team */}
        {showLeaveConfirm && (
          <div className="p-5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800/40 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
              <LogOut className="w-4 h-4 text-amber-600" />
              <span>Leave &ldquo;{currentTeamName}&rdquo;?</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              You will forfeit your current squad slot for this hackathon and return to Solo / Unregistered status.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleConfirmLeaveTeam}
                disabled={Boolean(actionLoadingId)}
                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {actionLoadingId === 'leave' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
                <span>Yes, Leave Team</span>
              </button>
              <button
                type="button"
                onClick={() => setShowLeaveConfirm(false)}
                className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Confirmation Overlay: Disband Team */}
        {showDeleteConfirm && (
          <div className="p-5 bg-red-50 dark:bg-red-950/40 border-b border-red-200 dark:border-red-900/40 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-red-800 dark:text-red-300">
              <Trash2 className="w-4 h-4 text-red-600" />
              <span>Disband and Delete &ldquo;{currentTeamName}&rdquo;?</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-400">
              This action cannot be undone. All members will be removed and the squad code will expire immediately.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleConfirmDeleteSquad}
                disabled={Boolean(actionLoadingId)}
                className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                {actionLoadingId === 'delete' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Disband Squad</span>
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-6 max-h-[72vh] overflow-y-auto">
          
          {/* Quick Recruitment / Invite Bar */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                <Share2 className="w-3.5 h-3.5 text-[#0099e6]" />
                <span>Invite Teammates</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">
                Share code or link with your friends
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              {/* Code Display */}
              <div className="flex-1 flex items-center justify-between px-3 py-2 rounded-xl bg-white dark:bg-[#07090e] border border-slate-200 dark:border-white/10 text-xs font-mono font-bold text-slate-900 dark:text-white">
                <span className="truncate">{inviteToken}</span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="ml-2 text-slate-400 hover:text-[#0099e6] transition-colors cursor-pointer shrink-0"
                  title="Copy Invite Code"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-white dark:bg-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.1] border border-slate-200 dark:border-white/10 text-xs font-bold text-slate-800 dark:text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="Copy Full Invite Link"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <ExternalLink className="w-3.5 h-3.5 text-[#0099e6]" />}
                  <span>{copiedLink ? 'Link Copied!' : 'Copy Link'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer shrink-0"
                  title="Share via WhatsApp"
                >
                  <FaWhatsapp className="w-4 h-4" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>
              </div>
            </div>
          </div>

          {/* TAB 1: SQUAD ROSTER */}
          {activeTab === 'roster' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Registered Participants & Teammates ({members.length})
                </h4>
                {isLeader && members.length > 1 && (
                  <span className="text-[10px] text-slate-400 font-medium">
                    You can manage squad slots below
                  </span>
                )}
              </div>

              {loading ? (
                <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#0099e6]" />
                  <span className="text-xs">Loading squad roster...</span>
                </div>
              ) : members.length === 0 ? (
                <div className="p-6 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06] text-center text-xs text-slate-500">
                  No teammates found in this squad yet. Share your invite code above to recruit builders!
                </div>
              ) : (
                <div className="space-y-2">
                  {members.map((member, idx) => {
                    const isTargetLeader =
                      member.role === 'LEADER' ||
                      (teamData?.leader_id && (member.user_id === teamData.leader_id || member.id === teamData.leader_id));
                    const isMe = member.user_id === currentUserId || member.id === currentUserId;
                    const memberName =
                      member.profiles?.name ||
                      member.name ||
                      member.user_name ||
                      (isTargetLeader ? 'Squad Leader' : `Teammate ${idx + 1}`);
                    const avatarUrl = member.profiles?.avatar_url;
                    const college = member.profiles?.college;
                    const email = member.profiles?.email;

                    return (
                      <div
                        key={member.user_id || member.id || idx}
                        className="p-3.5 rounded-2xl bg-white dark:bg-[#07090e] border border-slate-200/80 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/20 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Avatar */}
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-100 to-indigo-100 dark:from-sky-950/60 dark:to-indigo-950/60 text-[#0099e6] dark:text-sky-300 font-black text-sm flex items-center justify-center overflow-hidden shrink-0 border border-sky-200/50 dark:border-sky-800/40">
                            {avatarUrl ? (
                              <img src={avatarUrl} alt={memberName} className="w-full h-full object-cover" />
                            ) : (
                              (memberName || 'M').charAt(0).toUpperCase()
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {memberName}
                              </span>
                              {isMe && (
                                <span className="px-1.5 py-0.2 rounded-md bg-sky-50 dark:bg-sky-950/60 text-[#0099e6] dark:text-sky-400 text-[9px] font-bold">
                                  You
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                              {college && (
                                <span className="flex items-center gap-1 truncate">
                                  <GraduationCap className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{college}</span>
                                </span>
                              )}
                              {email && !college && (
                                <span className="flex items-center gap-1 truncate">
                                  <Mail className="w-3 h-3 shrink-0" />
                                  <span className="truncate">{email}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Role & Action */}
                        <div className="flex items-center gap-2 shrink-0">
                          {isTargetLeader ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                              <Crown className="w-3 h-3 text-amber-500" />
                              <span>Leader</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/[0.08]">
                              Member
                            </span>
                          )}

                          {/* Leader can remove other members */}
                          {isLeader && !isTargetLeader && (
                            <button
                              type="button"
                              onClick={() => setMemberToRemove(member)}
                              disabled={actionLoadingId === (member.user_id || member.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
                              title="Remove from squad"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: JOIN REQUESTS (Leader Only) */}
          {activeTab === 'requests' && isLeader && (
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Pending Join Applications ({joinRequests.length})
              </h4>

              {joinRequests.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200/80 dark:border-white/[0.06] text-center space-y-1.5">
                  <Sparkles className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    No Pending Applications
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    When other builders request to join your squad, their applications will show up here for your approval.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {joinRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 rounded-2xl bg-white dark:bg-[#07090e] border border-slate-200/80 dark:border-white/[0.08] space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950/60 text-[#0099e6] font-bold text-xs flex items-center justify-center">
                            {(req.userName || 'A').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                              {req.userName}
                            </h5>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                              {req.college || req.userEmail || 'Applicant'}
                            </p>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleApproveRequest(req.id)}
                            disabled={Boolean(actionLoadingId)}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                          >
                            {actionLoadingId === `approve_${req.id}` ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )}
                            <span>Approve</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeclineRequest(req.id)}
                            disabled={Boolean(actionLoadingId)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-600 hover:text-red-600 dark:text-slate-300 text-[11px] font-bold transition-all cursor-pointer"
                          >
                            {actionLoadingId === `decline_${req.id}` ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <X className="w-3 h-3" />
                            )}
                            <span>Decline</span>
                          </button>
                        </div>
                      </div>

                      {/* Message / pitch */}
                      {req.message && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/[0.03] p-2.5 rounded-xl border border-slate-200/60 dark:border-white/[0.05] italic">
                          &ldquo;{req.message}&rdquo;
                        </p>
                      )}

                      {/* Skills */}
                      {req.skills && req.skills.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {req.skills.map((s, sIdx) => (
                            <span
                              key={sIdx}
                              className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.05] text-[10px] font-medium text-slate-600 dark:text-slate-400"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* SQUAD SETTINGS / DANGER ZONE */}
          <div className="pt-4 border-t border-slate-100 dark:border-white/[0.08] flex items-center justify-between gap-3 flex-wrap">
            {isLeader ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3.5 py-1.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-transparent hover:border-red-200 dark:hover:border-red-900/40"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Disband Squad</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowLeaveConfirm(true)}
                className="px-3.5 py-1.5 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-transparent hover:border-red-200 dark:hover:border-red-900/40"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Leave Squad</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-xs font-bold text-slate-800 dark:text-white transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

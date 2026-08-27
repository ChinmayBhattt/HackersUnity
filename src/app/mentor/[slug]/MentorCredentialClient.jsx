'use client';

import { useState } from 'react';
import Image from 'next/image';
import { 
  ShieldCheck, 
  Award, 
  Copy, 
  Check, 
  Share2, 
  Printer, 
  Building2, 
  Briefcase, 
  Calendar, 
  Sparkles, 
  Terminal, 
  Cpu, 
  CheckCircle2, 
  Layers, 
  ExternalLink,
  Lock
} from 'lucide-react';
import styles from './credential.module.css';

export default function MentorCredentialClient({ mentor }) {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyId = () => {
    if (!mentor) return;
    navigator.clipboard.writeText(mentor.credentialId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2500);
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* Background Decor */}
      <div className={styles.gridBackground} />
      <div className={styles.glowOrb1} />
      <div className={styles.glowOrb2} />

      <div className={styles.wrapper}>
        {/* Top Header Bar with Hacker's Unity Branding & Live Verification Status */}
        <header className={styles.topNavHeader}>
          <div className={styles.brandInfo}>
            <Image
              src="/logo.png"
              alt="Hacker's Unity Logo"
              width={38}
              height={38}
              className={styles.brandLogo}
              priority
              unoptimized
            />
            <div className={styles.brandTitleGroup}>
              <span className={styles.brandName}>
                HACKER&apos;S UNITY
              </span>
              <span className={styles.brandSubtitle}>Official Credential Registry</span>
            </div>
          </div>

          <div className={styles.registryBadge}>
            <span className={styles.livePulseDot} />
            Official Verified Record
          </div>

          <div className={styles.headerActions}>
            <button 
              type="button" 
              onClick={handleCopyLink} 
              className={styles.actionBtn}
              title="Share verification link"
            >
              {copiedLink ? <Check size={14} color="#34d399" /> : <Share2 size={14} />}
              <span>{copiedLink ? 'Link Copied' : 'Share'}</span>
            </button>
            <button 
              type="button" 
              onClick={handlePrint} 
              className={styles.actionBtn}
              title="Print official verification sheet"
            >
              <Printer size={14} />
              <span>Print / Save</span>
            </button>
          </div>
        </header>

        {/* ===================================================================
            Official Credential Document Card
            =================================================================== */}
        <div className={styles.credentialDoc}>
          {/* Certificate Corner Ornaments */}
          <div className={styles.docCornerTL} />
          <div className={styles.docCornerTR} />
          <div className={styles.docCornerBL} />
          <div className={styles.docCornerBR} />

          {/* Watermark Logo */}
          <Image
            src="/logo.png"
            alt="Watermark"
            width={320}
            height={320}
            className={styles.watermarkLogo}
            unoptimized
          />

          {/* Certificate Header Banner */}
          <div className={styles.certTopBanner}>
            <div className={styles.certHeaderLeft}>
              <div className={styles.sealIcon}>
                <Award size={24} />
              </div>
              <div>
                <div className={styles.certDocTitle}>Official Mentor Credential</div>
                <div className={styles.certDocSubtitle}>Hacker&apos;s Unity Recognition &amp; Verification Protocol</div>
              </div>
            </div>

            <div className={styles.verificationBadgeLarge}>
              <ShieldCheck size={18} />
              <span>✓ Verified by Hacker&apos;s Unity</span>
            </div>
          </div>

          {/* Mentor Profile Grid */}
          <div className={styles.profileGrid}>
            <div className={styles.avatarWrapper}>
              <div className={styles.avatarInner}>
                <Image
                  src={mentor.photo}
                  alt={mentor.name}
                  width={200}
                  height={200}
                  className={styles.avatarImg}
                  priority
                  unoptimized
                />
              </div>
              <div className={styles.avatarVerifiedCheck} title="Verified Identity">
                <Check size={20} strokeWidth={3} />
              </div>
            </div>

            <div className={styles.profileDetails}>
              <div className={styles.profileTopMeta}>
                <span className={styles.tierPill}>
                  <Sparkles size={12} /> {mentor.verificationTier || 'Verified Official Mentor'}
                </span>
                <span className="badge badge-new">{mentor.experienceYears} Experience</span>
              </div>

              <h1 className={styles.mentorFullName}>{mentor.name}</h1>

              <div className={styles.positionGroup}>
                <span className={styles.designationBadge}>
                  <Briefcase size={15} color="var(--accent-primary)" />
                  {mentor.designation}
                </span>
                <span>•</span>
                <span className={styles.companyBadge}>
                  <Building2 size={15} />
                  {mentor.company}
                </span>
              </div>

              {mentor.headline && (
                <p className={styles.headlineText}>
                  {mentor.headline}
                </p>
              )}
            </div>
          </div>

          {/* Prominent Credential Box */}
          <div className={styles.credentialBox}>
            <div className={styles.credentialBoxHeader}>
              <div className={styles.credentialLabelGroup}>
                <Lock size={15} className={styles.credentialLabelIcon} />
                <span className={styles.credentialLabelText}>Official Mentor Credential ID</span>
              </div>
              <span className={styles.tierPill}>Authentic Token</span>
            </div>

            <div className={styles.credentialIdDisplay}>
              <span className={styles.credentialIdCode}>{mentor.credentialId}</span>
              <button 
                type="button" 
                onClick={handleCopyId} 
                className={`${styles.copyButton} ${copiedId ? styles.copied : ''}`}
              >
                {copiedId ? (
                  <>
                    <Check size={14} />
                    <span>ID Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy Credential ID</span>
                  </>
                )}
              </button>
            </div>

            {/* Official Verification Recognition Statement */}
            <div className={styles.officialStatementBox}>
              <CheckCircle2 size={20} color="#34d399" style={{ flexShrink: 0, marginTop: '2px' }} />
              <p className={styles.officialStatementText}>
                <strong>Official Verification:</strong> {mentor.verificationStatement}
              </p>
            </div>
          </div>

          {/* Certificate Metadata Specs Grid */}
          <div className={styles.certMetaGrid}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Recognition Category</span>
              <span className={styles.metaValue}>{mentor.role}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Verification Status</span>
              <span className={`${styles.metaValue} ${styles.metaValueWithDot}`}>
                <span className={styles.livePulseDot} style={{ width: 6, height: 6 }} />
                Active &amp; Recognized
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Issue Date</span>
              <span className={styles.metaValue}>{mentor.issueDate}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>Issuing Authority</span>
              <span className={styles.metaValue}>Hacker&apos;s Unity Central Board</span>
            </div>
          </div>

          {/* Security Hash & Signature Seal */}
          <div className={styles.certSecurityFooter}>
            <div className={styles.securityHashGroup}>
              <Lock size={12} />
              <span>RECORD REF: {mentor.slug.toUpperCase()}</span>
            </div>
            <div className={styles.issuerSignature}>
              <span className={styles.issuerEmblem}>HACKER&apos;S UNITY VERIFIED</span>
              <span className={styles.stampBadge}>OFFICIAL SEAL</span>
            </div>
          </div>
        </div>

        {/* ===================================================================
            Key Highlights Counter Bar
            =================================================================== */}
        {mentor.highlights && mentor.highlights.length > 0 && (
          <div className={styles.highlightsGrid}>
            {mentor.highlights.map((item, idx) => (
              <div key={idx} className={styles.highlightCard}>
                <div className={styles.highlightValue}>{item.value}</div>
                <div className={styles.highlightLabel}>{item.label}</div>
                <div className={styles.highlightDesc}>{item.desc}</div>
              </div>
            ))}
          </div>
        )}

        {/* ===================================================================
            Detailed Sections: About, Technical Expertise, Jury Track Record
            =================================================================== */}
        <div className={styles.sectionsLayout}>
          {/* 1. About Mentor */}
          <section className={styles.contentCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionIconWrapper}>
                <Briefcase size={20} />
              </div>
              <h2 className={styles.sectionTitle}>About {mentor.shortName || mentor.name}</h2>
            </div>

            <div className={styles.aboutParagraphs}>
              {Array.isArray(mentor.about) ? (
                mentor.about.map((p, i) => (
                  <p key={i} className={styles.aboutText}>{p}</p>
                ))
              ) : (
                <p className={styles.aboutText}>{mentor.about}</p>
              )}
            </div>

            {mentor.quote && (
              <div className={styles.quoteBox}>
                &ldquo;{mentor.quote}&rdquo;
              </div>
            )}
          </section>

          {/* 2. Technical Expertise & Solution Architecture */}
          {mentor.expertise && mentor.expertise.length > 0 && (
            <section className={styles.contentCard}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIconWrapper}>
                  <Layers size={20} />
                </div>
                <h2 className={styles.sectionTitle}>Technical Expertise &amp; Core Domains</h2>
              </div>

              <div className={styles.expertiseGrid}>
                {mentor.expertise.map((exp, idx) => (
                  <div key={idx} className={styles.expertiseItem}>
                    <h3 className={styles.expertiseItemTitle}>
                      <span className={styles.bulletDot} />
                      {exp.title}
                    </h3>
                    <p className={styles.expertiseItemDesc}>{exp.desc}</p>
                  </div>
                ))}
              </div>

              {mentor.skills && mentor.skills.length > 0 && (
                <div style={{ marginTop: '24px' }}>
                  <span className={styles.metaLabel} style={{ display: 'block', marginBottom: '8px' }}>
                    Core Technology Stack &amp; Methodologies
                  </span>
                  <div className={styles.skillsWrap}>
                    {mentor.skills.map((skill, idx) => (
                      <span key={idx} className={styles.skillPill}>
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          )}

          {/* 3. Proven Capabilities */}
          {mentor.provenCapabilities && mentor.provenCapabilities.length > 0 && (
            <section className={styles.contentCard}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIconWrapper}>
                  <Terminal size={20} />
                </div>
                <h2 className={styles.sectionTitle}>Key Strengths &amp; Proven Capabilities</h2>
              </div>

              <div className={styles.capabilitiesList}>
                {mentor.provenCapabilities.map((cap, idx) => (
                  <div key={idx} className={styles.capabilityItem}>
                    <CheckCircle2 size={18} className={styles.capabilityCheckIcon} />
                    <span>{cap}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 4. Hackathon Jury & Community Mentorship Track Record */}
          {mentor.juryEvents && mentor.juryEvents.length > 0 && (
            <section className={styles.contentCard}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIconWrapper}>
                  <Award size={20} />
                </div>
                <h2 className={styles.sectionTitle}>Hackathon Jury &amp; Reviewer Engagements</h2>
              </div>

              <div className={styles.juryGrid}>
                {mentor.juryEvents.map((evt, idx) => (
                  <div key={idx} className={styles.juryCard}>
                    <div className={styles.juryInfo}>
                      <span className={styles.juryName}>{evt.name}</span>
                      <span className={styles.juryRole}>{evt.role}</span>
                    </div>
                    {evt.tag && <span className={styles.juryBadge}>{evt.tag}</span>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 5. Current Innovations & Building */}
          {mentor.currentBuilding && mentor.currentBuilding.length > 0 && (
            <section className={styles.contentCard}>
              <div className={styles.sectionHeader}>
                <div className={styles.sectionIconWrapper}>
                  <Cpu size={20} />
                </div>
                <h2 className={styles.sectionTitle}>Current Innovations &amp; Focus Areas</h2>
              </div>

              <div className={styles.buildingGrid}>
                {mentor.currentBuilding.map((item, idx) => (
                  <div key={idx} className={styles.buildingCard}>
                    <h3 className={styles.buildingCardTitle}>{item.title}</h3>
                    <p className={styles.buildingCardDesc}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ===================================================================
            Official Notice & Verification Confirmation Card
            =================================================================== */}
        <div className={styles.officialNoticeCard}>
          <div className={styles.noticeLeft} style={{ maxWidth: '100%' }}>
            <div className={styles.shieldIconLarge}>
              <ShieldCheck size={28} />
            </div>
            <div>
              <h3 className={styles.noticeTitle}>Official Hacker&apos;s Unity Recognition Document</h3>
              <p className={styles.noticeText}>
                This official credential is cryptographically tied to the unique identifier <strong>{mentor.credentialId}</strong>. 
                Any modification, alteration, or unauthorized reproduction is strictly prohibited under Hacker&apos;s Unity verified standards.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

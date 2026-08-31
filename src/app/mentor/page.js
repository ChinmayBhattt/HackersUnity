'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ShieldCheck, Search, Award, Lock, ArrowRight } from 'lucide-react';
import styles from './[slug]/credential.module.css';

export default function MentorLookupPortal() {
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSearch = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setError('Please enter a valid Credential ID or Slug.');
      return;
    }
    setError('');
    router.push(`/mentor/${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className={styles.pageContainer}>
      <div className={styles.gridBackground} />
      <div className={styles.glowOrb1} />
      <div className={styles.glowOrb2} />

      <div className={styles.wrapper} style={{ maxWidth: '640px', marginTop: '40px' }}>
        <div className={styles.credentialDoc} style={{ textAlign: 'center', padding: '48px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <div className={styles.sealIcon} style={{ width: '64px', height: '64px' }}>
              <ShieldCheck size={36} color="#34d399" />
            </div>
          </div>

          <span className={styles.brandSubtitle} style={{ display: 'block', marginBottom: '8px' }}>
            Official Verification Portal
          </span>

          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', color: 'var(--text-primary)', marginBottom: '12px' }}>
            Hacker&apos;s Unity Mentor Registry
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', lineHeight: '1.6', marginBottom: '32px' }}>
            Enter the unique Credential ID or URL token to independently verify the official mentor status and credentials recognized by Hacker&apos;s Unity.
          </p>

          <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="e.g. mentor-stf4w4sdg883..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  background: '#FFFFFF',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  fontSize: '15px',
                  fontFamily: 'var(--font-mono)',
                  outline: 'none',
                  boxShadow: 'inset 0 1px 3px rgba(15, 23, 42, 0.05)',
                }}
              />
            </div>

            {error && (
              <p style={{ color: 'var(--danger)', fontSize: '13px', textAlign: 'left' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '15px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                borderRadius: '10px',
              }}
            >
              <Search size={16} />
              <span>Verify Credential</span>
              <ArrowRight size={16} />
            </button>
          </form>

          <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-dim)', fontSize: '12px' }}>
            <Lock size={12} />
            <span>Encrypted Verification • Official Central Registry</span>
          </div>
        </div>
      </div>
    </div>
  );
}

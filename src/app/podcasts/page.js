import SectionHeading from '@/components/SectionHeading';
import AnimatedSection from '@/components/AnimatedSection';
import { podcasts } from '@/data/podcasts';
import styles from './podcasts.module.css';

export const metadata = {
  title: "Industry Insider Podcast — Hacker's Unity",
  description: "Real conversations with builders, founders and industry leaders.",
};

const YTIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

export default function PodcastsPage() {
  return (
    <>
      <section className={styles.hero}>
        <div className="container">
          <AnimatedSection>
            <SectionHeading
              label="Podcast"
              title="Industry Insider"
              subtitle="Real conversations with builders, founders and industry leaders"
            />
            <div className={styles.ytLink}>
              <a
                href="https://www.youtube.com/@hackerunity"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                <YTIcon /> Visit our YouTube Channel
              </a>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <AnimatedSection>
            <div className={styles.grid}>
              {podcasts.map((p) => (
                <div key={p.id} className={styles.card}>
                  <div className={styles.thumbnail}>
                    {p.thumbnail ? (
                      <img src={p.thumbnail} alt={p.title} className={styles.thumbnailImg} />
                    ) : (
                      <div className={styles.thumbnailPlaceholder}>
                        <span className={styles.placeholderIcon}>🎙️</span>
                      </div>
                    )}
                  </div>
                  <div className={styles.body}>
                    <div className={styles.guest}>
                      <div className={styles.episodePill}>{p.episode}</div>
                      <div>
                        <div className={styles.guestName}>{p.guest}</div>
                        <div className={styles.guestDesig}>{p.designation}</div>
                      </div>
                    </div>
                    <h3 className={styles.title}>{p.title}</h3>
                    <p className={styles.summary}>{p.summary}</p>
                    <a
                      href={p.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.ytBtn}
                    >
                      <YTIcon /> Watch on YouTube
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>
    </>
  );
  }

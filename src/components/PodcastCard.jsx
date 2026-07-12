import styles from './PodcastCard.module.css';

export default function PodcastCard({ podcast }) {
  return (
    <div className={styles.card}>
      <div className={styles.thumbnail}>
        {podcast.thumbnail ? (
          <img src={podcast.thumbnail} alt={podcast.title} className={styles.thumbnailImg} />
        ) : (
          <div className={styles.thumbnailPlaceholder}>
            <span className={styles.placeholderIcon}>🎙️</span>
          </div>
        )}
      </div>
      <div className={styles.body}>
        <div className={styles.guest}>
          <div className={styles.episodePill}>{podcast.episode}</div>
          <div>
            <div className={styles.guestName}>{podcast.guest}</div>
            <div className={styles.guestDesig}>{podcast.designation}</div>
          </div>
        </div>
        <h3 className={styles.title}>{podcast.title}</h3>
        <p className={styles.summary}>{podcast.summary}</p>
        <a
          href={podcast.youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.ytBtn}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
          Watch on YouTube
        </a>
      </div>
    </div>
  );
}

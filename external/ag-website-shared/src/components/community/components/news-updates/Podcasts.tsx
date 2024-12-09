import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';

import styles from './Podcasts.module.scss';

const Podcasts = ({ podcasts }) => {
    const guestsToString = (arr) => {
        if (!arr.length) return '';
        if (arr.length === 1) return arr[0];
        return arr.slice(0, -1).join(', ') + ' & ' + arr[arr.length - 1];
    };

    return (
        <>
            <div className={styles.container}>
                {podcasts.map((podcast, index) => (
                    <a href={podcast.website} target="_blank" className={styles.podcastContainer} key={index}>
                        <div className={styles.podcastDetailsContainer}>
                            <div className={styles.titleContainer}>
                                <span className={styles.title}>{podcast.title}</span>
                                <span className={styles.published}>{podcast.published}</span>
                            </div>
                            <span className={styles.description}>{podcast.description}</span>
                            <div className={styles.creditsContainer}>
                                <img
                                    className={styles.publicationLogo}
                                    src={urlWithBaseUrl(`/community/podcasts/${podcast.publicationLogo}`)}
                                    alt={`${podcast.publicationLogo} logo`}
                                />
                                <span className={styles.publication}>{podcast.publication}</span>
                                <span className={styles.host}>{podcast.host}</span>
                                <span className={styles.guests}>{guestsToString(podcast.guests)}</span>
                            </div>
                        </div>
                        <div className={styles.podcastPlayerContainer}>
                            <audio controls src={urlWithBaseUrl(podcast.link)}>
                                Your browser does not support the audio element.
                            </audio>
                        </div>
                    </a>
                ))}
            </div>
        </>
    );
};

export default Podcasts;

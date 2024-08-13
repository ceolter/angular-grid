import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';
import { useState } from 'react';

import styles from './Videos.module.scss';

export interface Video {
    title: string;
    link: string;
    description: string;
    author: string;
    type: 'Video' | 'Workshop';
    published: string;
    thumbnail?: string;
    id?: string;
}

const Videos = ({ videos }: { videos: Video[] }) => {
    const [currentVideo, setCurrentVideo] = useState(videos[0]);
    const handleVideoSelect = (video: Video) => {
        setCurrentVideo(video);
    };

    return (
        <div>
            <div className={styles.container}>
                <div className={styles.leftColumn}>
                    <h2>{currentVideo.title}</h2>
                    <p>{currentVideo.description}</p>
                </div>
                <div className={styles.rightColumn}>
                    {/* TODO: GitNation Portal Support */}
                    {!currentVideo.id ? (
                        <img
                            className={styles.videoImage}
                            src={urlWithBaseUrl(currentVideo.thumbnail)}
                            alt="Video thumbnail"
                            onClick={() => window.open(currentVideo.link, '_blank')}
                        />
                    ) : (
                        <iframe
                            className={styles.videoFrame}
                            src={currentVideo.link}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            referrerPolicy="strict-origin-when-cross-origin"
                            sandbox
                            allowFullScreen
                        ></iframe>
                    )}
                </div>
            </div>
            <div className={styles.videoContainer}>
                {videos.map((video, index) => (
                    <div
                        key={index}
                        onClick={() => handleVideoSelect(video)}
                        className={`${styles.video} ${videos.indexOf(currentVideo) === index ? styles.active : ''}`}
                    >
                        {/* TODO: GitNation Portal Support */}
                        {video.id ? (
                            <img src={video.thumbnail} alt="Video thumbnail" className={styles.youtubeThumbnail} />
                        ) : (
                            <img
                                src={urlWithBaseUrl(video.thumbnail)}
                                alt="Video thumbnail"
                                className={styles.videoThumbnail}
                            />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Videos;

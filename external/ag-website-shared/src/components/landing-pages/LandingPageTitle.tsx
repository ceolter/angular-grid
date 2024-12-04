import type { FunctionComponent } from 'react';
import { useEffect, useMemo, useState } from 'react';

import styles from './LandingPageTitle.module.scss';

export const LandingPageTitle: FunctionComponent = () => {
    const animatedWords = ['JavaScript', 'React', 'Angular', 'Vue'];
    const wordColors: Record<string, string> = {
        JavaScript: '#F7DF1E', // Yellow
        React: '#61DAFB', // Light Blue
        Angular: `linear-gradient(90deg, #E40035, #F60A48 24%, #F20755 35%, #DC087D 49%, #9717E7 74%, #6C00F5 100%)`,
        Vue: '#42B883', // Green
    };

    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    // Calculate the longest word's length for fixed container width
    const maxWordLength = useMemo(() => Math.max(...animatedWords.map((word) => word.length)), [animatedWords]);

    useEffect(() => {
        if (isPaused) {
            const pauseTimeout = setTimeout(() => setIsPaused(false), 1000); // Pause duration
            return () => clearTimeout(pauseTimeout);
        }

        const typeSpeed = isDeleting ? 100 : 150; // Speed of typing and deleting
        const pauseTime = 1000; // Pause at the end of typing

        const currentWord = animatedWords[currentWordIndex];

        if (!isDeleting && displayedText === currentWord) {
            setTimeout(() => setIsDeleting(true), pauseTime);
        } else if (isDeleting && displayedText === '') {
            setIsPaused(true); // Pause before typing the next word
            setIsDeleting(false);
            setCurrentWordIndex((prevIndex) => (prevIndex + 1) % animatedWords.length);
        } else {
            const nextText = isDeleting
                ? currentWord.slice(0, displayedText.length - 1)
                : currentWord.slice(0, displayedText.length + 1);

            const timeout = setTimeout(() => {
                setDisplayedText(nextText);
            }, typeSpeed);

            return () => clearTimeout(timeout);
        }
    }, [displayedText, isDeleting, isPaused, currentWordIndex]);

    const currentWord = animatedWords[currentWordIndex];
    const wordClass = styles[currentWord.toLowerCase()] || styles.default;

    return (
        <h1 className="text-xl">
            The Best <span className={`${styles.typewriter} ${wordClass}`}>{displayedText}</span>
            <span className={styles.cursor}></span>
            <br />
            Grid in the World
        </h1>
    );
};

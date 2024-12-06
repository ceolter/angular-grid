import type { FunctionComponent } from 'react';
import { useEffect, useMemo, useState } from 'react';

import styles from './LandingPageAnimatedHeader.module.scss';

export const LandingPageAnimatedHeader: FunctionComponent = () => {
    const animatedWords = ['JavaScript', 'React', 'Angular', 'Vue'];
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [isPaused, setIsPaused] = useState(false);

    // Calculate the longest word's length for fixed container width
    const maxWordLength = useMemo(() => Math.max(...animatedWords.map((word) => word.length)), [animatedWords]);

    useEffect(() => {
        const typeSpeed = !isDeleting ? 125 : 75; // Speed of typing and deleting
        const pauseTime = 750; // Pause at the end of typing

        if (isPaused) {
            const pauseTimeout = setTimeout(() => setIsPaused(false), pauseTime); // Pause duration
            return () => clearTimeout(pauseTimeout);
        }

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
            <span>
                The Best
                <span className={styles.animatedWordsContainer}>
                    <span className={`${styles.typewriter} ${wordClass}`}>{displayedText}</span>
                    <span className={styles.cursor}></span>
                </span>
                <br />
                Grid in the World
            </span>
        </h1>
    );
};

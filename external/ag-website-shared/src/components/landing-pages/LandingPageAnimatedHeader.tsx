import classnames from 'classnames';
import type { FunctionComponent } from 'react';
import { useEffect, useState } from 'react';

import styles from './LandingPageAnimatedHeader.module.scss';

const WORDS = ['Javascript', 'Vue', 'Angular', 'React'];

export const LandingPageAnimatedHeader: FunctionComponent = () => {
    const [wordIndex, setWordIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        const advanceWord = () => {
            setIsTransitioning(true);

            setTimeout(() => {
                setWordIndex((prevIndex) => (prevIndex + 1) % WORDS.length);
                setIsTransitioning(false);
            }, 500);
        };

        const interval = setInterval(advanceWord, 2500);

        return () => clearInterval(interval);
    }, []);

    return (
        <h1 className="text-xl">
            <span className={styles.topLine}>
                The Best
                <span className={styles.animatedWordsContainer}>
                    <span
                        className={classnames(styles.animatedWord, styles[WORDS[wordIndex].toLowerCase()])}
                        style={{
                            opacity: isTransitioning ? 0 : 1,
                            filter: isTransitioning ? 'blur(10px)' : 'blur(0)',
                            transform: isTransitioning ? 'translateY(20px)' : 'translateY(0)',
                        }}
                    >
                        {WORDS[wordIndex]}
                    </span>
                </span>
            </span>
            <br />
            Grid in the World
        </h1>
    );
};

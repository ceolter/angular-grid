import classnames from 'classnames';
import type { FunctionComponent } from 'react';
import { useEffect, useState } from 'react';

import styles from './LandingPageAnimatedHeader.module.scss';

export const LandingPageAnimatedHeader: FunctionComponent = () => {
    const [wordIndex, setWordIndex] = useState(0);
    const [noTransitions, setNoTransitions] = useState(false);

    useEffect(() => {
        const delayMs = wordIndex === 0 ? 50 : 1250;

        const timeout = setTimeout(() => {
            const nextWordIndex = (wordIndex + 1) % 5;
            setNoTransitions(nextWordIndex === 0);
            setWordIndex(nextWordIndex);
        }, delayMs);

        return () => clearTimeout(timeout);
    }, [wordIndex]);

    return (
        <h1 className="text-xl">
            <span className={styles.topLine}>
                The Best
                <span
                    className={classnames(styles.animatedWordsOuter, { 'no-transitions': noTransitions })}
                    style={{ '--word-index': wordIndex }}
                >
                    <span className={styles.animatedWordsInner}>
                        <span className={styles.animatedWord}>Javascript</span>
                        <span className={styles.animatedWord}>Vue</span>
                        <span className={styles.animatedWord}>Angular</span>
                        <span className={styles.animatedWord}>React</span>
                        <span className={styles.animatedWord}>Javascript</span>
                    </span>
                </span>
            </span>
            Grid in the World
        </h1>
    );
};

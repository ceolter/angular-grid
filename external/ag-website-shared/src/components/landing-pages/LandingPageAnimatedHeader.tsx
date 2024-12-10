import classnames from 'classnames';
import type { FunctionComponent } from 'react';
import { useEffect, useState } from 'react';

import styles from './LandingPageAnimatedHeader.module.scss';

export const LandingPageAnimatedHeader: FunctionComponent = () => {
    const [wordIndex, setWordIndex] = useState(0);
    const [noTransitions, setNoTransitions] = useState(false);

    useEffect(() => {
        const advanceWord = () => {
            if (wordIndex > 3) {
                setNoTransitions(true);
                setWordIndex(0);
            } else {
                setNoTransitions(false);
                setWordIndex(wordIndex + 1);
            }
        };

        //Implementing the setInterval method
        const interval = setInterval(() => {
            advanceWord();

            if (wordIndex === 0) advanceWord();
        }, 666);

        //Clearing the interval
        return () => clearInterval(interval);
    }, [wordIndex]);

    return (
        <h1 className="text-xl">
            <span className={styles.topLine}>
                The Best
                <span
                    className={classnames(styles.animatedWordsOuter, { ['no-transitions']: noTransitions })}
                    style={{ ['--word-index']: wordIndex }}
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
            <br />
            Grid in the World
        </h1>
    );
};

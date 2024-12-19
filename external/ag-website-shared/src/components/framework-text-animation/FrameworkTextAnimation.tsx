import classnames from 'classnames';
import type { FunctionComponent } from 'react';
import { useEffect, useState } from 'react';

import styles from './FrameworkTextAnimation.module.scss';

export const FrameworkTextAnimation: FunctionComponent = () => {
    const [wordIndex, setWordIndex] = useState(0);
    const [noTransitions, setNoTransitions] = useState(false);

    useEffect(() => {
        const delayMs = wordIndex === 0 ? 50 : 2500;

        const timeout = setTimeout(() => {
            const nextWordIndex = (wordIndex + 1) % 5;
            setNoTransitions(nextWordIndex === 0);
            setWordIndex(nextWordIndex);
        }, delayMs);

        return () => clearTimeout(timeout);
    }, [wordIndex]);

    return (
        <span
            className={classnames(styles.animatedWordsOuter, { 'no-transitions': noTransitions })}
            style={{ '--word-index': wordIndex }}
        >
            <span className={styles.animatedWordsInner}>
                <span className={classnames(styles.animatedWord, styles.javascript)}>Javascript</span>
                <span className={classnames(styles.animatedWord, styles.vue)}>Vue</span>
                <span className={classnames(styles.animatedWord, styles.angular)}>Angular</span>
                <span className={classnames(styles.animatedWord, styles.react)}>React</span>
                <span className={classnames(styles.animatedWord, styles.javascript)}>Javascript</span>
            </span>
        </span>
    );
};

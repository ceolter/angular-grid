import classnames from 'classnames';
import type { FunctionComponent } from 'react';
import { useEffect, useState } from 'react';

import styles from './FrameworkTextAnimation.module.scss';

interface Props {
    prefix?: string;
    suffix?: string;
}

export const FrameworkTextAnimation: FunctionComponent<Props> = ({ prefix, suffix }) => {
    const [wordIndex, setWordIndex] = useState(0);
    const [noTransitions, setNoTransitions] = useState(false);

    prefix = prefix ? `${prefix} ` : '';
    suffix = suffix ? ` ${suffix}` : '';

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
                <span className={styles.javascript}>{`${prefix}Javascript${suffix}`}</span>
                <span className={styles.vue}>{`${prefix}Vue${suffix}`}</span>
                <span className={styles.angular}>{`${prefix}Angular${suffix}`}</span>
                <span className={styles.react}>{`${prefix}React${suffix}`}</span>
                <span className={styles.javascript}>{`${prefix}Javascript${suffix}`}</span>
            </span>
        </span>
    );
};

import { Icon } from '@ag-website-shared/components/icon/Icon';
import type { FunctionComponent, MouseEventHandler, ReactNode } from 'react';

import styles from './OpenInCTA.module.scss';

type CtaType = 'newTab' | 'plunker' | 'stackblitz' | 'codesandbox';

type BaseProps = {
    type: CtaType;
    tracking?: () => void;
};

type ButtonProps = BaseProps & {
    onClick: MouseEventHandler<HTMLButtonElement>;
};

type LinkProps = BaseProps & {
    href: string;
};

type Props = ButtonProps | LinkProps;

const DISPLAY_NAME: Record<CtaType, string> = {
    newTab: 'New Tab',
    plunker: 'Plunker',
    stackblitz: 'StackBlitz',
    codesandbox: 'CodeSandbox',
};

const TOOLTIPS: Record<CtaType, ReactNode> = {
    newTab: (
        <>
            <span className={styles.tooltip}>{DISPLAY_NAME.newTab}</span>
        </>
    ),
    plunker: (
        <>
            <span className={styles.tooltip}>{DISPLAY_NAME.plunker}</span>
        </>
    ),
    stackblitz: (
        <>
            <span className={styles.tooltip}>{DISPLAY_NAME.stackblitz}</span>
        </>
    ),
    codesandbox: (
        <>
            <span className={styles.tooltip}>{DISPLAY_NAME.codesandbox}</span>
        </>
    ),
};

export const OpenInCTA: FunctionComponent<Props> = (props) => {
    const { type, tracking } = props;
    const tooltip = TOOLTIPS[type];

    const isButton = Boolean((props as ButtonProps).onClick);

    if (isButton) {
        const { onClick } = props as ButtonProps;
        return (
            <span className={styles.cta}>
                {tooltip}
                <button
                    className="button-style-none"
                    aria-label={DISPLAY_NAME[type]}
                    onClick={(event) => {
                        onClick(event);
                        tracking?.();
                    }}
                >
                    <Icon name={type} />
                </button>
            </span>
        );
    } else {
        const { href } = props as LinkProps;
        return (
            <span className={styles.cta}>
                {tooltip}
                <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => {
                        tracking?.();
                    }}
                    aria-label={DISPLAY_NAME[type]}
                >
                    <Icon name={type} />
                </a>
            </span>
        );
    }
};

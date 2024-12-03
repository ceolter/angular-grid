import { Icon } from '@ag-website-shared/components/icon/Icon';
import classnames from 'classnames';
import type { FunctionComponent } from 'react';

import styles from './ToggleAutomatedExampleButton.module.scss';

interface Props {
    isHoveredOver: boolean;
    onClick?: () => void;
    scriptIsActive: boolean;
}

export const ToggleAutomatedExampleButton: FunctionComponent<Props> = ({ isHoveredOver, onClick, scriptIsActive }) => {
    return (
        <span className={styles.buttonOuter}>
            <button
                className={classnames(styles.button, 'text-lg', {
                    hover: isHoveredOver,
                    [styles.isActive]: scriptIsActive,
                })}
                onClick={() => {
                    onClick?.();
                }}
            >
                <span className={styles.controlInner}>
                    Give me control <Icon name="takeControl" />{' '}
                </span>

                <span className={styles.replayInner}>
                    Replay demo <Icon name="replaydemo" />{' '}
                </span>
            </button>
        </span>
    );
};

import { Icon } from '@ag-website-shared/components/icon/Icon';
import classNames from 'classnames';
import type { FunctionComponent, ReactNode } from 'react';

import styles from './Alert.module.scss';

interface Props {
    type: 'info' | 'idea' | 'warning' | 'success' | 'default' | 'module';
    children: ReactNode;
    className?: string;
}

export const Alert: FunctionComponent<Props> = ({ type = 'default', children, className }) => {
    let icon = type;

    if (type === 'success') {
        icon = 'tick';
    } else if (type === 'default') {
        icon = null;
    }

    return (
        <>
            {type === 'module' ? (
                <div className={styles.moduleWrapper}>
                    <div className={classNames('alert', styles.alert, styles.module, styles[type], className)}>
                        <Icon name="info" />
                        <div className={styles.content}>{children}</div>
                    </div>

                    <div className={styles.moduleLink}>
                        <div>
                            <a href="https://ag-grid.com/react-data-grid/modules/">
                                See Module Selector <Icon name="chevronRight" />
                            </a>{' '}
                        </div>
                    </div>
                </div>
            ) : (
                <div
                    className={classNames(
                        'alert',
                        styles.alert,
                        styles[type],

                        className
                    )}
                >
                    {icon && <Icon name={icon} />}

                    <div className={styles.content}>{children}</div>
                </div>
            )}
        </>
    );
};

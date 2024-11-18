import classnames from 'classnames';
import React from 'react';

import styles from './CustomerLogos.module.scss';

export const CustomerLogos: React.FC = () => {
    return (
        <div className={classnames(styles.customerLogosOuter, 'layout-max-width-small')}>
            <div className={styles.customerLogos}></div>
            <p className="text-tertiary">
                Trusted by the finest teams globally, an unmatched experience for developers and users alike.
            </p>
        </div>
    );
};

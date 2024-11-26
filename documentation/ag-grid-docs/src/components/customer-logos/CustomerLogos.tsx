import classnames from 'classnames';
import React from 'react';

import styles from './CustomerLogos.module.scss';

export const CustomerLogos: React.FC = () => {
    return (
        <div className={classnames(styles.customerLogosOuter, 'layout-max-width-small')}>
            <div className={styles.customerLogos}></div>
        </div>
    );
};

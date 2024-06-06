import { type FunctionComponent } from 'react';

import { getResourceUrl } from '../../utils/getResourceUrl';
import styles from './ActionsCellRenderer.module.css';

export const ActionsCellRenderer: FunctionComponent = () => {
    const imgSrc = getResourceUrl(`/example/finance/icons/documentation.svg`);
    return (
        <button className={`button-secondary ${styles.advice}`}>
            <img src={imgSrc} className={styles.adviceIcon} alt="Documentation icon" />
        </button>
    );
};

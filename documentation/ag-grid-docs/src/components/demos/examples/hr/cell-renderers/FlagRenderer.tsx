import type { CustomCellRendererProps } from '@ag-grid-community/react';
import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';
import { type FunctionComponent } from 'react';

import styles from './FlagRenderer.module.css';

export const FlagRenderer: FunctionComponent<CustomCellRendererProps> = ({ value, data: { flag } }) => (
    <div className={styles.flagCell}>
        <div className={styles.employeeData}>
            <span>{value}</span>
        </div>
        <img className={styles.image} src={urlWithBaseUrl(`/example/hr/${flag}.svg`)} alt={value.toLowerCase()} />
    </div>
);

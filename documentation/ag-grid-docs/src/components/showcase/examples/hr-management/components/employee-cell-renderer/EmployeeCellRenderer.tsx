import { getResourceUrl } from '@components/showcase/examples/portfolio-positions/utils/getResourceUrl';
import { type FunctionComponent } from 'react';

import type { CustomCellRendererProps } from 'ag-grid-react';

import styles from './EmployeeCellRenderer.module.css';

export const EmployeeCellRenderer: FunctionComponent<CustomCellRendererProps> = ({ value, data }) => {
    const tickerNormal = value;
    const number = data.image;
    const title = data.jobTitle;
    const imgSrc = getResourceUrl(`/example/hr/${number}.png`);

    const alt = value.toLowerCase();

    return (
        <div className={styles.employeeCell}>
            <div className={styles.employeeData}>
                <span>{tickerNormal}</span>
                <span className={styles.description}>{title}</span>
            </div>
            <img className={styles.image} src={imgSrc} alt={alt} />
        </div>
    );
};

import { getResourceUrl } from '@components/demos/examples/portfolio-positions/utils/getResourceUrl';
import { type FunctionComponent } from 'react';

import type { CustomCellRendererProps } from 'ag-grid-react';

import styles from './FlagRenderer.module.css';

export const FlagRenderer: FunctionComponent<CustomCellRendererProps> = ({ data }) => {
    const flag = data.flag;
    const location = data.location;
    const imgSrc = getResourceUrl(`/example/hr/${flag}.svg`);

    return (
        <div className={styles.flagCell}>
            <div className={styles.employeeData}>
                <span>{location}</span>
            </div>
            <img className={styles.image} src={imgSrc} alt={location} />
        </div>
    );
};

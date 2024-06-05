import { type FunctionComponent } from 'react';

import type { CustomCellRendererProps } from 'ag-grid-react';

import styles from './StatusCellRenderer.module.css';

export const StatusCellRenderer: FunctionComponent<CustomCellRendererProps> = ({ data }) => {
    const status = data.status;
    let containerClass: string = '';
    let circleClass: string = '';

    // Assign different classes based on the status
    switch (status) {
        case 'Out of Stock':
            containerClass = styles.outOfStockTag;
            circleClass = styles.outOfStockCircle;
            break;
        case 'Active':
            containerClass = styles.activeTag;
            circleClass = styles.activeCircle;
            break;
        case 'Paused':
            containerClass = styles.pausedTag;
            circleClass = styles.pausedCircle;
            break;
        default:
            containerClass = styles.defaultTag; // Optional: for statuses not listed
            circleClass = styles.defaultCircle;
    }

    return (
        <div className={`${styles.tag} ${containerClass}`}>
            <div className={`${styles.circle} ${circleClass}`}></div>
            <span>{status}</span>
        </div>
    );
};

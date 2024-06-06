import { type FunctionComponent } from 'react';

import type { CustomCellRendererProps } from 'ag-grid-react';

import styles from './TagCellRenderer.module.css';

export const TagCellRenderer: FunctionComponent<CustomCellRendererProps> = ({ data }) => {
    const department = data.department;
    let containerClass: string = '';
    let circleClass: string = '';

    // Assign different classes based on the department name
    switch (department) {
        case 'Design':
            containerClass = styles.designTag;
            circleClass = styles.designCircle;
            break;
        case 'Engineering':
            containerClass = styles.engineeringTag;
            circleClass = styles.engineeringCircle;
            break;
        case 'Executive Management':
            containerClass = styles.executiveManagementTag;
            circleClass = styles.executiveManagementCircle;
            break;
        case 'Product':
            containerClass = styles.productTag;
            circleClass = styles.productCircle;
            break;
        default:
            containerClass = styles.defaultTag; // Optional: for departments not listed
            circleClass = styles.defaultCircle;
    }

    return (
        <div className={`${styles.tag} ${containerClass}`}>
            <div className={`${styles.circle} ${circleClass}`}></div>
            <span>{department}</span>
        </div>
    );
};

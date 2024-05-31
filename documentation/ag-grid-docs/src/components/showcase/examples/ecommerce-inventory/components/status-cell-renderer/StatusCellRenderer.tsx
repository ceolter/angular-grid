import { type FunctionComponent } from 'react';

import type { CustomCellRendererProps } from 'ag-grid-react';

import styles from './StatusCellRenderer.module.css';

export const StatusCellRenderer: FunctionComponent<CustomCellRendererProps> = ({ data }) => {
    const status = data.status;
    const activeClass = status === 'active' ? styles.activeTag : '';

    return (
        <div className={`${styles.statusCell} ${activeClass}`}>
            <div>{status}</div>
        </div>
    );
};

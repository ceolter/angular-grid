import { getResourceUrl } from '@components/showcase/examples/portfolio-positions/utils/getResourceUrl';
import { type FunctionComponent, useCallback } from 'react';

import type { CustomCellRendererProps } from 'ag-grid-react';

import styles from './ActionsCellRenderer.module.css';

export const ActionsCellRenderer: FunctionComponent<CustomCellRendererProps> = ({ api, node }) => {
    const onRemoveClick = useCallback(() => {
        const rowData = node.data;
        api.applyTransaction({ remove: [rowData] });
    }, [node, api]);
    const onStopSellingClick = useCallback(() => {
        const rowData = node.data;

        // Modify the status property to 'paused'
        rowData.status = 'Paused';

        // Refresh the row to reflect the changes
        api.applyTransaction({ update: [rowData] });
    }, [node, api]);

    return (
        <div className={styles.buttonCell}>
            <button className={`button-secondary ${styles.removeButton}`} onClick={onRemoveClick}>
                <img src={getResourceUrl(`/example/inventory/delete.svg`)} alt="Delete Icon" />
            </button>
            <button className={`button-secondary ${styles.buttonStopSelling}`} onClick={onStopSellingClick}>
                Stop selling
            </button>
        </div>
    );
};

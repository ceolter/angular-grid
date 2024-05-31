import { type FunctionComponent } from 'react';

import type { CustomCellRendererProps } from 'ag-grid-react';

import styles from './ImageCellRenderer.module.css';

export const ImageCellRenderer: FunctionComponent<CustomCellRendererProps> = () => {
    return (
        <div className={styles.productCellImage}>
            <div className={styles.imageContainer}></div>
        </div>
    );
};

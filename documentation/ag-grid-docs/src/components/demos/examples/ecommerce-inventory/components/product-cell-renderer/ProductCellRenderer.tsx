import { type FunctionComponent } from 'react';

import type { CustomCellRendererProps } from 'ag-grid-react';

import styles from './ProductCellRenderer.module.css';

export const ProductCellRenderer: FunctionComponent<CustomCellRendererProps> = ({ data }) => {
    const productName = data.product;
    const availableStock = data.available;

    return (
        <div className={styles.productCell}>
            <div>{productName}</div>
            <div className={styles.stockCell}>{availableStock} in stock</div>
        </div>
    );
};

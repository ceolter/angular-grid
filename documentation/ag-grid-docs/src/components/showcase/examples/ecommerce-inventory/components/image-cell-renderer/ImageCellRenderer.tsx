import { getResourceUrl } from '@components/showcase/examples/portfolio-positions/utils/getResourceUrl';
import { type FunctionComponent } from 'react';

import type { CustomCellRendererProps } from 'ag-grid-react';

import styles from './ImageCellRenderer.module.css';

export const ImageCellRenderer: FunctionComponent<CustomCellRendererProps> = ({ data }) => {
    const image = data.image;
    const imgSrc = getResourceUrl(`/example/inventory/${image}.png`);

    return (
        <div className={styles.productCellImage}>
            <div className={styles.imageContainer}>
                <img className={styles.image} src={imgSrc} alt={image} />
            </div>
        </div>
    );
};

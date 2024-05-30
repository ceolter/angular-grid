import { type FunctionComponent } from 'react';

import { getResourceUrl } from '../../utils/getResourceUrl';
import styles from './TickerCellRenderer.module.css';

interface Props {
    value: string;
}

export const TickerCellRenderer: FunctionComponent<Props> = ({ value }) => {
    if (!value) {
        return null;
    }
    const ticker = value.toLowerCase();
    const tickerNormal = value;
    const imgSrc = getResourceUrl(`/example/finance/logos/${ticker}.png`);

    return (
        <div>
            <img className={styles.image} src={imgSrc} alt={ticker} />
            <span>{tickerNormal}</span>
        </div>
    );
};

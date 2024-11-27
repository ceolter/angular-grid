import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';
import { type FunctionComponent } from 'react';

import type { CustomCellRendererProps } from 'ag-grid-react';

export const TickerCellRenderer: FunctionComponent<CustomCellRendererProps> = ({ data }) => {
    return (
        data && (
            <div>
                <img
                    align="center"
                    src={urlWithBaseUrl(`/example/finance/logos/${data.ticker}.png`)}
                    style={{
                        width: '20px',
                        height: '20px',
                        marginRight: '8px',
                        borderRadius: '32px',
                    }}
                />
                <span className="custom-ticker">{data.ticker}</span>
                <span className="ticker-name"> {data.name}</span>
            </div>
        )
    );
};

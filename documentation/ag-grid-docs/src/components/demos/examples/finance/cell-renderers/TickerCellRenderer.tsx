import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';
import { type FunctionComponent } from 'react';

import type { CustomCellRendererProps } from 'ag-grid-react';

export const TickerCellRenderer: FunctionComponent<CustomCellRendererProps> = ({ data, isSmallerGrid }) => {
    return (
        data && (
            <div>
                <img
                    src={urlWithBaseUrl(`/example/finance/logos/${data.ticker}.png`)}
                    style={{
                        width: '20px',
                        height: '20px',
                        marginRight: '5px',
                        borderRadius: '32px',
                    }}
                />
                <b className="custom-ticker">{data.ticker}</b>
                {isSmallerGrid && <span className="ticker-name"> {data.name}</span>}
            </div>
        )
    );
};

import { urlWithBaseUrl } from '@utils/urlWithBaseUrl';
import { type FunctionComponent } from 'react';

import type { CustomCellRendererProps } from 'ag-grid-react';

export const getTickerCellRenderer: (hideTickerName: boolean) => FunctionComponent<CustomCellRendererProps> =
    (hideTickerName) =>
    ({ data }) => {
        return (
            data && (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                    }}
                >
                    <img
                        src={urlWithBaseUrl(`/example/finance/logos/${data.ticker}.png`)}
                        style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '32px',
                        }}
                        alt={`${data.name} logo`}
                    />
                    <b className="custom-ticker">{data.ticker}</b>
                    {!hideTickerName && <span className="ticker-name"> {data.name}</span>}
                </div>
            )
        );
    };

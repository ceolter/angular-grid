import { type FunctionComponent } from 'react';

import {
    CellStyleModule,
    ClientSideRowModelModule,
    ColumnAutoSizeModule,
    QuickFilterModule,
    RowAutoHeightModule,
    TextFilterModule,
    TooltipModule,
} from 'ag-grid-community';
import {
    AdvancedFilterModule,
    ColumnsToolPanelModule,
    MasterDetailModule,
    SetFilterModule,
    StatusBarModule,
} from 'ag-grid-enterprise';
import { AgGridReact, type AgGridReactProps } from 'ag-grid-react';

import styles from './Grid.module.scss';

type Props = {
    gridHeight: string;
} & AgGridReactProps;

export const Grid: FunctionComponent<Props> = ({ gridHeight, ...props }) => {
    return (
        <div className={styles.grid} style={{ width: '100%', height: gridHeight }}>
            <AgGridReact
                loading={false}
                suppressNoRowsOverlay={true}
                {...props}
                modules={[
                    RowAutoHeightModule,
                    TextFilterModule,
                    CellStyleModule,
                    ColumnAutoSizeModule,
                    QuickFilterModule,
                    ClientSideRowModelModule,
                    TooltipModule,
                    AdvancedFilterModule,
                    MasterDetailModule,
                    SetFilterModule,
                    ColumnsToolPanelModule,
                    StatusBarModule,
                ]}
                statusBar={{
                    statusPanels: [
                        {
                            statusPanel: 'agTotalAndFilteredRowCountComponent',
                            align: 'left',
                        },
                        {
                            statusPanel: 'agTotalRowCountComponent',
                            align: 'center',
                        },
                        { statusPanel: 'agFilteredRowCountComponent' },
                        { statusPanel: 'agSelectedRowCountComponent' },
                        { statusPanel: 'agAggregationComponent' },
                    ],
                }}
            />
        </div>
    );
};

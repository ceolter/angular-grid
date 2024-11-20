import { ShadowDom } from '@components/ShadowDom';
import React, { useMemo, useState } from 'react';

import {
    AllCommunityModule,
    type ColDef,
    ModuleRegistry,
    themeAlpine,
    themeBalham,
    themeQuartz,
} from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import 'ag-grid-community/styles/ag-theme-balham.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { RowGroupingPanelModule } from 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';

import styles from './ThemeBuilderExample.module.scss';

ModuleRegistry.registerModules([AllCommunityModule, RowGroupingPanelModule]);

interface Props {
    isDarkMode?: boolean;
    gridHeight?: number | null;
}

export const StockPerformanceGrid: React.FC<Props> = ({ gridHeight = null }) => {
    const [theme, setTheme] = useState(themeQuartz);
    const [spacing, setSpacing] = useState(12);

    const columnDefs = useMemo<ColDef[]>(
        () => [
            { field: 'ticker', width: 120 },
            { field: 'performance', type: 'gauge' },
            { field: 'current', type: 'rightAligned' },
            { field: 'feb', type: 'rightAligned' },
        ],
        []
    );

    const defaultColDef = useMemo(
        () => ({
            flex: 1,
            minWidth: 100,
            resizable: true,
        }),
        []
    );

    const rowData = [
        { ticker: 'US10Y', performance: [98149, 78675], current: 98149, feb: 78675 },
        { ticker: 'TSLA', performance: [97121, 21462], current: 97121, feb: 21462 },
        { ticker: 'AMZN', performance: [96528, 79786], current: 96528, feb: 79786 },
        { ticker: 'UBER', performance: [94390, 33186], current: 94390, feb: 33186 },
        { ticker: 'JP10Y', performance: [94074, 19321], current: 94074, feb: 19321 },
    ];

    const themeName = theme === themeAlpine ? 'themeAlpine' : theme === themeBalham ? 'themeBalham' : 'themeQuartz';
    const codeBlock = `
    import { ${themeName} } from 'ag-grid-community';
    
    <AgGridReact
      theme={${themeName}}
      spacing={${spacing}}
    />
      `;

    return (
        <div className={styles.gridColumns}>
            <div className={styles.optionsColumns}>
                <div className={styles.themeOptions}>
                    <div className={styles.label}>Theme</div>
                    <div className={styles.buttonGroup}>
                        <button
                            className={theme === themeQuartz ? styles.active : ''}
                            onClick={() => setTheme(themeQuartz)}
                        >
                            Quartz
                        </button>
                        <button
                            className={theme === themeBalham ? styles.active : ''}
                            onClick={() => setTheme(themeBalham)}
                        >
                            Balham
                        </button>
                        <button
                            className={theme === themeAlpine ? styles.active : ''}
                            onClick={() => setTheme(themeAlpine)}
                        >
                            Alpine
                        </button>
                    </div>
                </div>

                <div className="spacing-options">
                    <div className={styles.label}>Spacing</div>
                    <div className={styles.buttonGroup}>
                        <button className={spacing === 12 ? 'active' : ''} onClick={() => setSpacing(12)}>
                            Compact
                        </button>
                        <button className={spacing === 16 ? 'active' : ''} onClick={() => setSpacing(16)}>
                            Normal
                        </button>
                        <button className={spacing === 24 ? 'active' : ''} onClick={() => setSpacing(24)}>
                            Large
                        </button>
                    </div>
                </div>
            </div>
            <div className={styles.gridCodeBlock}>
                <div
                    style={gridHeight ? { height: gridHeight } : {}}
                    className={`${styles.grid} ${gridHeight ? '' : styles.gridHeight}`}
                >
                    <ShadowDom>
                        <AgGridReact
                            theme={theme}
                            columnDefs={columnDefs}
                            rowData={rowData}
                            defaultColDef={defaultColDef}
                        />
                    </ShadowDom>
                </div>
                <div className={styles.codeBlockWrapper}>
                    <div className={styles.windowControls}>
                        <div className={styles.dot}></div>
                        <div className={styles.dot}></div>
                        <div className={styles.dot}></div>
                    </div>
                    <pre className={styles.codeBlock}>{codeBlock}</pre>
                </div>
            </div>
        </div>
    );
};

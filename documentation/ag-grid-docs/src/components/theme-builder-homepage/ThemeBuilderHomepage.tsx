import React, { useMemo, useState } from 'react';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import 'ag-grid-community/styles/ag-theme-balham.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import { AgGridReact } from 'ag-grid-react';

import styles from './ThemeBuilderExample.module.scss';

export const StockPerformanceGrid = () => {
    const [theme, setTheme] = useState('ag-theme-quartz');
    const [spacing, setSpacing] = useState(12);

    const columnDefs = useMemo(
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

    return (
        <div className="grid-container">
            <div className="theme-options">
                <button
                    className={theme === 'ag-theme-quartz' ? 'active' : ''}
                    onClick={() => setTheme('ag-theme-quartz')}
                >
                    Quartz
                </button>
                <button
                    className={theme === 'ag-theme-balham' ? 'active' : ''}
                    onClick={() => setTheme('ag-theme-balham')}
                >
                    Balham
                </button>
                <button
                    className={theme === 'ag-theme-alpine' ? 'active' : ''}
                    onClick={() => setTheme('ag-theme-alpine')}
                >
                    Alpine
                </button>
            </div>
            <div className="spacing-options">
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
            <div className={`${styles.gridWrapper} ag-grid-react ${theme}`}>
                <AgGridReact columnDefs={columnDefs} rowData={rowData} defaultColDef={defaultColDef} />
            </div>
        </div>
    );
};

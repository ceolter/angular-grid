import { Snippet } from '@ag-website-shared/components/snippet/Snippet';
import { ShadowDom } from '@components/ShadowDom';
import { useDarkmode } from '@utils/hooks/useDarkmode';
import React, { useMemo, useState } from 'react';

import { AllCommunityModule, type ColDef, ModuleRegistry, type Theme, themeQuartz } from 'ag-grid-community';
import { RowGroupingPanelModule } from 'ag-grid-enterprise';
import { AgGridReact } from 'ag-grid-react';

import styles from './ThemeBuilderExample.module.scss';
import { TickerCellRenderer } from './cell-renderer/TickerCellRenderer';
import SpacingIcon from './spacing.svg?react';

ModuleRegistry.registerModules([AllCommunityModule, RowGroupingPanelModule]);
interface Props {
    isDarkMode?: boolean;
    gridHeight?: number | null;
}

interface ThemeParams {
    themeSelection: string;
    spacing: number;
}

type ThemeSelection = 'themeQuartz' | 'themeCustom';

const themeCustom = themeQuartz.withParams({
    accentColor: '#0086F4',
    backgroundColor: '#F1EDE1',
    borderColor: '#98968F',
    borderRadius: 16,
    browserColorScheme: 'light',
    chromeBackgroundColor: {
        ref: 'backgroundColor',
    },
    fontSize: 15,
    foregroundColor: '#605E57',
    headerBackgroundColor: '#E4DAD1',
    headerFontSize: 15,
    headerFontWeight: 700,
    headerTextColor: '#3C3A35',
    wrapperBorderRadius: 12,
});

const THEME_SELECTIONS = [
    {
        value: themeQuartz,
        label: 'Choose from AG Grid Themes',
        description: 'Use our built-in themes Quartz, Alpine or Balham',
        themeName: 'themeQuartz',
    },
    {
        value: themeCustom,
        label: 'Custom theme',
        description: 'Use the Theming API or CSS variables to create your theme',
        themeName: 'themeCustom',
    },
];

function getCodeSnippet({ themeSelection, spacing }: ThemeParams) {
    const params =
        themeSelection === 'themeCustom'
            ? {
                  backgroundColor: '#38200c',
                  foregroundColor: '#FFF',
                  borderColor: '#f59342',
                  chromeBackgroundColor: '#633713',
                  spacing,
              }
            : {
                  spacing,
              };

    const customThemeCode = `\n\nconst myTheme = themeQuartz.withParams(${JSON.stringify(params, null, 4)});`;

    return `// Using the Theming API
import { themeQuartz } from 'ag-grid-community';${customThemeCode}`;
}

export const ThemeBuilderHomepage: React.FC<Props> = ({ gridHeight = null }) => {
    const [baseTheme, setBaseTheme] = useState<Theme>(themeQuartz);
    const [spacing, setSpacing] = useState(8);
    const theme = useMemo(() => baseTheme.withParams({ spacing }), [baseTheme, spacing]);
    const [themeSelection, setThemeSelection] = useState<ThemeSelection>('themeQuartz');
    const [isDarkMode] = useDarkmode();

    const columnDefs = useMemo<ColDef[]>(
        () => [
            {
                field: 'ticker',
                cellRenderer: TickerCellRenderer,
            },
            { field: 'performance', type: 'rightAligned' },
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
        { ticker: 'US10Y', performance: 93521, current: 98149, feb: 78675 },
        { ticker: 'TSLA', performance: 97121, current: 97121, feb: 21462 },
        { ticker: 'AMZN', performance: 96528, current: 96528, feb: 79786 },
        { ticker: 'UBER', performance: 94390, current: 94390, feb: 33186 },
        { ticker: 'JP10Y', performance: 94074, current: 94074, feb: 19321 },
        { ticker: 'US10Y', performance: 93521, current: 98149, feb: 78675 },
        { ticker: 'TSLA', performance: 97121, current: 97121, feb: 21462 },
        { ticker: 'AMZN', performance: 96528, current: 96528, feb: 79786 },
        { ticker: 'UBER', performance: 94390, current: 94390, feb: 33186 },
        { ticker: 'JP10Y', performance: 94074, current: 94074, feb: 19321 },
    ];

    const codeBlock = useMemo(() => {
        return getCodeSnippet({ themeSelection, spacing });
    }, [themeSelection, spacing]);

    return (
        <div className={styles.gridColumns}>
            <div className={styles.optionsColumns}>
                <div className={styles.themeOptions}>
                    <div className={styles.label}>Theme</div>
                    <div className={styles.buttonGroup}>
                        {THEME_SELECTIONS.map((themeOption) => (
                            <div
                                key={themeOption.label}
                                className={`${styles.buttonItem} ${baseTheme === themeOption.value ? styles.active : ''}`}
                                onClick={() => {
                                    setThemeSelection(themeOption.themeName as ThemeSelection);
                                    setBaseTheme(themeOption.value);
                                }}
                            >
                                <div className={styles.buttonItems}>
                                    <input
                                        type="radio"
                                        name="charts"
                                        checked={baseTheme === themeOption.value}
                                        onChange={() => {
                                            setThemeSelection(themeOption.themeName as ThemeSelection);
                                            setBaseTheme(themeOption.value);
                                        }}
                                    />
                                    <div className={styles.titleDescription}>
                                        <div className={styles.title}>{themeOption.label}</div>
                                        <div className={styles.description}> {themeOption.description}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.spacingOptions}>
                    <div className={styles.label}>
                        <SpacingIcon />
                        Spacing
                    </div>
                    <div className={styles.buttonGroup}>
                        {[
                            { value: 4, label: 'Tiny' },
                            { value: 8, label: 'Normal' },
                            { value: 12, label: 'Large' },
                        ].map((spacingOption) => (
                            <button
                                key={spacingOption.label}
                                className={spacing === spacingOption.value ? styles.active : ''}
                                onClick={() => setSpacing(spacingOption.value)}
                            >
                                {spacingOption.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
            <div className={styles.gridCodeBlock}>
                <div
                    style={gridHeight ? { height: gridHeight } : {}}
                    className={`${styles.grid} ${gridHeight ? '' : styles.gridHeight}`}
                >
                    <ShadowDom>
                        <div style={{ height: '100%' }} data-ag-theme-mode={isDarkMode ? 'dark-blue' : 'light'}>
                            <AgGridReact
                                theme={theme}
                                columnDefs={columnDefs}
                                rowData={rowData}
                                defaultColDef={defaultColDef}
                            />
                        </div>
                    </ShadowDom>
                </div>

                <div className={`${styles.codeBlockWrapper} code-block-homepage`}>
                    <div className={styles.windowControls}>
                        <div className={styles.dot}></div>
                        <div className={styles.dot}></div>
                        <div className={styles.dot}></div>
                    </div>

                    <Snippet framework="javascript" language="js" content={codeBlock} transform={false} lineNumbers />
                </div>
            </div>
        </div>
    );
};

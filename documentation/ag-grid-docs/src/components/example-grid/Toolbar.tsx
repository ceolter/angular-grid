import { Icon } from '@ag-website-shared/components/icon/Icon';
import { Select } from '@ag-website-shared/components/select/Select';
import { trackDemoToolbar, trackOnceDemoToolbar } from '@utils/analytics';
import { useDeferredValue, useEffect, useMemo, useState } from 'react';

import styles from './Toolbar.module.scss';
import { createDataSizeValue } from './utils';

const IS_SSR = typeof window === 'undefined';

const options: Record<string, string> = {
    quartz: 'Quartz',
    balham: 'Balham',
    material: 'Material',
    alpine: 'Alpine',
};

export const Toolbar = ({
    gridRef,
    dataSize,
    setDataSize,
    rowCols,
    gridTheme,
    setGridTheme,
    setCountryColumnPopupEditor,
}) => {
    function onDataSizeChanged(newValue) {
        const { value } = newValue;
        setDataSize(value);
        trackDemoToolbar({
            type: 'dataSize',
            value,
        });
    }

    function onThemeChanged(newValue) {
        const newTheme = newValue.value || 'ag-theme-none';
        setCountryColumnPopupEditor(newTheme, gridRef.current.api);
        setGridTheme(newTheme);
        trackDemoToolbar({
            type: 'theme',
            value: newTheme,
        });

        if (!IS_SSR) {
            let url = window.location.href;
            if (url.indexOf('?theme=') !== -1) {
                url = url.replace(/\?theme=[\w:-]+/, `?theme=${newTheme}`);
            } else {
                const sep = url.indexOf('?') === -1 ? '?' : '&';
                url += `${sep}theme=${newTheme}`;
            }
            history.replaceState({}, '', url);
        }
    }

    const [quickFilterText, setQuickFilterText] = useState('');
    const deferredQuickFilterText = useDeferredValue(quickFilterText);

    useEffect(() => {
        if (!gridRef.current?.api) {
            return;
        }
        gridRef.current.api.setGridOption('quickFilterText', deferredQuickFilterText);
        trackOnceDemoToolbar({
            type: 'filterChange',
        });
    }, [deferredQuickFilterText]);

    function onFilterChanged(event) {
        setQuickFilterText(event.target.value);
    }

    const dataSizeOptions = useMemo(
        () =>
            rowCols.map((rowCol) => {
                const rows = rowCol[0];
                const cols = rowCol[1];

                const value = createDataSizeValue(rows, cols);
                const text = `${rows} Rows, ${cols} Cols`;
                return {
                    label: text,
                    value,
                };
            }),
        [rowCols]
    );
    const dataSizeOption = useMemo(
        () => dataSizeOptions.find((o: { value: string }) => o.value === dataSize) || dataSizeOptions[0],
        [dataSizeOptions, dataSize]
    );

    const themeOptions = useMemo(() => {
        return Object.entries(options).map(([themeName, label]) => ({
            label,
            value: themeName,
        }));
    }, [options]);
    const themeOption = useMemo(
        () => themeOptions.find((o: { value: string }) => o.value === gridTheme) || dataSizeOptions[0],
        [themeOptions, gridTheme]
    );

    return (
        <div className={styles.toolbar}>
            <div className={styles.controlsContainer}>
                <div className={styles.controls}>
                    <label htmlFor="data-size" className="text-sm">
                        Data Size:
                    </label>

                    {dataSizeOption && (
                        <Select
                            isPopper
                            options={dataSizeOptions}
                            value={dataSizeOption}
                            onChange={onDataSizeChanged}
                            renderItem={(o) => {
                                return <>{o.label}</>;
                            }}
                        />
                    )}

                    <label htmlFor="grid-theme" className="text-sm">
                        Theme:
                    </label>
                    <Select
                        isPopper
                        options={themeOptions}
                        value={themeOption}
                        onChange={onThemeChanged}
                        renderItem={(o) => {
                            return <>{o.label}</>;
                        }}
                    />

                    <label htmlFor="global-filter" className={styles.filterLabel}>
                        Filter:
                    </label>
                    <input
                        className={styles.filterInput}
                        placeholder="Filter any column..."
                        type="text"
                        onInput={onFilterChanged}
                        id="global-filter"
                        style={{ flex: 1 }}
                    />

                    {/* <a
                        className={styles.videoTour}
                        href="https://youtu.be/bcMvTUVbMvI"
                        target="_blank"
                        rel="noreferrer"
                    >
                        <Icon name="youtube" />
                        Take a video tour
                    </a> */}
                </div>
            </div>
            <div className={styles.scrollIndicator}></div>
        </div>
    );
};

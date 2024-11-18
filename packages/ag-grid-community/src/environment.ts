import { themeQuartz } from 'ag-grid-community';

import type { NamedBean } from './context/bean';
import { BeanStub } from './context/beanStub';
import type { BeanCollection } from './context/context';
import { ThemeImpl } from './theming/Theme';
import { IS_SSR, _injectCoreAndModuleCSS, _injectGlobalCSS } from './theming/inject';
import { _observeResize } from './utils/dom';
import { _error, _warn } from './validation/logging';

const ROW_HEIGHT: Variable = {
    cssName: '--ag-row-height',
    changeKey: 'rowHeightChanged',
    defaultValue: 42,
};
const HEADER_HEIGHT: Variable = {
    cssName: '--ag-header-height',
    changeKey: 'headerHeightChanged',
    defaultValue: 48,
};
const LIST_ITEM_HEIGHT: Variable = {
    cssName: '--ag-list-item-height',
    changeKey: 'listItemHeightChanged',
    defaultValue: 24,
};

let paramsId = 0;

export class Environment extends BeanStub implements NamedBean {
    beanName = 'environment' as const;

    private eGridDiv: HTMLElement;

    public wireBeans(beans: BeanCollection): void {
        this.eGridDiv = beans.eGridDiv;
    }

    private sizeEls = new Map<Variable, HTMLElement>();
    private lastKnownValues = new Map<Variable, number>();
    private eMeasurementContainer: HTMLElement | undefined;
    public sizesMeasured = false;

    private paramsClass = `ag-theme-params-${++paramsId}`;
    private gridTheme: ThemeImpl | undefined;
    private eParamsStyle: HTMLStyleElement | undefined;
    private globalCSS: [string, string][] = [];

    public postConstruct(): void {
        this.addManagedPropertyListener('theme', () => this.handleThemeGridOptionChange());
        this.handleThemeGridOptionChange();

        this.addManagedPropertyListener('rowHeight', () => this.refreshRowHeightVariable());
        this.getSizeEl(ROW_HEIGHT);
        this.getSizeEl(HEADER_HEIGHT);
        this.getSizeEl(LIST_ITEM_HEIGHT);
    }

    public getDefaultRowHeight(): number {
        return this.getCSSVariablePixelValue(ROW_HEIGHT);
    }

    public getDefaultHeaderHeight(): number {
        return this.getCSSVariablePixelValue(HEADER_HEIGHT);
    }

    public getDefaultColumnMinWidth(): number {
        // This replaces a table of hard-coded defaults for each theme, and is a
        // reasonable default that somewhat approximates the old table. This
        // value only needs to be a non-insane default - Applications are
        // expected to set column-specific defaults based on the icons and
        // header cell text they need to display
        return Math.min(36, this.getDefaultRowHeight());
    }

    public getDefaultListItemHeight() {
        return this.getCSSVariablePixelValue(LIST_ITEM_HEIGHT);
    }

    public applyThemeClasses(el: HTMLElement) {
        const { gridTheme } = this;
        let themeClass = '';
        if (gridTheme) {
            // theming API mode
            themeClass = `${this.paramsClass} ${gridTheme._getCssClass()}`;
        } else {
            // legacy mode
            let node: HTMLElement | null = this.eGridDiv;
            while (node) {
                for (const className of Array.from(node.classList)) {
                    if (className.startsWith('ag-theme-')) {
                        themeClass = themeClass ? `${themeClass} ${className}` : className;
                    }
                }
                node = node.parentElement;
            }
        }

        for (const className of Array.from(el.classList)) {
            if (className.startsWith('ag-theme-')) {
                el.classList.remove(className);
            }
        }
        if (themeClass) {
            const oldClass = el.className;
            el.className = oldClass + (oldClass ? ' ' : '') + themeClass;
        }
    }

    public refreshRowHeightVariable(): number {
        const { eGridDiv } = this;
        const oldRowHeight = eGridDiv.style.getPropertyValue('--ag-line-height').trim();
        const height = this.gos.get('rowHeight');

        if (height == null || isNaN(height) || !isFinite(height)) {
            if (oldRowHeight !== null) {
                eGridDiv.style.setProperty('--ag-line-height', null);
            }
            return -1;
        }

        const newRowHeight = `${height}px`;

        if (oldRowHeight != newRowHeight) {
            eGridDiv.style.setProperty('--ag-line-height', newRowHeight);
            return height;
        }

        return oldRowHeight != '' ? parseFloat(oldRowHeight) : -1;
    }

    public addGlobalCSS(css: string, debugId: string): void {
        if (this.gridTheme) {
            _injectGlobalCSS(css, this.eGridDiv, debugId);
        } else {
            this.globalCSS.push([css, debugId]);
        }
    }

    private getCSSVariablePixelValue(variable: Variable): number {
        const cached = this.lastKnownValues.get(variable);
        if (cached != null) {
            return cached;
        }
        const measurement = this.measureSizeEl(variable);
        if (measurement === 'detached' || measurement === 'no-styles') {
            return variable.defaultValue;
        }
        this.lastKnownValues.set(variable, measurement);
        return measurement;
    }

    private measureSizeEl(variable: Variable): number | 'detached' | 'no-styles' {
        const sizeEl = this.getSizeEl(variable)!;
        if (sizeEl.offsetParent == null) {
            return 'detached';
        }
        const newSize = sizeEl.offsetWidth;
        if (newSize === NO_VALUE_SENTINEL) return 'no-styles';
        this.sizesMeasured = true;
        return newSize;
    }

    private getSizeEl(variable: Variable): HTMLElement {
        let sizeEl = this.sizeEls.get(variable);
        if (sizeEl) {
            return sizeEl;
        }
        let container = this.eMeasurementContainer;
        if (!container) {
            container = this.eMeasurementContainer = document.createElement('div');
            container.className = 'ag-measurement-container';
            this.eGridDiv.appendChild(container);
        }

        sizeEl = document.createElement('div');
        sizeEl.style.width = `var(${variable.cssName}, ${NO_VALUE_SENTINEL}px)`;
        container.appendChild(sizeEl);
        this.sizeEls.set(variable, sizeEl);

        let lastMeasurement = this.measureSizeEl(variable);

        if (lastMeasurement === 'no-styles') {
            // No value for the variable
            _warn(9, { variable });
        }

        const unsubscribe = _observeResize(this.beans, sizeEl, () => {
            const newMeasurement = this.measureSizeEl(variable);
            if (newMeasurement === 'detached' || newMeasurement === 'no-styles') {
                return;
            }
            this.lastKnownValues.set(variable, newMeasurement);
            if (newMeasurement !== lastMeasurement) {
                lastMeasurement = newMeasurement;
                this.fireGridStylesChangedEvent(variable.changeKey);
            }
        });
        this.addDestroyFunc(() => unsubscribe());

        return sizeEl;
    }

    private fireGridStylesChangedEvent(change: ChangeKey): void {
        this.eventSvc.dispatchEvent({
            type: 'gridStylesChanged',
            [change]: true,
        });
    }

    private handleThemeGridOptionChange(): void {
        const { gos, eGridDiv, globalCSS, gridTheme: oldGridTheme } = this;
        const themeGridOption = gos.get('theme');
        let newGridTheme: ThemeImpl | undefined;
        if (themeGridOption === 'legacy') {
            newGridTheme = undefined;
        } else {
            const themeOrDefault = themeGridOption ?? themeQuartz;
            if (themeOrDefault instanceof ThemeImpl) {
                newGridTheme = themeOrDefault;
            } else {
                _error(240, { theme: newGridTheme });
            }
        }
        if (newGridTheme !== oldGridTheme) {
            if (newGridTheme) {
                _injectCoreAndModuleCSS(eGridDiv);
                for (const [css, debugId] of globalCSS) {
                    _injectGlobalCSS(css, eGridDiv, debugId);
                }
                globalCSS.length = 0;
            }
            this.gridTheme = newGridTheme;
            newGridTheme?._startUse({
                loadThemeGoogleFonts: gos.get('loadThemeGoogleFonts'),
                container: eGridDiv,
            });
            let eParamsStyle = this.eParamsStyle;
            if (!eParamsStyle) {
                eParamsStyle = this.eParamsStyle = document.createElement('style');
                eGridDiv.appendChild(eParamsStyle);
            }
            if (!IS_SSR) {
                eParamsStyle.textContent = newGridTheme?._getPerGridCss(this.paramsClass) || '';
            }

            this.applyThemeClasses(eGridDiv);
            this.fireGridStylesChangedEvent('themeChanged');
        }
        // --ag-legacy-styles-loaded is defined by the legacy themes which
        // shouldn't be used at the same time as Theming API
        if (newGridTheme && getComputedStyle(document.body).getPropertyValue('--ag-legacy-styles-loaded')) {
            if (themeGridOption) {
                _error(106);
            } else {
                _error(239);
            }
        }
    }
}

type Variable = {
    cssName: string;
    changeKey: ChangeKey;
    defaultValue: number;
};

type ChangeKey = 'themeChanged' | 'headerHeightChanged' | 'rowHeightChanged' | 'listItemHeightChanged';

const NO_VALUE_SENTINEL = 15538;

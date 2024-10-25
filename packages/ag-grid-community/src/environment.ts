import { themeQuartz } from 'ag-grid-community';

import type { NamedBean } from './context/bean';
import { BeanStub } from './context/beanStub';
import type { BeanCollection } from './context/context';
import type { GridTheme } from './entities/gridOptions';
import { _injectCoreAndModuleCSS, _injectGlobalCSS } from './theming/inject';
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

export class Environment extends BeanStub implements NamedBean {
    beanName = 'environment' as const;

    private eGridDiv: HTMLElement;

    public wireBeans(beans: BeanCollection): void {
        this.eGridDiv = beans.eGridDiv;
    }

    private sizeEls = new Map<Variable, HTMLElement>();
    private lastKnownValues = new Map<Variable, number>();
    private eMeasurementContainer: HTMLElement | undefined;
    private sizesMeasured = false;

    private gridTheme: GridTheme | undefined;
    private themeClass: string | undefined;
    private globalCSS: string[] = [];

    public postConstruct(): void {
        this.addManagedPropertyListener('theme', () => this.handleThemeGridOptionChange());
        this.handleThemeGridOptionChange();
        this.addDestroyFunc(() => this.stopUsingTheme());

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

    public hasMeasuredSizes(): boolean {
        return this.sizesMeasured;
    }

    public getGridThemeClass(): string | null {
        return this.gridTheme?.getCssClass() || null;
    }

    public getThemeClass(): string | undefined {
        return this.themeClass;
    }

    public applyThemeClasses(el: HTMLElement) {
        let themeClass: string | undefined;
        if (this.gos.get('theme') === 'legacy') {
            let node: HTMLElement | null = this.eGridDiv;
            while (node) {
                for (const className of Array.from(node.classList)) {
                    if (className.startsWith('ag-theme-')) {
                        themeClass = themeClass ? `${themeClass} ${className}` : className;
                    }
                }
                node = node.parentElement;
            }
        } else {
            themeClass = this.themeClass;
        }
        for (const className of Array.from(el.classList)) {
            if (className.startsWith('ag-theme-')) {
                el.classList.remove(className);
            }
        }
        if (themeClass) {
            el.classList.add(themeClass);
        }
    }

    public refreshRowHeightVariable(): number {
        const oldRowHeight = this.eGridDiv.style.getPropertyValue('--ag-line-height').trim();
        const height = this.gos.get('rowHeight');

        if (height == null || isNaN(height) || !isFinite(height)) {
            if (oldRowHeight !== null) {
                this.eGridDiv.style.setProperty('--ag-line-height', null);
            }
            return -1;
        }

        const newRowHeight = `${height}px`;

        if (oldRowHeight != newRowHeight) {
            this.eGridDiv.style.setProperty('--ag-line-height', newRowHeight);
            return height;
        }

        return oldRowHeight != '' ? parseFloat(oldRowHeight) : -1;
    }

    public addGlobalCSS(css: string): void {
        if (this.gridTheme) {
            _injectGlobalCSS(css, this.eGridDiv);
        } else {
            this.globalCSS.push(css);
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

        const unsubscribe = _observeResize(this.gos, sizeEl, () => {
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
        const { gos, eGridDiv, globalCSS, gridTheme: oldGridTheme, themeClass: oldThemeClass } = this;
        const themeGridOption = gos.get('theme');
        let newGridTheme: GridTheme | undefined;
        let newThemeClass: string | undefined;
        if (themeGridOption === 'legacy') {
            newGridTheme = undefined;
        } else {
            newGridTheme = themeGridOption || themeQuartz;
            if (!newGridTheme?.getCssClass) {
                _error(240, { theme: newGridTheme });
            }
            newThemeClass = newGridTheme.getCssClass();
        }
        if (newGridTheme !== oldGridTheme) {
            if (newGridTheme) {
                _injectCoreAndModuleCSS(eGridDiv);
                for (const css of globalCSS) {
                    _injectGlobalCSS(css, eGridDiv);
                }
                globalCSS.length = 0;
            }
            oldGridTheme?.stopUse();
            this.gridTheme = newGridTheme;
            newGridTheme?.startUse({
                loadThemeGoogleFonts: gos.get('loadThemeGoogleFonts'),
                container: eGridDiv,
            });
            this.fireGridStylesChangedEvent('themeChanged');
        }
        if (newThemeClass !== oldThemeClass) {
            this.themeClass = newThemeClass;
            this.applyThemeClasses(eGridDiv);
        }
        // --ag-legacy-styles-loaded is defined by the Sass themes which
        // shouldn't be used at the same time as Theming API
        if (newGridTheme && getComputedStyle(document.body).getPropertyValue('--ag-legacy-styles-loaded')) {
            if (themeGridOption) {
                _error(106);
            } else {
                _error(239);
            }
        }
    }

    private stopUsingTheme(): void {
        this.gridTheme?.stopUse();
        this.gridTheme = undefined;
    }
}

type Variable = {
    cssName: string;
    changeKey: ChangeKey;
    defaultValue: number;
};

type ChangeKey = 'themeChanged' | 'headerHeightChanged' | 'rowHeightChanged' | 'listItemHeightChanged';

const NO_VALUE_SENTINEL = 15538;

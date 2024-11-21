import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { AgColumn } from '../entities/agColumn';
import type { AgColumnGroup } from '../entities/agColumnGroup';
import type { ColDef, ColGroupDef } from '../entities/colDef';
import type { RowNode } from '../entities/rowNode';
import type { GridOptionsService } from '../gridOptionsService';
import type { TooltipLocation } from './tooltipComponent';
import { TooltipStateManager } from './tooltipStateManager';

export interface ITooltipCtrl {
    getTooltipValue?(): any;
    getGui(): HTMLElement;
    getLocation?(): TooltipLocation;

    getColumn?(): AgColumn | AgColumnGroup;
    getColDef?(): ColDef | ColGroupDef;
    getRowIndex?(): number;
    getRowNode?(): RowNode;

    // this makes no sense, why is the cell formatted value passed to the tooltip???
    getValueFormatted?(): string;
    getTooltipShowDelayOverride?(): number;
    getTooltipHideDelayOverride?(): number;
    shouldDisplayTooltip?(): boolean;

    /** Additional params to be passed to the tooltip */
    getAdditionalParams?(): Record<string, any>;
}

export function _isShowTooltipWhenTruncated(gos: GridOptionsService): boolean {
    return gos.get('tooltipShowMode') === 'whenTruncated';
}

export function _getShouldDisplayTooltip(
    gos: GridOptionsService,
    getElement: () => HTMLElement | undefined
): (() => boolean) | undefined {
    return _isShowTooltipWhenTruncated(gos) ? _shouldDisplayTooltip(getElement) : undefined;
}

export function _shouldDisplayTooltip(getElement: () => HTMLElement | undefined): () => boolean {
    return () => {
        const element = getElement();
        if (!element) {
            // show tooltip by default
            return true;
        }
        return element.scrollWidth > element.clientWidth;
    };
}

export class TooltipFeature extends BeanStub {
    private tooltip: any;

    private tooltipManager: TooltipStateManager | undefined;
    private browserTooltips: boolean;

    constructor(
        private readonly ctrl: ITooltipCtrl,
        beans?: BeanCollection
    ) {
        super();

        if (beans) {
            this.beans = beans;
        }
    }

    public postConstruct() {
        this.refreshTooltip();
    }

    private setBrowserTooltip(tooltip: string | null) {
        const name = 'title';
        const eGui = this.ctrl.getGui();

        if (!eGui) {
            return;
        }

        if (tooltip != null && tooltip != '') {
            eGui.setAttribute(name, tooltip);
        } else {
            eGui.removeAttribute(name);
        }
    }

    private updateTooltipText(): void {
        const { getTooltipValue } = this.ctrl;
        if (getTooltipValue) {
            this.tooltip = getTooltipValue();
        }
    }

    private createTooltipFeatureIfNeeded(): void {
        if (this.tooltipManager == null) {
            this.tooltipManager = this.createBean(
                new TooltipStateManager(this.ctrl, () => this.tooltip),
                this.beans.context
            );
        }
    }

    public setTooltipAndRefresh(tooltip: any): void {
        this.tooltip = tooltip;
        this.refreshTooltip();
    }

    public refreshTooltip(): void {
        this.browserTooltips = this.beans.gos.get('enableBrowserTooltips');
        this.updateTooltipText();

        if (this.browserTooltips) {
            this.setBrowserTooltip(this.tooltip);
            this.tooltipManager = this.destroyBean(this.tooltipManager, this.beans.context);
        } else {
            this.setBrowserTooltip(null);
            this.createTooltipFeatureIfNeeded();
        }
    }

    public override destroy() {
        this.tooltipManager = this.destroyBean(this.tooltipManager, this.beans.context);
        super.destroy();
    }
}

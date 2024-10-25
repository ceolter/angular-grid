import type { BeanCollection, CtrlsService, Environment, IAdvancedFilterCtrl, PopupService } from 'ag-grid-community';
import { BeanStub, _getAbsoluteHeight, _getAbsoluteWidth, _removeFromParent } from 'ag-grid-community';

import { AgDialog } from '../widgets/agDialog';
import { AdvancedFilterComp } from './advancedFilterComp';
import type { AdvancedFilterExpressionService } from './advancedFilterExpressionService';
import { AdvancedFilterHeaderComp } from './advancedFilterHeaderComp';
import { AdvancedFilterBuilderComp } from './builder/advancedFilterBuilderComp';

export type AdvancedFilterCtrlEvent = 'advancedFilterBuilderClosed';
export class AdvancedFilterCtrl extends BeanStub<AdvancedFilterCtrlEvent> implements IAdvancedFilterCtrl {
    private ctrlsSvc: CtrlsService;
    private popupSvc: PopupService;
    private advancedFilterExpressionService: AdvancedFilterExpressionService;
    private environment: Environment;

    public wireBeans(beans: BeanCollection): void {
        this.ctrlsSvc = beans.ctrlsSvc;
        this.popupSvc = beans.popupSvc!;
        this.advancedFilterExpressionService = beans.advancedFilterExpressionService as AdvancedFilterExpressionService;
        this.environment = beans.environment;
    }

    private eHeaderComp: AdvancedFilterHeaderComp | undefined;
    private eFilterComp: AdvancedFilterComp | undefined;
    private hasAdvancedFilterParent: boolean;
    private eBuilderComp: AdvancedFilterBuilderComp | undefined;
    private eBuilderDialog: AgDialog | undefined;
    private builderDestroySource?: 'api' | 'ui';

    constructor(private enabled: boolean) {
        super();
    }

    public postConstruct(): void {
        this.hasAdvancedFilterParent = !!this.gos.get('advancedFilterParent');

        this.ctrlsSvc.whenReady(this, () => this.setAdvancedFilterComp());

        this.addManagedEventListeners({
            advancedFilterEnabledChanged: ({ enabled }) => this.onEnabledChanged(enabled),
        });

        this.addManagedPropertyListener('advancedFilterParent', () => this.updateComps());

        this.addDestroyFunc(() => {
            this.destroyAdvancedFilterComp();
            this.destroyBean(this.eBuilderComp);
            if (this.eBuilderDialog && this.eBuilderDialog.isAlive()) {
                this.destroyBean(this.eBuilderDialog);
            }
        });
    }

    public setupHeaderComp(eCompToInsertBefore: HTMLElement): void {
        if (this.eHeaderComp) {
            this.eHeaderComp?.getGui().remove();
            this.destroyBean(this.eHeaderComp);
        }

        this.eHeaderComp = this.createManagedBean(
            new AdvancedFilterHeaderComp(this.enabled && !this.hasAdvancedFilterParent)
        );
        eCompToInsertBefore.insertAdjacentElement('beforebegin', this.eHeaderComp.getGui());
    }

    public focusHeaderComp(): boolean {
        if (this.eHeaderComp) {
            this.eHeaderComp.getFocusableElement().focus();
            return true;
        }
        return false;
    }

    public refreshComp(): void {
        this.eFilterComp?.refresh();
        this.eHeaderComp?.refresh();
    }

    public refreshBuilderComp(): void {
        this.eBuilderComp?.refresh();
    }

    public getHeaderHeight(): number {
        return this.eHeaderComp?.getHeight() ?? 0;
    }

    public setInputDisabled(disabled: boolean): void {
        this.eFilterComp?.setInputDisabled(disabled);
        this.eHeaderComp?.setInputDisabled(disabled);
    }

    public toggleFilterBuilder(params: { source: 'api' | 'ui'; force?: boolean; eventSource?: HTMLElement }): void {
        const { source, force, eventSource } = params;
        if ((force && this.eBuilderDialog) || (force === false && !this.eBuilderDialog)) {
            // state requested is already active
            return;
        }
        if (this.eBuilderDialog) {
            this.builderDestroySource = source;
            this.destroyBean(this.eBuilderDialog);
            return;
        }

        this.setInputDisabled(true);

        const { width, height, minWidth } = this.getBuilderDialogSize();

        this.eBuilderComp = this.createBean(new AdvancedFilterBuilderComp());
        this.eBuilderDialog = this.createBean(
            new AgDialog({
                title: this.advancedFilterExpressionService.translate('advancedFilterBuilderTitle'),
                component: this.eBuilderComp,
                width,
                height,
                resizable: true,
                movable: true,
                maximizable: true,
                centered: true,
                closable: true,
                minWidth,
                afterGuiAttached: () => this.eBuilderComp?.afterGuiAttached(),
                postProcessPopupParams: {
                    type: 'advancedFilterBuilder',
                    eventSource,
                },
            })
        );

        this.dispatchFilterBuilderVisibleChangedEvent(source, true);

        this.eBuilderDialog.addEventListener('destroyed', () => {
            this.destroyBean(this.eBuilderComp);
            this.eBuilderComp = undefined;
            this.eBuilderDialog = undefined;
            this.setInputDisabled(false);
            this.dispatchLocalEvent({
                type: 'advancedFilterBuilderClosed',
            });
            this.dispatchFilterBuilderVisibleChangedEvent(this.builderDestroySource ?? 'ui', false);
            this.builderDestroySource = undefined;
        });
    }

    private dispatchFilterBuilderVisibleChangedEvent(source: 'api' | 'ui', visible: boolean): void {
        this.eventSvc.dispatchEvent({
            type: 'advancedFilterBuilderVisibleChanged',
            source,
            visible,
        });
    }

    private getBuilderDialogSize(): { width: number; height: number; minWidth: number } {
        const minWidth = this.gos.get('advancedFilterBuilderParams')?.minWidth ?? 500;
        const popupParent = this.popupSvc.getPopupParent();
        const maxWidth = Math.round(_getAbsoluteWidth(popupParent)) - 2; // assume 1 pixel border
        const maxHeight = Math.round(_getAbsoluteHeight(popupParent) * 0.75) - 2;

        const width = Math.min(Math.max(600, minWidth), maxWidth);
        const height = Math.min(600, maxHeight);

        return { width, height, minWidth };
    }

    private onEnabledChanged(enabled: boolean): void {
        this.enabled = enabled;
        this.updateComps();
    }

    private updateComps(): void {
        this.setAdvancedFilterComp();
        this.setHeaderCompEnabled();
        this.eventSvc.dispatchEvent({
            type: 'headerHeightChanged',
        });
    }

    private setAdvancedFilterComp(): void {
        this.destroyAdvancedFilterComp();
        if (!this.enabled) {
            return;
        }

        const advancedFilterParent = this.gos.get('advancedFilterParent');
        this.hasAdvancedFilterParent = !!advancedFilterParent;
        if (advancedFilterParent) {
            // unmanaged as can be recreated
            const eAdvancedFilterComp = this.createBean(new AdvancedFilterComp());
            const eAdvancedFilterCompGui = eAdvancedFilterComp.getGui();

            this.environment.applyThemeClasses(eAdvancedFilterCompGui);

            eAdvancedFilterCompGui.classList.add(this.gos.get('enableRtl') ? 'ag-rtl' : 'ag-ltr');

            advancedFilterParent.appendChild(eAdvancedFilterCompGui);

            this.eFilterComp = eAdvancedFilterComp;
        }
    }

    private setHeaderCompEnabled(): void {
        this.eHeaderComp?.setEnabled(this.enabled && !this.hasAdvancedFilterParent);
    }

    private destroyAdvancedFilterComp(): void {
        if (this.eFilterComp) {
            _removeFromParent(this.eFilterComp.getGui());
            this.destroyBean(this.eFilterComp);
        }
    }
}

import { setupCompBean } from '../../../components/emptyBean';
import { KeyCode } from '../../../constants/keyCode';
import type { BeanStub } from '../../../context/beanStub';
import type { AgColumn } from '../../../entities/agColumn';
import type { ColumnEvent, FilterChangedEvent } from '../../../events';
import { _getActiveDomElement, _isLegacyMenuEnabled } from '../../../gridOptionsUtils';
import type { UserCompDetails } from '../../../interfaces/iUserCompDetails';
import { SetLeftFeature } from '../../../rendering/features/setLeftFeature';
import { _setAriaLabel } from '../../../utils/aria';
import { _isElementChildOfClass } from '../../../utils/dom';
import { _findNextFocusableElement, _focusInto } from '../../../utils/focus';
import { _createIconNoSpan } from '../../../utils/icon';
import { ManagedFocusFeature } from '../../../widgets/managedFocusFeature';
import { AbstractHeaderCellCtrl } from '../abstractCell/abstractHeaderCellCtrl';
import type { IHeaderFilterCellComp } from './iHeaderFilterCellComp';

export class HeaderFilterCellCtrl extends AbstractHeaderCellCtrl<IHeaderFilterCellComp, AgColumn> {
    private eButtonShowMainFilter: HTMLElement;
    private eFloatingFilterBody: HTMLElement;

    private suppressFilterButton: boolean;
    private highlightFilterButtonWhenActive: boolean;
    private active: boolean;
    private iconCreated: boolean = false;

    private userCompDetails?: UserCompDetails | null;
    private destroySyncListener: () => null;
    private destroyFilterChangedListener: () => null;

    public setComp(
        comp: IHeaderFilterCellComp,
        eGui: HTMLElement,
        eButtonShowMainFilter: HTMLElement,
        eFloatingFilterBody: HTMLElement,
        compBeanInput: BeanStub | undefined
    ): void {
        this.comp = comp;
        const compBean = setupCompBean(this, this.beans.context, compBeanInput);
        this.eButtonShowMainFilter = eButtonShowMainFilter;
        this.eFloatingFilterBody = eFloatingFilterBody;

        this.setGui(eGui, compBean);
        this.setupActive();

        this.setupWidth(compBean);
        this.setupLeft(compBean);
        this.setupHover(compBean);
        this.setupFocus(compBean);
        this.setupAria();
        this.setupFilterButton();
        this.setupUserComp();
        this.setupSyncWithFilter(compBean);
        this.setupUi();

        compBean.addManagedElementListeners(this.eButtonShowMainFilter, { click: this.showParentFilter.bind(this) });
        this.setupFilterChangedListener(compBean);
        compBean.addManagedListeners(this.column, { colDefChanged: () => this.onColDefChanged(compBean) });
        // Make sure this is the last destroy func as it clears the gui and comp
        compBean.addDestroyFunc(() => {
            (this.eButtonShowMainFilter as any) = null;
            (this.eFloatingFilterBody as any) = null;
            (this.userCompDetails as any) = null;
            this.clearComponent();
        });
    }

    // empty abstract method
    protected resizeHeader(): void {}

    protected override moveHeader(): void {
        // doesn't support move
    }

    private setupActive(): void {
        const colDef = this.column.getColDef();
        const filterExists = !!colDef.filter;
        const floatingFilterExists = !!colDef.floatingFilter;
        this.active = filterExists && floatingFilterExists;
    }

    private setupUi(): void {
        this.comp.setButtonWrapperDisplayed(!this.suppressFilterButton && this.active);

        this.comp.addOrRemoveBodyCssClass('ag-floating-filter-full-body', this.suppressFilterButton);
        this.comp.addOrRemoveBodyCssClass('ag-floating-filter-body', !this.suppressFilterButton);

        if (!this.active || this.iconCreated) {
            return;
        }

        const eMenuIcon = _createIconNoSpan('filter', this.beans, this.column);

        if (eMenuIcon) {
            this.iconCreated = true;
            this.eButtonShowMainFilter.appendChild(eMenuIcon);
        }
    }

    private setupFocus(compBean: BeanStub): void {
        compBean.createManagedBean(
            new ManagedFocusFeature(this.eGui, {
                shouldStopEventPropagation: this.shouldStopEventPropagation.bind(this),
                onTabKeyDown: this.onTabKeyDown.bind(this),
                handleKeyDown: this.handleKeyDown.bind(this),
                onFocusIn: this.onFocusIn.bind(this),
            })
        );
    }

    private setupAria(): void {
        const localeTextFunc = this.getLocaleTextFunc();
        _setAriaLabel(this.eButtonShowMainFilter, localeTextFunc('ariaFilterMenuOpen', 'Open Filter Menu'));
    }

    private onTabKeyDown(e: KeyboardEvent) {
        const { beans } = this;
        const activeEl = _getActiveDomElement(beans);
        const wrapperHasFocus = activeEl === this.eGui;

        if (wrapperHasFocus) {
            return;
        }

        const nextFocusableEl = _findNextFocusableElement(beans, this.eGui, null, e.shiftKey);

        if (nextFocusableEl) {
            beans.headerNavigation?.scrollToColumn(this.column);
            e.preventDefault();
            nextFocusableEl.focus();
            return;
        }

        const nextFocusableColumn = this.findNextColumnWithFloatingFilter(e.shiftKey);

        if (!nextFocusableColumn) {
            return;
        }

        if (
            beans.focusSvc.focusHeaderPosition({
                headerPosition: {
                    headerRowIndex: this.rowCtrl.rowIndex,
                    column: nextFocusableColumn,
                },
                event: e,
            })
        ) {
            e.preventDefault();
        }
    }

    private findNextColumnWithFloatingFilter(backwards: boolean): AgColumn | null {
        const presentedColsService = this.beans.visibleCols;
        let nextCol: AgColumn | null = this.column;

        do {
            nextCol = backwards
                ? presentedColsService.getColBefore(nextCol)
                : presentedColsService.getColAfter(nextCol);

            if (!nextCol) {
                break;
            }
        } while (!nextCol.getColDef().filter || !nextCol.getColDef().floatingFilter);

        return nextCol;
    }

    protected override handleKeyDown(e: KeyboardEvent): void {
        super.handleKeyDown(e);

        const wrapperHasFocus = this.getWrapperHasFocus();

        switch (e.key) {
            case KeyCode.UP:
            case KeyCode.DOWN:
                if (!wrapperHasFocus) {
                    e.preventDefault();
                }
            // eslint-disable-next-line no-fallthrough
            case KeyCode.LEFT:
            case KeyCode.RIGHT:
                if (wrapperHasFocus) {
                    return;
                }
                e.stopPropagation();
            // eslint-disable-next-line no-fallthrough
            case KeyCode.ENTER:
                if (wrapperHasFocus) {
                    if (_focusInto(this.eGui)) {
                        e.preventDefault();
                    }
                }
                break;
            case KeyCode.ESCAPE:
                if (!wrapperHasFocus) {
                    this.eGui.focus();
                }
        }
    }

    private onFocusIn(e: FocusEvent): void {
        const isRelatedWithin = this.eGui.contains(e.relatedTarget as HTMLElement);

        // when the focus is already within the component,
        // we default to the browser's behavior
        if (isRelatedWithin) {
            return;
        }

        const notFromHeaderWrapper =
            !!e.relatedTarget && !(e.relatedTarget as HTMLElement).classList.contains('ag-floating-filter');
        const fromWithinHeader =
            !!e.relatedTarget && _isElementChildOfClass(e.relatedTarget as HTMLElement, 'ag-floating-filter');

        if (notFromHeaderWrapper && fromWithinHeader && e.target === this.eGui) {
            const lastFocusEvent = this.lastFocusEvent;
            const fromTab = !!(lastFocusEvent && lastFocusEvent.key === KeyCode.TAB);

            if (lastFocusEvent && fromTab) {
                const shouldFocusLast = lastFocusEvent.shiftKey;

                _focusInto(this.eGui, shouldFocusLast);
            }
        }

        this.focusThis();
    }

    private setupHover(compBean: BeanStub): void {
        this.beans.colHover?.addHeaderFilterColumnHoverListener(compBean, this.comp, this.column, this.eGui);
    }

    private setupLeft(compBean: BeanStub): void {
        const setLeftFeature = new SetLeftFeature(this.column, this.eGui, this.beans);
        compBean.createManagedBean(setLeftFeature);
    }

    private setupFilterButton(): void {
        this.suppressFilterButton = !this.beans.menuSvc?.isFloatingFilterButtonEnabled(this.column);
        this.highlightFilterButtonWhenActive = !_isLegacyMenuEnabled(this.gos);
    }

    private setupUserComp(): void {
        if (!this.active) {
            return;
        }

        const compDetails = this.beans.filterManager?.getFloatingFilterCompDetails(this.column, () =>
            this.showParentFilter()
        );

        if (compDetails) {
            this.setCompDetails(compDetails);
        }
    }

    private setCompDetails(compDetails?: UserCompDetails | null): void {
        this.userCompDetails = compDetails;
        this.comp.setCompDetails(compDetails);
    }

    private showParentFilter() {
        const eventSource = this.suppressFilterButton ? this.eFloatingFilterBody : this.eButtonShowMainFilter;
        this.beans.menuSvc?.showFilterMenu({
            column: this.column,
            buttonElement: eventSource,
            containerType: 'floatingFilter',
            positionBy: 'button',
        });
    }

    private setupSyncWithFilter(compBean: BeanStub): void {
        if (!this.active) {
            return;
        }
        const { filterManager } = this.beans;

        const syncWithFilter = (event: ColumnEvent | null) => {
            if (event?.source === 'filterDestroyed' && !this.isAlive()) {
                return;
            }
            const compPromise = this.comp.getFloatingFilterComp();

            if (!compPromise) {
                return;
            }

            compPromise.then((comp) => {
                if (comp) {
                    const parentModel = filterManager?.getCurrentFloatingFilterParentModel(this.column);
                    const filterChangedEvent: FilterChangedEvent | null = event
                        ? {
                              // event can have additional params like `afterDataChange` which need to be passed through
                              ...event,
                              columns: event.columns ?? [],
                              source: event.source === 'api' ? 'api' : 'columnFilter',
                          }
                        : null;
                    comp.onParentModelChanged(parentModel, filterChangedEvent);
                }
            });
        };

        [this.destroySyncListener] = compBean.addManagedListeners(this.column, { filterChanged: syncWithFilter });

        if (filterManager?.isFilterActive(this.column)) {
            syncWithFilter(null);
        }
    }

    private setupWidth(compBean: BeanStub): void {
        const listener = () => {
            const width = `${this.column.getActualWidth()}px`;
            this.comp.setWidth(width);
        };

        compBean.addManagedListeners(this.column, { widthChanged: listener });
        listener();
    }

    private setupFilterChangedListener(compBean: BeanStub): void {
        if (this.active) {
            [this.destroyFilterChangedListener] = compBean.addManagedListeners(this.column, {
                filterChanged: this.updateFilterButton.bind(this),
            });
            this.updateFilterButton();
        }
    }

    private updateFilterButton(): void {
        if (!this.suppressFilterButton && this.comp) {
            const isFilterAllowed = !!this.beans.filterManager?.isFilterAllowed(this.column);
            this.comp.setButtonWrapperDisplayed(isFilterAllowed);
            if (this.highlightFilterButtonWhenActive && isFilterAllowed) {
                this.eButtonShowMainFilter.classList.toggle('ag-filter-active', this.column.isFilterActive());
            }
        }
    }

    private onColDefChanged(compBean: BeanStub): void {
        const wasActive = this.active;
        this.setupActive();
        const becomeActive = !wasActive && this.active;
        if (wasActive && !this.active) {
            this.destroySyncListener();
            this.destroyFilterChangedListener();
        }

        const newCompDetails = this.active
            ? this.beans.filterManager?.getFloatingFilterCompDetails(this.column, () => this.showParentFilter())
            : null;

        const compPromise = this.comp.getFloatingFilterComp();
        if (!compPromise || !newCompDetails) {
            this.updateCompDetails(compBean, newCompDetails, becomeActive);
        } else {
            compPromise.then((compInstance) => {
                if (
                    !compInstance ||
                    this.beans.filterManager?.areFilterCompsDifferent(this.userCompDetails ?? null, newCompDetails)
                ) {
                    this.updateCompDetails(compBean, newCompDetails, becomeActive);
                } else {
                    this.updateFloatingFilterParams(newCompDetails);
                }
            });
        }
    }

    private updateCompDetails(
        compBean: BeanStub,
        compDetails: UserCompDetails | null | undefined,
        becomeActive: boolean
    ): void {
        if (!this.isAlive()) {
            return;
        }
        this.setCompDetails(compDetails);
        // filter button and UI can change based on params, so always want to update
        this.setupFilterButton();
        this.setupUi();
        if (becomeActive) {
            this.setupSyncWithFilter(compBean);
            this.setupFilterChangedListener(compBean);
        }
    }

    private updateFloatingFilterParams(userCompDetails?: UserCompDetails | null): void {
        if (!userCompDetails) {
            return;
        }

        const params = userCompDetails.params;

        this.comp.getFloatingFilterComp()?.then((floatingFilter) => {
            if (floatingFilter?.refresh && typeof floatingFilter.refresh === 'function') {
                floatingFilter.refresh(params);
                // framework wrapper always implements optional methods, but returns null if no underlying method
            }
        });
    }

    protected override addResizeAndMoveKeyboardListeners(): void {
        // do nothing
    }

    public override destroy(): void {
        super.destroy();

        (this.destroySyncListener as any) = null;
        (this.destroyFilterChangedListener as any) = null;
    }
}

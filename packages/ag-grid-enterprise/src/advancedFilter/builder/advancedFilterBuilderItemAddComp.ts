import type {
    BeanCollection,
    FieldPickerValueSelectedEvent,
    ITooltipCtrl,
    Registry,
    TooltipFeature,
} from 'ag-grid-community';
import { Component, RefPlaceholder, _setAriaLabel, _setAriaLevel } from 'ag-grid-community';

import type { AdvancedFilterExpressionService } from '../advancedFilterExpressionService';
import { AddDropdownComp } from './addDropdownComp';
import { AdvancedFilterBuilderItemNavigationFeature } from './advancedFilterBuilderItemNavigationFeature';
import { getAdvancedFilterBuilderAddButtonParams } from './advancedFilterBuilderUtils';
import type {
    AdvancedFilterBuilderAddEvent,
    AdvancedFilterBuilderEvents,
    AdvancedFilterBuilderItem,
} from './iAdvancedFilterBuilder';

export class AdvancedFilterBuilderItemAddComp extends Component<AdvancedFilterBuilderEvents> {
    private advFilterExpSvc: AdvancedFilterExpressionService;
    private registry: Registry;

    public wireBeans(beans: BeanCollection) {
        this.advFilterExpSvc = beans.advFilterExpSvc as AdvancedFilterExpressionService;
        this.registry = beans.registry;
    }

    private readonly eItem: HTMLElement = RefPlaceholder;

    constructor(
        private readonly item: AdvancedFilterBuilderItem,
        private readonly focusWrapper: HTMLElement
    ) {
        super(/* html */ `
            <div class="ag-advanced-filter-builder-item-wrapper" role="presentation">
                <div data-ref="eItem" class="ag-advanced-filter-builder-item" role="presentation">
                    <div class="ag-advanced-filter-builder-item-tree-lines" aria-hidden="true">
                        <div class="ag-advanced-filter-builder-item-tree-line-vertical-top ag-advanced-filter-builder-item-tree-line-horizontal"></div>
                    </div>
                </div>
            </div>
        `);
    }

    public postConstruct(): void {
        _setAriaLevel(this.focusWrapper, 2);

        const addButtonParams = getAdvancedFilterBuilderAddButtonParams(
            (key) => this.advFilterExpSvc.translate(key),
            this.gos.get('advancedFilterBuilderParams')?.addSelectWidth
        );
        const eAddButton = this.createManagedBean(new AddDropdownComp(addButtonParams));
        this.addManagedListeners(eAddButton, {
            fieldPickerValueSelected: ({ value }: FieldPickerValueSelectedEvent) => {
                this.dispatchLocalEvent<AdvancedFilterBuilderAddEvent>({
                    type: 'advancedFilterBuilderAdded',
                    item: this.item,
                    isJoin: value.key === 'join',
                });
            },
        });
        this.eItem.appendChild(eAddButton.getGui());

        this.createOptionalManagedBean(
            this.registry.createDynamicBean<TooltipFeature>('tooltipFeature', {
                getGui: () => eAddButton.getGui(),
                getLocation: () => 'advancedFilter',
                getTooltipValue: () => this.advFilterExpSvc.translate('advancedFilterBuilderAddButtonTooltip'),
            } as ITooltipCtrl)
        );

        this.createManagedBean(
            new AdvancedFilterBuilderItemNavigationFeature(this.getGui(), this.focusWrapper, eAddButton)
        );

        _setAriaLabel(
            this.focusWrapper,
            this.advFilterExpSvc.translate('ariaAdvancedFilterBuilderItem', [
                this.advFilterExpSvc.translate('advancedFilterBuilderAddButtonTooltip'),
                `${this.item.level + 1}`,
            ])
        );
    }

    public afterAdd(): void {
        // do nothing
    }
}

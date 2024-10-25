import type {
    AgColumn,
    AgInputTextField,
    BeanCollection,
    ColumnNameService,
    IFloatingFilter,
    IFloatingFilterParams,
    SetFilterModel,
} from 'ag-grid-community';
import { AgInputTextFieldSelector, Component, RefPlaceholder } from 'ag-grid-community';

import { SetFilter } from './setFilter';
import { SetFilterModelFormatter } from './setFilterModelFormatter';

export class SetFloatingFilterComp<V = string> extends Component implements IFloatingFilter {
    private colNames: ColumnNameService;
    private readonly eFloatingFilterText: AgInputTextField = RefPlaceholder;

    public wireBeans(beans: BeanCollection) {
        this.colNames = beans.colNames;
    }

    private params: IFloatingFilterParams;
    private availableValuesListenerAdded = false;
    private readonly filterModelFormatter = new SetFilterModelFormatter();

    constructor() {
        super(
            /* html */ `
            <div class="ag-floating-filter-input ag-set-floating-filter-input" role="presentation">
                <ag-input-text-field data-ref="eFloatingFilterText"></ag-input-text-field>
            </div>`,
            [AgInputTextFieldSelector]
        );
    }

    // this is a user component, and IComponent has "public destroy()" as part of the interface.
    // so we need to override destroy() just to make the method public.
    public override destroy(): void {
        super.destroy();
    }

    public init(params: IFloatingFilterParams): void {
        this.params = params;

        this.eFloatingFilterText.setDisabled(true).addGuiEventListener('click', () => this.params.showParentFilter());

        this.setParams(params);
    }

    private setParams(params: IFloatingFilterParams): void {
        const displayName = this.colNames.getDisplayNameForColumn(params.column as AgColumn, 'header', true);
        const translate = this.getLocaleTextFunc();

        this.eFloatingFilterText.setInputAriaLabel(`${displayName} ${translate('ariaFilterInput', 'Filter Input')}`);
    }

    public refresh(params: IFloatingFilterParams): void {
        this.params = params;
        this.setParams(params);
    }

    public onParentModelChanged(parentModel: SetFilterModel): void {
        this.updateFloatingFilterText(parentModel);
    }

    private parentSetFilterInstance(cb: (instance: SetFilter<V>) => void): void {
        this.params.parentFilterInstance((filter) => {
            if (!(filter instanceof SetFilter)) {
                throw new Error('AG Grid - SetFloatingFilter expects SetFilter as its parent');
            }

            cb(filter);
        });
    }

    private addAvailableValuesListener(): void {
        this.parentSetFilterInstance((setFilter) => {
            const setValueModel = setFilter.getValueModel();

            if (!setValueModel) {
                return;
            }

            // unlike other filters, what we show in the floating filter can be different, even
            // if another filter changes. this is due to how set filter restricts its values based
            // on selections in other filters, e.g. if you filter Language to English, then the set filter
            // on Country will only show English speaking countries. Thus the list of items to show
            // in the floating filter can change.
            this.addManagedListeners(setValueModel, { availableValuesChanged: () => this.updateFloatingFilterText() });
        });

        this.availableValuesListenerAdded = true;
    }

    private updateFloatingFilterText(parentModel?: SetFilterModel | null): void {
        if (!this.availableValuesListenerAdded) {
            this.addAvailableValuesListener();
        }

        this.parentSetFilterInstance((setFilter) => {
            this.eFloatingFilterText.setValue(this.filterModelFormatter.getModelAsString(parentModel, setFilter));
        });
    }
}

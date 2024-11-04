import type { AgSelectParams, BeanCollection, ListOption } from 'ag-grid-community';
import { AgSelect, Component } from 'ag-grid-community';

import type { AgGroupComponent } from '../../../../widgets/agGroupComponent';
import type { AgPillSelectChangeParams } from '../../../widgets/agPillSelect';
import { AgPillSelect } from '../../../widgets/agPillSelect';
import type { ChartController } from '../../chartController';
import type { ColState } from '../../model/chartDataModel';
import { DEFAULT_CHART_CATEGORY } from '../../model/chartDataModel';
import type { ChartTranslationKey, ChartTranslationService } from '../../services/chartTranslationService';

export abstract class DragDataPanel extends Component {
    protected chartTranslation: ChartTranslationService;

    public wireBeans(beans: BeanCollection): void {
        this.chartTranslation = beans.chartTranslation as ChartTranslationService;
    }

    protected groupComp: AgGroupComponent;
    protected valuePillSelect?: AgPillSelect<ColState>;
    private valueSelect?: AgSelect<ColState>;

    constructor(
        protected readonly chartController: ChartController,
        protected readonly allowMultipleSelection: boolean,
        private readonly maxSelection: number | undefined,
        template?: string
    ) {
        super(template);
    }

    public addItem(eItem: HTMLElement): void {
        this.groupComp.addItem(eItem);
    }

    protected createGroup(
        columns: ColState[],
        valueFormatter: (colState: ColState) => string,
        selectLabelKey: ChartTranslationKey,
        dragSourceId: string,
        skipAnimation?: () => boolean
    ): void {
        if (this.allowMultipleSelection) {
            const selectedValueList = columns.filter((col) => col.selected);
            this.valuePillSelect = this.groupComp.createManagedBean(
                new AgPillSelect<ColState>({
                    valueList: columns,
                    selectedValueList,
                    valueFormatter,
                    selectPlaceholder: this.chartTranslation.translate(selectLabelKey),
                    dragSourceId,
                    onValuesChange: (params) => this.onValueChange(params),
                    maxSelection: this.maxSelection,
                })
            );
            this.groupComp.addItem(this.valuePillSelect);
        } else {
            const params: AgSelectParams<ColState> = this.createValueSelectParams(columns);
            params.onValueChange = (updatedColState: ColState) => {
                columns.forEach((col) => {
                    col.selected = false;
                });
                updatedColState.selected = true;
                // Clear the category aggregation function if the default ordinal category is selected
                if (updatedColState.colId === DEFAULT_CHART_CATEGORY) {
                    this.chartController.setAggFunc(undefined, true);
                }
                this.chartController.updateForPanelChange({ updatedColState, skipAnimation: skipAnimation?.() });
            };
            this.valueSelect = this.groupComp.createManagedBean(new AgSelect<ColState>(params));
            this.groupComp.addItem(this.valueSelect);
        }
    }

    protected refreshValueSelect(columns: ColState[]): void {
        if (!this.valueSelect) {
            return;
        }
        const { options, value } = this.createValueSelectParams(columns);
        this.valueSelect.clearOptions().addOptions(options).setValue(value, true);
    }

    private createValueSelectParams(columns: ColState[]): {
        options: ListOption<ColState>[];
        value: ColState;
    } {
        let selectedValue: ColState;
        const options = columns.map((value) => {
            const text = value.displayName ?? '';
            if (value.selected) {
                selectedValue = value;
            }
            return {
                value,
                text,
            };
        });
        return {
            options,
            value: selectedValue!,
        };
    }

    private onValueChange({ added, updated, removed, selected }: AgPillSelectChangeParams<ColState>) {
        let updatedColState: ColState | undefined;
        let resetOrder: boolean | undefined;
        const updateOrder = () => {
            selected.forEach((col, index) => {
                col.order = index;
            });
            resetOrder = true;
        };
        if (added.length) {
            updatedColState = added[0];
            updatedColState.selected = true;
            updateOrder();
        } else if (removed.length) {
            updatedColState = removed[0];
            updatedColState.selected = false;
        } else if (updated.length) {
            updateOrder();
            updatedColState = updated[0];
        }
        if (updatedColState) {
            this.chartController.updateForPanelChange({ updatedColState, resetOrder });
        }
    }

    public override destroy(): void {
        this.valuePillSelect = undefined;
        this.valueSelect = undefined;
        super.destroy();
    }
}

import { AgToggleButton } from 'ag-grid-community';

import { AgGroupComponent } from '../../../../widgets/agGroupComponent';
import type { ChartController } from '../../chartController';
import type { ColState } from '../../model/chartDataModel';
import type { ChartOptionsService } from '../../services/chartOptionsService';
import { DragDataPanel } from './dragDataPanel';

export class SeriesDataPanel extends DragDataPanel {
    constructor(
        chartController: ChartController,
        private readonly chartOptionsService: ChartOptionsService,
        private readonly title: string,
        allowMultipleSelect: boolean,
        maxSelection: number | undefined,
        private valueCols: ColState[],
        private isOpen?: boolean
    ) {
        super(chartController, allowMultipleSelect, maxSelection, /* html */ `<div id="seriesGroup"></div>`);
    }

    public postConstruct() {
        this.groupComp = this.createBean(
            new AgGroupComponent({
                title: this.title,
                enabled: true,
                suppressEnabledCheckbox: true,
                suppressOpenCloseIcons: false,
                cssIdentifier: 'charts-data',
                expanded: this.isOpen,
            })
        );
        if (this.chartController.isActiveXYChart()) {
            const pairedModeToggle = this.groupComp.createManagedBean(
                new AgToggleButton({
                    label: this.chartTranslation.translate('paired'),
                    labelAlignment: 'left',
                    labelWidth: 'flex',
                    inputWidth: 'flex',
                    value: this.chartOptionsService.getPairedMode(),
                    onValueChange: (newValue) => {
                        this.chartOptionsService.setPairedMode(!!newValue);
                        this.chartController.updateForGridChange({ maintainColState: true });
                    },
                })
            );
            this.groupComp.addItem(pairedModeToggle);
        }

        this.createGroup(this.valueCols, this.generateGetSeriesLabel(this.valueCols), 'seriesAdd', 'seriesSelect');

        this.getGui().appendChild(this.groupComp.getGui());
    }

    public refresh(valueCols: ColState[]): void {
        this.valuePillSelect?.setValueFormatter(this.generateGetSeriesLabel(valueCols));
        this.valuePillSelect?.setValues(
            valueCols,
            valueCols.filter((col) => col.selected)
        );
        this.refreshValueSelect(valueCols);
    }

    private generateGetSeriesLabel(valueCols: ColState[]): (col: ColState) => string {
        if (!this.chartController.isActiveXYChart()) {
            return (col) => col.displayName ?? '';
        }

        const selectedCols = valueCols.filter((col) => col.selected);

        const isBubble = this.chartController.getChartType() === 'bubble';
        const isInPairedMode = this.chartOptionsService.getPairedMode();

        const indexToAxisLabel = new Map<number, string>();
        indexToAxisLabel.set(0, 'X');
        indexToAxisLabel.set(1, 'Y');
        indexToAxisLabel.set(2, 'size');

        return (col: ColState): string => {
            const escapedLabel = col.displayName ?? '';

            if (!col.selected) {
                return escapedLabel;
            }

            const index = selectedCols.indexOf(col);

            if (index === -1) {
                return escapedLabel;
            }

            let axisLabel;

            if (isInPairedMode) {
                axisLabel = indexToAxisLabel.get(index % (isBubble ? 3 : 2));
            } else {
                if (index === 0) {
                    axisLabel = 'X';
                } else {
                    axisLabel = isBubble && index % 2 === 0 ? 'size' : 'Y';
                }
            }

            return `${escapedLabel} (${axisLabel})`;
        };
    }

    public override destroy(): void {
        this.groupComp = this.destroyBean(this.groupComp)!;
        super.destroy();
    }
}

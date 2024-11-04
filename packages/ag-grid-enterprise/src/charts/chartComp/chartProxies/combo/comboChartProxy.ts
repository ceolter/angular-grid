import type { AgCartesianAxisOptions } from 'ag-charts-types';

import type { ChartType, SeriesChartType } from 'ag-grid-community';

import { getSeriesType } from '../../utils/seriesTypeMapper';
import { CartesianChartProxy } from '../cartesian/cartesianChartProxy';
import type { ChartProxyParams, FieldDefinition, UpdateParams } from '../chartProxy';

export class ComboChartProxy extends CartesianChartProxy<'line' | 'bar' | 'area'> {
    public constructor(params: ChartProxyParams) {
        super(params);
    }

    public getAxes(params: UpdateParams): AgCartesianAxisOptions[] {
        const fields = params ? params.fields : [];
        const fieldsMap = new Map(fields.map((f) => [f.colId, f]));

        const { primaryYKeys, secondaryYKeys } = this.getYKeys(fields, params.seriesChartTypes);

        const axes: AgCartesianAxisOptions[] = [
            {
                type: this.getXAxisType(params),
                position: 'bottom',
            },
        ];

        if (primaryYKeys.length > 0) {
            axes.push({
                type: 'number',
                keys: primaryYKeys,
                position: 'left',
            });
        }

        if (secondaryYKeys.length > 0) {
            secondaryYKeys.forEach((secondaryYKey: string) => {
                const field = fieldsMap.get(secondaryYKey);
                const secondaryAxisIsVisible = field && field.colId === secondaryYKey;
                if (!secondaryAxisIsVisible) {
                    return;
                }

                const secondaryAxisOptions: AgCartesianAxisOptions = {
                    type: 'number',
                    keys: [secondaryYKey],
                    position: 'right',
                };

                axes.push(secondaryAxisOptions);
            });
        }

        return axes;
    }

    public override getSeries(params: UpdateParams): any {
        const { fields, seriesChartTypes } = params;
        const [category] = params.categories;

        return fields.map((field) => {
            const seriesChartType = seriesChartTypes.find((s) => s.colId === field.colId);
            if (seriesChartType) {
                const chartType: ChartType = seriesChartType.chartType;
                const grouped = ['groupedColumn', 'groupedBar'].includes(chartType);
                const groupedOpts = grouped ? { grouped: true } : {};
                return {
                    type: getSeriesType(chartType),
                    xKey: category.id,
                    yKey: field.colId,
                    yName: field.displayName,
                    ...groupedOpts,
                };
            }
        });
    }

    private getYKeys(fields: FieldDefinition[], seriesChartTypes: SeriesChartType[]) {
        const primaryYKeys: string[] = [];
        const secondaryYKeys: string[] = [];

        fields.forEach((field) => {
            const colId = field.colId;
            const seriesChartType = seriesChartTypes.find((s) => s.colId === colId);
            if (seriesChartType) {
                seriesChartType.secondaryAxis ? secondaryYKeys.push(colId) : primaryYKeys.push(colId);
            }
        });

        return { primaryYKeys, secondaryYKeys };
    }
}

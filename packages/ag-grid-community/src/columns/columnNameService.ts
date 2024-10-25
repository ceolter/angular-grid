import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection } from '../context/context';
import type { AgColumn } from '../entities/agColumn';
import type { AgColumnGroup } from '../entities/agColumnGroup';
import type { AgProvidedColumnGroup } from '../entities/agProvidedColumnGroup';
import type { AbstractColDef, ColDef, HeaderLocation, HeaderValueGetterParams } from '../entities/colDef';
import type { IAggColumnNameService } from '../interfaces/iAggColumnNameService';
import type { ExpressionService } from '../valueService/expressionService';

/**
 * Converts a camelCase string into startCase
 * @param {string} camelCase
 * @return {string}
 */
export function _camelCaseToHumanText(camelCase: string | undefined): string | null {
    if (!camelCase || camelCase == null) {
        return null;
    }

    // either split on a lowercase followed by uppercase ie  asHereTo -> as Here To
    const rex = /([a-z])([A-Z])/g;
    // or starts with uppercase and we take all expect the last which is assumed to be part of next word if followed by lowercase HEREToThere -> HERE To There
    const rexCaps = /([A-Z]+)([A-Z])([a-z])/g;
    const words: string[] = camelCase.replace(rex, '$1 $2').replace(rexCaps, '$1 $2$3').replace(/\./g, ' ').split(' ');

    return words
        .map((word) => word.substring(0, 1).toUpperCase() + (word.length > 1 ? word.substring(1, word.length) : ''))
        .join(' ');
}

export class ColumnNameService extends BeanStub implements NamedBean {
    beanName = 'colNames' as const;

    private expressionSvc?: ExpressionService;
    private aggColumnNameSvc?: IAggColumnNameService;

    public wireBeans(beans: BeanCollection) {
        this.expressionSvc = beans.expressionSvc;
        this.aggColumnNameSvc = beans.aggColumnNameSvc;
    }

    public getDisplayNameForColumn(
        column: AgColumn | null,
        location: HeaderLocation,
        includeAggFunc = false
    ): string | null {
        if (!column) {
            return null;
        }

        const headerName: string | null = this.getHeaderName(column.getColDef(), column, null, null, location);

        if (includeAggFunc && this.aggColumnNameSvc) {
            return this.aggColumnNameSvc.getHeaderName(column, headerName);
        }

        return headerName;
    }

    public getDisplayNameForProvidedColumnGroup(
        columnGroup: AgColumnGroup | null,
        providedColumnGroup: AgProvidedColumnGroup | null,
        location: HeaderLocation
    ): string | null {
        const colGroupDef = providedColumnGroup ? providedColumnGroup.getColGroupDef() : null;

        if (colGroupDef) {
            return this.getHeaderName(colGroupDef, null, columnGroup, providedColumnGroup, location);
        }

        return null;
    }

    public getDisplayNameForColumnGroup(columnGroup: AgColumnGroup, location: HeaderLocation): string | null {
        return this.getDisplayNameForProvidedColumnGroup(columnGroup, columnGroup.getProvidedColumnGroup(), location);
    }

    // location is where the column is going to appear, ie who is calling us
    private getHeaderName(
        colDef: AbstractColDef,
        column: AgColumn | null,
        columnGroup: AgColumnGroup | null,
        providedColumnGroup: AgProvidedColumnGroup | null,
        location: HeaderLocation
    ): string | null {
        const headerValueGetter = colDef.headerValueGetter;

        if (headerValueGetter) {
            const params: HeaderValueGetterParams = this.gos.addGridCommonParams({
                colDef: colDef,
                column: column,
                columnGroup: columnGroup,
                providedColumnGroup: providedColumnGroup,
                location: location,
            });

            if (typeof headerValueGetter === 'function') {
                // valueGetter is a function, so just call it
                return headerValueGetter(params);
            } else if (typeof headerValueGetter === 'string') {
                // valueGetter is an expression, so execute the expression
                return this.expressionSvc?.evaluate(headerValueGetter, params) ?? null;
            }
            return '';
        } else if (colDef.headerName != null) {
            return colDef.headerName;
        } else if ((colDef as ColDef).field) {
            return _camelCaseToHumanText((colDef as ColDef).field);
        }

        return '';
    }
}

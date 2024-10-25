import type { AgColumn } from '../entities/agColumn';
import type { ColDef, ValueFormatterParams } from '../entities/colDef';
import { RowNode } from '../entities/rowNode';
import type { GridOptionsService } from '../gridOptionsService';
import { mock } from '../test-utils/mock';
import type { ExpressionService } from './expressionService';
import { ValueService } from './valueService';

let colDef: ColDef;
let column: jest.Mocked<AgColumn>;
let gos: jest.Mocked<GridOptionsService>;
let expressionSvc: jest.Mocked<ExpressionService>;
let valueSvc: ValueService;

describe('formatValue', () => {
    beforeEach(() => {
        colDef = {};
        column = mock<AgColumn>('getColDef');
        column.getColDef.mockReturnValue(colDef);

        gos = mock<GridOptionsService>('get', 'addGridCommonParams');
        gos.addGridCommonParams.mockImplementation((params) => params as any);
        expressionSvc = mock<ExpressionService>('evaluate');
        valueSvc = new ValueService();
        (valueSvc as any).gos = gos;
        (valueSvc as any).expressionSvc = expressionSvc;
    });

    it('uses supplied formatter if provided', () => {
        const returnValue = 'foo';
        const formatter = () => returnValue;
        const value = 'bar';

        const formattedValue = valueSvc.formatValue(column, null, value, formatter);

        expect(formattedValue).toBe(returnValue);
        expect(expressionSvc.evaluate).toHaveBeenCalledTimes(0);
    });

    it('uses value formatter from column definition if no formatter provided', () => {
        const returnValue = 'foo';
        const formatter = () => returnValue;
        colDef.valueFormatter = formatter;
        const value = 'bar';

        const formattedValue = valueSvc.formatValue(column, null, value);

        expect(formattedValue).toBe(returnValue);
        expect(expressionSvc.evaluate).toHaveBeenCalledTimes(0);
    });

    it('does not use value formatter from column definition if disabled', () => {
        const formatter = (params: ValueFormatterParams) => params.value.toString();
        colDef.valueFormatter = formatter;
        const formattedValue = valueSvc.formatValue(column, null, 'bar', undefined, false);

        expect(formattedValue).toBeNull();
        expect(expressionSvc.evaluate).toHaveBeenCalledTimes(0);
    });

    it('uses pinned value formatter from column definition if row is pinned', () => {
        const returnValue = 'foo';
        const formatter = (params: ValueFormatterParams) => (params.node?.isRowPinned() ? returnValue : '');
        colDef.valueFormatter = formatter;
        const value = 'bar';
        const node = new RowNode({} as any);
        node.rowPinned = 'top';
        expect(node.isRowPinned()).toBe(true);

        const formattedValue = valueSvc.formatValue(column, node, value);

        expect(formattedValue).toBe(returnValue);
        expect(expressionSvc.evaluate).toHaveBeenCalledTimes(0);
    });

    it('looks at refData if no formatter found', () => {
        const value = 'foo';
        const refDataValue = 'bar';
        colDef.refData = { [value]: refDataValue };
        const formattedValue = valueSvc.formatValue(column, null, value);

        expect(formattedValue).toBe(refDataValue);
    });

    it('returns empty string if refData exists but key cannot be found', () => {
        colDef.refData = {};
        const formattedValue = valueSvc.formatValue(column, null, 'foo');

        expect(formattedValue).toBe('');
    });

    it('does not use refData if formatter is found', () => {
        const value = 'foo';
        const returnValue = 'foo';
        const formatter = (params: ValueFormatterParams) => params.value.toString();
        colDef.refData = { [value]: 'bob' };

        const formattedValue = valueSvc.formatValue(column, null, value, formatter);

        expect(formattedValue).toBe(returnValue);
    });

    it('formats array values with spaces by default if not otherwise formatted', () => {
        const value = [1, 2, 3];
        const formattedValue = valueSvc.formatValue(column, null, value);

        expect(formattedValue).toBe('1, 2, 3');
    });
});

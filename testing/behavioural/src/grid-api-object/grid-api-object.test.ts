import type { MockInstance } from 'vitest';

import type { GridApi, GridOptions } from 'ag-grid-community';
import {
    ClientSideRowModelModule,
    ModuleRegistry,
    RowApiModule,
    ValidationModule,
    createGrid,
} from 'ag-grid-community';

describe('ag-grid overlays state', () => {
    let consoleWarnSpy: MockInstance | undefined;
    let consoleErrorSpy: MockInstance | undefined;

    function createMyGrid(gridOptions: GridOptions = {}) {
        return createGrid(document.getElementById('myGrid')!, gridOptions);
    }

    function resetGrids() {
        document.body.innerHTML = '<div id="myGrid"></div>';
    }

    beforeAll(() => {
        ModuleRegistry.registerModules([ClientSideRowModelModule, ValidationModule, RowApiModule]);
    });

    beforeEach(() => {
        resetGrids();
    });

    afterEach(() => {
        consoleWarnSpy?.mockRestore();
        consoleErrorSpy?.mockRestore();
    });

    test('grid api is a simple JS object and has core methods', () => {
        consoleWarnSpy = vitest.spyOn(console, 'warn').mockImplementation(() => {});
        consoleErrorSpy = vitest.spyOn(console, 'error').mockImplementation(() => {});

        const api = createMyGrid();

        expect(api).toBeDefined();
        expect(typeof api).toBe('object');

        // It has all Object.prototype methods
        for (const key of Object.getOwnPropertyNames(Object.prototype)) {
            if (key !== 'constructor' && key !== '__proto__') {
                expect((api as any)[key]).toBe(Object.prototype[key]);
            }
        }
        expect(typeof api.constructor).toBe('function');

        // It has a class name

        expect(api.constructor.name).toBe('GridApi');

        // It has functions
        expect(typeof api.isDestroyed).toBe('function');
        expect(typeof api.destroy).toBe('function');
        expect(typeof api.getRowNode).toBe('function');
        expect(typeof api.dispatchEvent).toBe('function');

        // It passes "in" check
        expect('isDestroyed' in api).toBe(true);
        expect('destroy' in api).toBe(true);
        expect('getRowNode' in api).toBe(true);
        expect('dispatchEvent' in api).toBe(true);

        // It has Object.keys
        const keys = Object.keys(api);
        expect(keys).toContain('isDestroyed');
        expect(keys).toContain('destroy');
        expect(keys).toContain('getRowNode');
        expect(keys).toContain('dispatchEvent');

        const getOwnPropertyNames = Object.getOwnPropertyNames(api);
        expect(getOwnPropertyNames).toContain('isDestroyed');
        expect(getOwnPropertyNames).toContain('destroy');
        expect(getOwnPropertyNames).toContain('getRowNode');
        expect(getOwnPropertyNames).toContain('dispatchEvent');

        // Always the same instance is returned
        expect(api.isDestroyed).toBe(api.isDestroyed);
        expect(api.destroy).toBe(api.destroy);
        expect(api.getRowNode).toBe(api.getRowNode);
        expect(api.dispatchEvent).toBe(api.dispatchEvent);

        // All API function names are correct
        expect(api.isDestroyed.name).toBe('isDestroyed');
        expect(api.destroy.name).toBe('destroy');
        expect(api.getRowNode.name).toBe('getRowNode');
        expect(api.dispatchEvent.name).toBe('dispatchEvent');

        // It has different instances for different functions
        expect(api.getRowNode).not.toBe(api.getAllGridColumns);

        expect(api.isDestroyed()).toBe(false);

        // Properties can be set
        expect('myProperty' in api).toBe(false);
        expect((api as any).myProperty).toBe(undefined);
        (api as any).myProperty = 123;
        expect((api as any).myProperty).toBe(123);
        expect('myProperty' in api).toBe(true);

        // Methods can be overridden (or spied with testing frameworks)
        const oldGetRowNode = api.getRowNode;
        api.getRowNode = () => 'xxxx' as any;
        expect((api.getRowNode as any)()).toBe('xxxx');
        api.getRowNode = oldGetRowNode;
        expect(api.getRowNode).toBe(oldGetRowNode);

        // Methods can be deleted
        delete (api as Partial<GridApi>).getRowNode;
        expect('getRowNode' in api).toBe(false);
        api.getRowNode = oldGetRowNode;

        // Methods are bound to the grid
        const { isDestroyed, getRowNode } = api;
        expect(isDestroyed()).toBe(false);
        expect(getRowNode('123')).toBe(undefined);

        // No warnings or errors
        expect(consoleWarnSpy).toHaveBeenCalledTimes(0);
        expect(consoleErrorSpy).toHaveBeenCalledTimes(0);
    });

    test('destruction warnings', () => {
        consoleWarnSpy = vitest.spyOn(console, 'warn').mockImplementation(() => {});

        const api = createMyGrid();
        expect(api.isDestroyed()).toBe(false);

        expect(api.getRowNode('123')).toBeUndefined();

        api.destroy();
        expect(api.isDestroyed()).toBe(true);

        api.destroy();
        expect(api.isDestroyed()).toBe(true);

        expect(consoleWarnSpy).toHaveBeenCalledTimes(0);

        expect(api.getRowNode('123')).toBe(undefined);

        expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
        expect(consoleWarnSpy).toHaveBeenCalledWith(
            'AG Grid: error #26',
            expect.stringContaining(`Grid API function getRowNode() cannot be called as the grid has been destroyed.
 Either clear local references to the grid api, when it is destroyed, or check gridApi.isDestroyed() to avoid calling methods against a destroyed grid.
 To run logic when the grid is about to be destroyed use the gridPreDestroy event.`),
            expect.stringContaining('/javascript-data-grid/errors/26')
        );

        expect(api.getRowNode('123')).toBe(undefined);

        expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
    });

    test('missing module warning', () => {
        consoleErrorSpy = vitest.spyOn(console, 'error').mockImplementation(() => {});
        consoleWarnSpy = vitest.spyOn(console, 'warn').mockImplementation(() => {});

        const api = createMyGrid();

        expect(typeof api.exportDataAsExcel).toBe('function');
        expect('exportDataAsExcel' in api).toBe(true);
        expect(api.exportDataAsExcel).toBe(api.exportDataAsExcel);

        expect(consoleErrorSpy).toHaveBeenCalledTimes(0);

        expect(api.exportDataAsExcel()).toBeUndefined();

        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
        // expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('exportDataAsExcel'));
        // expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('ExcelExportModule'));

        expect(api.exportDataAsExcel()).toBeUndefined();
        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

        api.destroy();

        expect(api.exportDataAsExcel()).toBeUndefined();
        expect(consoleWarnSpy).toHaveBeenCalledTimes(1);
        expect(consoleWarnSpy).toHaveBeenCalledWith(
            'AG Grid: error #26',
            expect.stringContaining(`Grid API function exportDataAsExcel() cannot be called as the grid has been destroyed.
 Either clear local references to the grid api, when it is destroyed, or check gridApi.isDestroyed() to avoid calling methods against a destroyed grid.
 To run logic when the grid is about to be destroyed use the gridPreDestroy event.`),
            expect.stringContaining('/javascript-data-grid/errors/26')
        );

        expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });
});

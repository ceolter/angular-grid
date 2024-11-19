import { getModuleMappingsSnippet } from './getModuleMappingsSnippet';

describe('getModuleMappingsSnippet', () => {
    test('empty', () => {
        expect(getModuleMappingsSnippet({ community: [], enterprise: [] })).toEqual(undefined);
    });

    test('community', () => {
        const selectedModules = { community: ['SparklinesModule'], enterprise: [] };
        expect(getModuleMappingsSnippet(selectedModules)).toMatchInlineSnapshot(`
          "import { 
              ModuleRegistry,
              SparklinesModule,
          } from 'ag-grid-community';

          ModuleRegistry.registerModules([
              SparklinesModule,
          ]);"
        `);
    });

    test('multiple community', () => {
        const selectedModules = { community: ['SparklinesModule', 'ColumnHoverModule'], enterprise: [] };
        expect(getModuleMappingsSnippet(selectedModules)).toMatchInlineSnapshot(`
          "import { 
              ModuleRegistry,
              SparklinesModule,
              ColumnHoverModule,
          } from 'ag-grid-community';

          ModuleRegistry.registerModules([
              SparklinesModule,
              ColumnHoverModule,
          ]);"
        `);
    });

    test('enterprise', () => {
        const selectedModules = { community: [], enterprise: ['SetFilterModule'] };
        expect(getModuleMappingsSnippet(selectedModules)).toMatchInlineSnapshot(`
          "import { 
              ModuleRegistry,
          } from 'ag-grid-community';
          import {
              SetFilterModule,
          } from 'ag-grid-enterprise';

          ModuleRegistry.registerModules([
              SetFilterModule,
          ]);"
        `);
    });

    test('multiple community', () => {
        const selectedModules = { community: [], enterprise: ['SetFilterModule', 'RowGroupingModule'] };
        expect(getModuleMappingsSnippet(selectedModules)).toMatchInlineSnapshot(`
          "import { 
              ModuleRegistry,
          } from 'ag-grid-community';
          import {
              SetFilterModule,
              RowGroupingModule,
          } from 'ag-grid-enterprise';

          ModuleRegistry.registerModules([
              SetFilterModule,
              RowGroupingModule,
          ]);"
        `);
    });

    test('community and enterprise', () => {
        const selectedModules = { community: ['AllCommunityModule'], enterprise: ['SetFilterModule'] };
        expect(getModuleMappingsSnippet(selectedModules)).toMatchInlineSnapshot(`
          "import { 
              ModuleRegistry,
              AllCommunityModule,
          } from 'ag-grid-community';
          import {
              SetFilterModule,
          } from 'ag-grid-enterprise';

          ModuleRegistry.registerModules([
              AllCommunityModule,
              SetFilterModule,
          ]);"
        `);
    });
});

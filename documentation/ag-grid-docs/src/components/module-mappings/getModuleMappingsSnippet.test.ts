import { getModuleMappingsSnippet } from './getModuleMappingsSnippet';

describe('getModuleMappingsSnippet', () => {
    test('empty', () => {
        const selectedModules = { community: [], enterprise: [] };
        expect(getModuleMappingsSnippet({ chartsImportType: 'none', selectedModules })).toEqual(undefined);
    });

    test('community', () => {
        const selectedModules = { community: ['ValidationModule'], enterprise: [] };
        expect(getModuleMappingsSnippet({ chartsImportType: 'none', selectedModules })).toMatchInlineSnapshot(`
          "import {
              ModuleRegistry,
              ValidationModule,
          } from 'ag-grid-community';

          ModuleRegistry.registerModules([
              ValidationModule,
          ]);"
        `);
    });

    test('multiple community', () => {
        const selectedModules = { community: ['ValidationModule', 'ColumnHoverModule'], enterprise: [] };
        expect(getModuleMappingsSnippet({ chartsImportType: 'none', selectedModules })).toMatchInlineSnapshot(`
          "import {
              ModuleRegistry,
              ValidationModule,
              ColumnHoverModule,
          } from 'ag-grid-community';

          ModuleRegistry.registerModules([
              ValidationModule,
              ColumnHoverModule,
          ]);"
        `);
    });

    test('enterprise', () => {
        const selectedModules = { community: [], enterprise: ['SetFilterModule'] };
        expect(getModuleMappingsSnippet({ chartsImportType: 'none', selectedModules })).toMatchInlineSnapshot(`
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
        expect(getModuleMappingsSnippet({ chartsImportType: 'none', selectedModules })).toMatchInlineSnapshot(`
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
        expect(getModuleMappingsSnippet({ chartsImportType: 'none', selectedModules })).toMatchInlineSnapshot(`
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

    describe('charts - sparklines', () => {
        test('no bundles', () => {
            const selectedModules = { community: [], enterprise: ['SparklinesModule'] };
            expect(getModuleMappingsSnippet({ chartsImportType: 'community', selectedModules })).toMatchInlineSnapshot(`
              "import { AgChartsCommunityModule } from 'ag-charts-community';
              import {
                  ModuleRegistry,
              } from 'ag-grid-community';
              import {
                  SparklinesModule,
              } from 'ag-grid-enterprise';

              ModuleRegistry.registerModules([
                  SparklinesModule.with(AgChartsCommunityModule),
              ]);"
            `);
        });

        test('all community', () => {
            const selectedModules = { community: ['AllCommunityModule'], enterprise: ['SparklinesModule'] };
            expect(getModuleMappingsSnippet({ chartsImportType: 'community', selectedModules })).toMatchInlineSnapshot(`
              "import { AgChartsCommunityModule } from 'ag-charts-community';
              import {
                  ModuleRegistry,
                  AllCommunityModule,
              } from 'ag-grid-community';
              import {
                  SparklinesModule,
              } from 'ag-grid-enterprise';

              ModuleRegistry.registerModules([
                  AllCommunityModule,
                  SparklinesModule.with(AgChartsCommunityModule),
              ]);"
            `);
        });
    });

    describe('charts - integrated charts', () => {
        test('no bundles (with enterprise charts)', () => {
            const selectedModules = { community: [], enterprise: ['IntegratedChartsModule'] };
            expect(getModuleMappingsSnippet({ chartsImportType: 'enterprise', selectedModules }))
                .toMatchInlineSnapshot(`
              "import { AgChartsEnterpriseModule } from 'ag-charts-enterprise';
              import {
                  ModuleRegistry,
              } from 'ag-grid-community';
              import {
                  IntegratedChartsModule,
              } from 'ag-grid-enterprise';

              ModuleRegistry.registerModules([
                  IntegratedChartsModule.with(AgChartsEnterpriseModule),
              ]);"
            `);
        });

        test('all community (with enterprise charts)', () => {
            const selectedModules = { community: ['AllCommunityModule'], enterprise: ['IntegratedChartsModule'] };
            expect(getModuleMappingsSnippet({ chartsImportType: 'enterprise', selectedModules }))
                .toMatchInlineSnapshot(`
              "import { AgChartsEnterpriseModule } from 'ag-charts-enterprise';
              import {
                  ModuleRegistry,
                  AllCommunityModule,
              } from 'ag-grid-community';
              import {
                  IntegratedChartsModule,
              } from 'ag-grid-enterprise';

              ModuleRegistry.registerModules([
                  AllCommunityModule,
                  IntegratedChartsModule.with(AgChartsEnterpriseModule),
              ]);"
            `);
        });
    });

    describe('charts - both sparklines and integrated charts', () => {
        test('no bundles (with enterprise charts)', () => {
            const selectedModules = { community: [], enterprise: ['SparklinesModule', 'IntegratedChartsModule'] };
            expect(getModuleMappingsSnippet({ chartsImportType: 'enterprise', selectedModules }))
                .toMatchInlineSnapshot(`
              "import { AgChartsEnterpriseModule } from 'ag-charts-enterprise';
              import {
                  ModuleRegistry,
              } from 'ag-grid-community';
              import {
                  SparklinesModule,
                  IntegratedChartsModule,
              } from 'ag-grid-enterprise';

              ModuleRegistry.registerModules([
                  SparklinesModule.with(AgChartsEnterpriseModule),
                  IntegratedChartsModule.with(AgChartsEnterpriseModule),
              ]);"
            `);
        });

        test('all community (with enterprise charts)', () => {
            const selectedModules = {
                community: ['AllCommunityModule'],
                enterprise: ['SparklinesModule', 'IntegratedChartsModule'],
            };
            expect(getModuleMappingsSnippet({ chartsImportType: 'enterprise', selectedModules }))
                .toMatchInlineSnapshot(`
              "import { AgChartsEnterpriseModule } from 'ag-charts-enterprise';
              import {
                  ModuleRegistry,
                  AllCommunityModule,
              } from 'ag-grid-community';
              import {
                  SparklinesModule,
                  IntegratedChartsModule,
              } from 'ag-grid-enterprise';

              ModuleRegistry.registerModules([
                  AllCommunityModule,
                  SparklinesModule.with(AgChartsEnterpriseModule),
                  IntegratedChartsModule.with(AgChartsEnterpriseModule),
              ]);"
            `);
        });
    });

    /**
     * With `AllEnterpriseModule`, only `chartsImportType` is used to
     * determine which charts to import
     */
    describe('all enterprise', () => {
        test('community charts', () => {
            const selectedModules = { community: [], enterprise: ['AllEnterpriseModule'] };
            expect(getModuleMappingsSnippet({ chartsImportType: 'community', selectedModules })).toMatchInlineSnapshot(`
              "import { AgChartsCommunityModule } from 'ag-charts-community';
              import {
                  ModuleRegistry,
              } from 'ag-grid-community';
              import {
                  AllEnterpriseModule,
              } from 'ag-grid-enterprise';

              ModuleRegistry.registerModules([
                  AllEnterpriseModule.with(AgChartsCommunityModule),
              ]);"
            `);
        });

        test('enterprise charts', () => {
            const selectedModules = { community: [], enterprise: ['AllEnterpriseModule'] };
            expect(getModuleMappingsSnippet({ chartsImportType: 'enterprise', selectedModules }))
                .toMatchInlineSnapshot(`
              "import { AgChartsEnterpriseModule } from 'ag-charts-enterprise';
              import {
                  ModuleRegistry,
              } from 'ag-grid-community';
              import {
                  AllEnterpriseModule,
              } from 'ag-grid-enterprise';

              ModuleRegistry.registerModules([
                  AllEnterpriseModule.with(AgChartsEnterpriseModule),
              ]);"
            `);
        });
    });
});

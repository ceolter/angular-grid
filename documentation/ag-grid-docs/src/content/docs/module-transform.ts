/* eslint-disable no-console */
import type { API, FileInfo, Options } from 'jscodeshift';

import { RESOLVABLE_MODULE_NAMES } from '../../../../../packages/ag-grid-community/src/validation/resolvableModuleNames';
import { ValidationService } from '../../../../../packages/ag-grid-community/src/validation/validationService';
import { addNewImportNextToGiven } from './module-transform-utils';

const nodeToJson = (node: any): any => {
    try {
        return eval('(' + node.replace('!', '').replace(/<[^>]*>/g, '') + ')');
    } catch (e) {
        console.log('Error parsing node:', node);
        throw e;
    }
};

const updateModules = (fileInfo: FileInfo, api: API, options: Options) => {
    const j = api.jscodeshift;
    const root = j(fileInfo.source);
    const requiredModules = new Set<string>();

    // Find all import declarations
    sortAndCombineImports(root, j);

    // Find the gridOptions variable declaration
    const gridOptions = root.findVariableDeclarators('gridOptions');

    if (gridOptions.size() === 0) {
        return fileInfo.source;
    }

    // Determine the required modules based on the gridOptions
    // start with existing modules

    root.find(j.CallExpression, {
        callee: { object: { name: 'ModuleRegistry' }, property: { name: 'registerModules' } },
    })
        .find(j.ArrayExpression)
        .forEach((path) => {
            path.node.elements.forEach((element) => {
                if (element.type === 'Identifier') {
                    if (element.name !== 'AllCommunityModule') {
                        requiredModules.add(element.name);
                    }
                }
            });
        });

    // create object of gridOptions
    // // Remove the onGridReady property from gridOptions and then put it back
    // gridOptions
    //     .find(j.ObjectExpression)
    //     .find(j.Property, { key: { name: 'onGridReady' } })
    //     .remove();

    const gridOptionsObject = j(gridOptions.nodes()[0].init).toSource();
    const json = nodeToJson(gridOptionsObject); //JSON.parse(gridOptionsObject);

    const valService = new ValidationService();
    valService.wireBeans({
        gridOptions: {},
    });
    valService.gos = {
        assertModuleRegistered: (m) => {
            if (!m.includes('Module')) {
                m += 'Module';
            }
            console.log('assertModuleRegistered', m);

            if (requiredModules.has(m)) {
                return true;
            }

            const resolvable = RESOLVABLE_MODULE_NAMES[m.replace('Module', '')];
            console.log('resolvable', resolvable);
            if (resolvable) {
                const alreadyHas = resolvable.some((r) => {
                    if (requiredModules.has(r + 'Module')) {
                        return true;
                    }
                });
                if (alreadyHas) {
                    return true;
                }
            }

            console.log('adding', m, requiredModules);
            if (m === 'SharedRowGroupingModule') {
                if (requiredModules.has('ClientSideRowModelModule')) {
                    requiredModules.add('RowGroupingModule');
                }
            } else if (m === 'SharedAggregationModule') {
                if (requiredModules.has('ClientSideRowModelModule')) {
                    requiredModules.add('RowSelectionModule');
                }
            } else {
                requiredModules.add(m);
            }

            return true;
        },
    };
    valService.processGridOptions(json);

    if (json.columnDefs) {
        json.columnDefs.forEach((colDef) => {
            valService.validateColDef(colDef, '', true);
        });
    }

    // put onGridReady back

    // Extract the columnDefs field from gridOptions
    // const columnDefs = gridOptions.find(j.ObjectExpression).find(j.Property, { key: { name: 'columnDefs' } });

    Object.entries(USER_COMP_MODULES).forEach(([componentName, moduleName]) => {
        if (findString(root, j, componentName)) {
            requiredModules.add(moduleName);
        }
    });

    // Find the registerModules call and update the array
    root.find(j.CallExpression, {
        callee: { object: { name: 'ModuleRegistry' }, property: { name: 'registerModules' } },
    })
        .find(j.ArrayExpression)
        .forEach((path) => {
            path.node.elements = Array.from(requiredModules).map((moduleName) => j.identifier(moduleName));
        });

    console.log('requiredModules', requiredModules);
    requiredModules.forEach((moduleName) => {
        addNewImportNextToGiven(root, 'AllCommunityModule', moduleName);
    });

    // Replace the import to AllCommunityModule with the required modules
    root.find(j.ImportDeclaration, { source: { value: 'ag-grid-community' } })
        .find(j.ImportSpecifier, { imported: { name: 'AllCommunityModule' } })
        .remove();

    sortAndCombineImports(root, j);

    return root.toSource();
};

export default updateModules;

function findString(root, j, value: string) {
    return root.find(j.StringLiteral, { value }).size() > 0;
}

function sortAndCombineImports(root, j) {
    const importDeclarations = root.find(j.ImportDeclaration);

    // Separate type imports from regular imports
    // const typeImports = importDeclarations.filter((path) => path.node.importKind === 'type');
    const regularImports = importDeclarations; //.filter((path) => path.node.importKind !== 'type');

    // Sort the import declarations alphabetically by source value
    const sortImports = (imports) =>
        imports.nodes().sort((a, b) => {
            const sourceA = a.source.value.toString().toLowerCase();
            const sourceB = b.source.value.toString().toLowerCase();
            if (sourceA < sourceB) return -1;
            if (sourceA > sourceB) return 1;

            // type imports first
            if (a.importKind === 'type' && b.importKind !== 'type') return -1;

            return 0;
        });

    // const sortedTypeImports = sortImports(typeImports);
    const sortedRegularImports = sortImports(regularImports);

    // Combine duplicate imports
    const combineImports = (imports) =>
        imports.reduce((acc, importDecl) => {
            const existingImport = acc.find(
                (imp) => imp.source.value === importDecl.source.value && imp.importKind === importDecl.importKind
            );
            if (existingImport) {
                // Combine specifiers
                importDecl.specifiers.forEach((specifier) => {
                    if (!existingImport.specifiers.some((s) => s.local.name === specifier.local.name)) {
                        existingImport.specifiers.push(specifier);
                    }
                });
            } else {
                acc.push(importDecl);
            }
            return acc;
        }, []);

    const combinedRegularImports = combineImports(sortedRegularImports);

    // Sort the specifiers within each import declaration
    combinedRegularImports.forEach((importDecl) => {
        importDecl.specifiers.sort((a, b) => {
            const specifierA = a?.local?.name?.toString();
            const specifierB = b?.local?.name?.toString();
            if (specifierA < specifierB) return -1;
            if (specifierA > specifierB) return 1;
            return 0;
        });
    });

    // Replace the existing import declarations with the sorted and combined ones
    importDeclarations.remove();
    root.get().node.program.body.unshift(...combinedRegularImports);
}

export const USER_COMP_MODULES = {
    agSetColumnFilter: 'SetFilterModule',
    agSetColumnFloatingFilter: 'SetFilterModule',
    agMultiColumnFilter: 'MultiFilterModule',
    agMultiColumnFloatingFilter: 'MultiFilterModule',
    agGroupColumnFilter: 'GroupFilterModule',
    agGroupColumnFloatingFilter: 'GroupFilterModule',
    agGroupCellRenderer: 'GroupCellRendererModule',
    agGroupRowRenderer: 'GroupCellRendererModule',
    agRichSelect: 'RichSelectModule',
    agRichSelectCellEditor: 'RichSelectModule',
    agDetailCellRenderer: 'SharedMasterDetailModule',
    agSparklineCellRenderer: 'SparklinesModule',
    agDragAndDropImage: 'SharedDragAndDropModule',
    agColumnHeader: 'ColumnHeaderCompModule',
    agColumnGroupHeader: 'ColumnGroupHeaderCompModule',
    agSortIndicator: 'SortModule',
    agAnimateShowChangeCellRenderer: 'HighlightChangesModule',
    agAnimateSlideCellRenderer: 'HighlightChangesModule',
    agLoadingCellRenderer: 'LoadingCellRendererModule',
    agSkeletonCellRenderer: 'SkeletonCellRendererModule',
    agCheckboxCellRenderer: 'CheckboxCellRendererModule',
    agLoadingOverlay: 'OverlayModule',
    agNoRowsOverlay: 'OverlayModule',
    agTooltipComponent: 'TooltipModule',
    agReadOnlyFloatingFilter: 'CustomFilterModule',
    agTextColumnFilter: 'TextFilterModule',
    agNumberColumnFilter: 'NumberFilterModule',
    agDateColumnFilter: 'DateFilterModule',
    agDateInput: 'DateFilterModule',
    agTextColumnFloatingFilter: 'TextFilterModule',
    agNumberColumnFloatingFilter: 'NumberFilterModule',
    agDateColumnFloatingFilter: 'DateFilterModule',
    agCellEditor: 'TextEditorModule',
    agSelectCellEditor: 'SelectEditorModule',
    agTextCellEditor: 'TextEditorModule',
    agNumberCellEditor: 'NumberEditorModule',
    agDateCellEditor: 'DateEditorModule',
    agDateStringCellEditor: 'DateEditorModule',
    agCheckboxCellEditor: 'CheckboxEditorModule',
    agLargeTextCellEditor: 'LargeTextEditorModule',
    agMenuItem: 'MenuItemModule',
    agColumnsToolPanel: 'ColumnsToolPanelModule',
    agFiltersToolPanel: 'FiltersToolPanelModule',
    agAggregationComponent: 'StatusBarModule',
    agSelectedRowCountComponent: 'StatusBarModule',
    agTotalRowCountComponent: 'StatusBarModule',
    agFilteredRowCountComponent: 'StatusBarModule',
    agTotalAndFilteredRowCountComponent: 'StatusBarModule',
};

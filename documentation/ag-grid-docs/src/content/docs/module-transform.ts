// /* eslint-disable  */
// import type { API, FileInfo, Options } from 'jscodeshift';

// import { RESOLVABLE_MODULE_NAMES } from '../../../../../packages/ag-grid-community/src/validation/resolvableModuleNames';
// import { GRID_OPTIONS_VALIDATORS } from '../../../../../packages/ag-grid-community/src/validation/rules/gridOptionsValidations';
// import { ValidationService } from '../../../../../packages/ag-grid-community/src/validation/validationService';
// import { AllCommunityModule, AllEnterpriseModule } from '../../../../../packages/ag-grid-enterprise/src/main';
// import { addNewImportNextToGiven } from './module-transform-utils';

// // const tsBlankSpace = require('ts-blank-space');

// // const nodeToJson = async (node: any): any => {
// //     return (async () => {
// //         console.log('importing ts-blank-space');
// //         const tsBlankSpace = await import('ts-blank-space').then((psl) => psl.default);
// //         const clean = tsBlankSpace(node);
// //         console.log('clean', clean, node);
// //         // .replace('!', '')
// //         // .replace(/<[^>]*>/g, '')
// //         // .replace(/:\s*[^)\s]+/g, '')
// //         // .replace(' as ISetFilterParams', '');
// //         try {
// //             return eval('(' + clean + ')');
// //         } catch (e) {
// //             console.log('Error parsing node:', clean);
// //             throw e;
// //         }
// //         console.log('imported ts-blank-space');
// //     })().catch(console.error);
// // };

// export function getModuleDeps(moduleStr): any[] {
//     const allDeps: string[] = [];
//     // moduleStr = moduleStr// + 'Module';
//     // find module from moduleStr as a dep of AllCommunityModule or AllEnterpriseModule
//     // console.log('getModuleDeps', moduleStr, AllCommunityModule.dependsOn);
//     const mod =
//         AllCommunityModule.dependsOn!.find(
//             (m) => m.moduleName === moduleStr || m.moduleName === moduleStr + 'Module'
//         ) ??
//         AllEnterpriseModule.dependsOn!.find((m) => m.moduleName === moduleStr || m.moduleName === moduleStr + 'Module');

//     if (mod) {
//         allDeps.push(mod.moduleName);
//         for (const dep of mod.dependsOn ?? []) {
//             allDeps.push(dep.moduleName);
//             allDeps.push(...getModuleDeps(dep.moduleName));
//         }
//     } else {
//         // console.warn('Cant find', moduleStr);
//     }
//     return allDeps;
// }

// export default async function updateModules(fileInfo: FileInfo, api: API, options: Options) {
//     const j = api.jscodeshift;
//     const root = j(fileInfo.source);
//     const requiredModules = new Set<string>();

//     if (fileInfo.path.includes('deep-dive') || fileInfo.path.includes('getting-started')) {
//         return;
//     }

//     // Find all import declarations
//     // sortAndCombineImports(root, j);

//     // return root.toSource();
//     // Find the gridOptions variable declaration
//     // const gridOptions = root.findVariableDeclarators('gridOptions');

//     // if (gridOptions.size() === 0) {
//     //     // return fileInfo.source;
//     // }

//     // Determine the required modules based on the gridOptions
//     // start with existing modules
//     let hasAllCommunityModule = false;

//     root.find(j.CallExpression, {
//         callee: { object: { name: 'ModuleRegistry' }, property: { name: 'registerModules' } },
//     })
//         .find(j.ArrayExpression)
//         .forEach((path) => {
//             path.node.elements.forEach((element) => {
//                 if (element.type === 'Identifier') {
//                     if (element.name !== 'AllCommunityModule') {
//                         requiredModules.add(element.name);
//                     } else {
//                         hasAllCommunityModule = true;
//                     }
//                 }
//                 // match IntegratedChartsModule.withAgGrid(EnterpriseCoreModule);
//                 if (element.type === 'CallExpression') {
//                     if (element.callee.object.name === 'IntegratedChartsModule') {
//                         requiredModules.add('IntegratedChartsModule.with(AgChartsEnterpriseModule)');
//                     }
//                     if (element.callee.object.name === 'SparklinesModule') {
//                         requiredModules.add('SparklinesModule.with(AgChartsEnterpriseModule)');
//                     }
//                 }
//             });
//         });

//     // create object of gridOptions
//     // // Remove the onGridReady property from gridOptions and then put it back
//     // gridOptions
//     //     .find(j.ObjectExpression)
//     //     .find(j.Property, { key: { name: 'onGridReady' } })
//     //     .remove();

//     // const gridOptionsObject = j(gridOptions.nodes()[0].init).toSource();
//     // const json = await nodeToJson(gridOptionsObject); //JSON.parse(gridOptionsObject);

//     // const valService = new ValidationService();
//     // valService.wireBeans({
//     //     gridOptions: {},
//     // });
//     // valService.gos = {
//     //     assertModuleRegistered: (m) => {
//     //         if (!m.includes('Module')) {
//     //             m += 'Module';
//     //         }
//     //         console.log('assertModuleRegistered', m);

//     //         if (requiredModules.has(m)) {
//     //             return true;
//     //         }

//     //         const resolvable = RESOLVABLE_MODULE_NAMES[m.replace('Module', '')];
//     //         console.log('resolvable', resolvable);
//     //         if (resolvable) {
//     //             const alreadyHas = resolvable.some((r) => {
//     //                 if (requiredModules.has(r + 'Module')) {
//     //                     return true;
//     //                 }
//     //             });
//     //             if (alreadyHas) {
//     //                 return true;
//     //             }
//     //         }

//     //         console.log('adding', m, requiredModules);
//     //         if (m === 'SharedRowGroupingModule') {
//     //             if (requiredModules.has('ClientSideRowModelModule')) {
//     //                 requiredModules.add('RowGroupingModule');
//     //             }
//     //         } else if (m === 'SharedAggregationModule') {
//     //             if (requiredModules.has('ClientSideRowModelModule')) {
//     //                 requiredModules.add('RowSelectionModule');
//     //             }
//     //         } else {
//     //             requiredModules.add(m);
//     //         }

//     //         return true;
//     //     },
//     // };
//     // valService.processGridOptions(json);

//     // if (json.columnDefs) {
//     //     json.columnDefs.forEach((colDef) => {
//     //         valService.validateColDef(colDef, '', true);
//     //     });
//     // }

//     // put onGridReady back

//     // Extract the columnDefs field from gridOptions
//     // const columnDefs = gridOptions.find(j.ObjectExpression).find(j.Property, { key: { name: 'columnDefs' } });
//     // let updated = false;
//     // Object.entries(USER_COMP_MODULES).forEach(([componentName, moduleName]) => {
//     //     if (findString(root, j, componentName)) {
//     //         requiredModules.add(moduleName);
//     //         updated = true;
//     //     }
//     // });
//     // if (!updated) {
//     //     return;
//     // }
//     const toAdd = new Set<string>();

//     // const allCurrentModules = [
//     //     ...[...requiredModules.values()].flatMap((v) =>
//     //         getModuleDeps(v.endsWith('Module') ? v.replace('Module', '') : (v as any))
//     //     ),
//     // ].map((m) => m + 'Module');
//     // console.log('allCurrentModules', allCurrentModules);

//     // Object.keys(GRID_OPTIONS_VALIDATORS().validations).map((k: any) => {
//     //     const validation = GRID_OPTIONS_VALIDATORS().validations[k];
//     //     if (validation.module) {
//     //         const m = validation.module;
//     //         const resolvable = RESOLVABLE_MODULE_NAMES[m.replace('Module', '')];
//     //         if (resolvable) {
//     //             // console.log('resolvable', resolvable);
//     //             const alreadyHas = resolvable.some((r) => {
//     //                 return allCurrentModules.includes(r + 'Module');
//     //             });
//     //             if (!alreadyHas) {
//     //                 if (findString(root, j, k)) {
//     //                     toAdd.add(validation.module + 'Module');
//     //                 }
//     //             }
//     //         } else {
//     //             if (findString(root, j, k)) {
//     //                 toAdd.add(validation.module + 'Module');
//     //             }
//     //         }
//     //     }
//     // });

//     // if (findString(root, j, 'rightAligned') || findString(root, j, 'numericColumn')) {
//     //     toAdd.add('CellStyleModule');
//     // }
//     // rowStyle, getRowStyle, rowClass, getRowClass, rowClassRules

//     // if (findString(root, j, 'agTextColumnFloatingFilter')) {
//     //     toAdd.add('TextFilterModule');
//     // }
//     if (findString(root, j, 'agAnimateSlideCellRenderer')) {
//         toAdd.add('HighlightChangesModule');
//     }

//     if (['rowDrag'].some((p) => findIdentifier(root, j, p))) {
//         toAdd.add('RowDragModule');
//     }

//     // if (findIdentifier(root, j, 'filter')) {
//     //     if (findString(root, j, 'gold') || findString(root, j, 'total')) {
//     //         console.log('number filter');
//     //         toAdd.add('NumberFilterModule');
//     //     }
//     //     if (!findIdentifier(root, j, 'SetFilterModule')) {
//     //         toAdd.add('TextFilterModule');
//     //     }
//     //     // const mod = 'RowDrag';
//     //     // toAdd.add(mod + 'Module');
//     //     // console.log(mod + 'Module');
//     // }

//     // if (findIdentifier(root, j, 'editable')) {
//     //     if (![...requiredModules].some((m) => m.includes('Editor'))) {
//     //         toAdd.add('TextEditorModule');
//     //         if (findString(root, j, 'gold') || findString(root, j, 'age') || findString(root, j, 'total')) {
//     //             toAdd.add('NumberEditorModule');
//     //         }
//     //     }
//     //     // const mod = 'RowDrag';
//     //     // toAdd.add(mod + 'Module');
//     //     // console.log(mod + 'Module');
//     // }

//     // Find the registerModules call and update the array
//     root.find(j.CallExpression, {
//         callee: { object: { name: 'ModuleRegistry' }, property: { name: 'registerModules' } },
//     })
//         .find(j.ArrayExpression)
//         .forEach((path) => {
//             //path.node.elements = Array.from(requiredModules).map((moduleName) => j.identifier(moduleName));

//             // add new modules
//             toAdd.forEach((moduleName) => {
//                 const module = j.identifier(moduleName);
//                 if (!requiredModules.has(moduleName)) {
//                     // path.node.elements.push(module);
//                     // add in alphabetical order
//                     let index = 0;
//                     for (let i = 0; i < path.node.elements.length; i++) {
//                         if (path.node.elements[i].value > moduleName) {
//                             index = i;
//                             break;
//                         }
//                     }
//                     path.node.elements.splice(index, 0, module);
//                 }
//             });

//             if (!requiredModules.has('ValidationModule') && !hasAllCommunityModule) {
//                 // add ValidationModule /** Development Only */
//                 // including the comment
//                 const comment = j.commentBlock(' Development Only ', false, true);
//                 const validationModule = j.identifier('ValidationModule');
//                 validationModule.comments = [comment];
//                 path.node.elements.push(validationModule);
//             }
//         });

//     // requiredModules.forEach((moduleName) => {
//     //     addNewImportNextToGiven(root, 'AllCommunityModule', moduleName);
//     // });

//     toAdd.forEach((moduleName) => {
//         addNewImportNextToGiven(root, 'ModuleRegistry', moduleName);
//     });

//     // Replace the import to AllCommunityModule with the required modules
//     // root.find(j.ImportDeclaration, { source: { value: 'ag-grid-community' } })
//     //     .find(j.ImportSpecifier, { imported: { name: 'AllCommunityModule' } })
//     //     .remove();

//     sortAndCombineImports(root, j);

//     return root.toSource();
// }

// function findString(root, j, value: string) {
//     return root.find(j.StringLiteral, { value }).size() > 0;
// }
// function findIdentifier(root, j, value: string) {
//     return root.find(j.Identifier, { name: value }).size() > 0;
// }
// // function findProperty(root, j, value: string) {
// //     return root.find(j.Identifier, { name: value }).size() > 0;
// // }

// function sortAndCombineImports(root, j) {
//     const importDeclarations = root.find(j.ImportDeclaration);

//     // Separate type imports from regular imports
//     // const typeImports = importDeclarations.filter((path) => path.node.importKind === 'type');
//     const regularImports = importDeclarations; //.filter((path) => path.node.importKind !== 'type');

//     // do nothing if only one import for each path
//     let countAgGridCommunity = 0;
//     let countAgGridEnterprise = 0;
//     regularImports.forEach((path) => {
//         if (path.node.source.value === 'ag-grid-community') {
//             countAgGridCommunity++;
//         } else if (path.node.source.value === 'ag-grid-enterprise') {
//             countAgGridEnterprise++;
//         }
//     });

//     if (countAgGridCommunity === 1 && countAgGridEnterprise === 1) {
//         return;
//     }

//     // Sort the import declarations alphabetically by source value
//     const sortImports = (imports) =>
//         imports.nodes().sort((a, b) => {
//             // imports that start with ./ should be last
//             if (a.source.value.startsWith('./') && !b.source.value.startsWith('./')) return 1;

//             // imports that start with react should be first
//             if (a.source.value.startsWith('react') && !b.source.value.startsWith('react')) return -1;

//             const sourceA = a.source.value.toString().toLowerCase();
//             const sourceB = b.source.value.toString().toLowerCase();
//             if (sourceA < sourceB) return -1;
//             if (sourceA > sourceB) return 1;

//             // type imports first
//             if (a.importKind === 'type' && b.importKind !== 'type') return -1;

//             return 0;
//         });

//     // const sortedTypeImports = sortImports(typeImports);
//     const sortedRegularImports = sortImports(regularImports);

//     // Combine duplicate imports
//     const combineImports = (imports) =>
//         imports.reduce((acc, importDecl) => {
//             const existingImport = acc.find(
//                 (imp) => imp.source.value === importDecl.source.value && imp.importKind === importDecl.importKind
//             );
//             if (existingImport) {
//                 // Combine specifiers
//                 importDecl.specifiers.forEach((specifier) => {
//                     if (!existingImport.specifiers.some((s) => s.local.name === specifier.local.name)) {
//                         existingImport.specifiers.push(specifier);
//                     }
//                 });
//             } else {
//                 acc.push(importDecl);
//             }
//             return acc;
//         }, []);

//     const combinedRegularImports = combineImports(sortedRegularImports);

//     // Sort the specifiers within each import declaration
//     combinedRegularImports.forEach((importDecl) => {
//         importDecl.specifiers.sort((a, b) => {
//             const specifierA = a?.local?.name?.toString();
//             const specifierB = b?.local?.name?.toString();
//             if (specifierA < specifierB) return -1;
//             if (specifierA > specifierB) return 1;
//             return 0;
//         });
//     });

//     // Replace the existing import declarations with the sorted and combined ones
//     // importDeclarations.remove();
//     // root.get().node.program.body.unshift(...combinedRegularImports);
// }

// export const USER_COMP_MODULES = {
//     agSetColumnFilter: 'SetFilterModule',
//     agSetColumnFloatingFilter: 'SetFilterModule',
//     agMultiColumnFilter: 'MultiFilterModule',
//     agMultiColumnFloatingFilter: 'MultiFilterModule',
//     agGroupColumnFilter: 'GroupFilterModule',
//     agGroupColumnFloatingFilter: 'GroupFilterModule',
//     agGroupCellRenderer: 'GroupCellRendererModule',
//     agGroupRowRenderer: 'GroupCellRendererModule',
//     agRichSelect: 'RichSelectModule',
//     agRichSelectCellEditor: 'RichSelectModule',
//     agDetailCellRenderer: 'SharedMasterDetailModule',
//     agSparklineCellRenderer: 'SparklinesModule',
//     agDragAndDropImage: 'SharedDragAndDropModule',
//     agColumnHeader: 'ColumnHeaderCompModule',
//     agColumnGroupHeader: 'ColumnGroupHeaderCompModule',
//     agSortIndicator: 'SortModule',
//     agAnimateShowChangeCellRenderer: 'HighlightChangesModule',
//     agAnimateSlideCellRenderer: 'HighlightChangesModule',
//     agLoadingCellRenderer: 'LoadingCellRendererModule',
//     agSkeletonCellRenderer: 'SkeletonCellRendererModule',
//     agCheckboxCellRenderer: 'CheckboxCellRendererModule',
//     agLoadingOverlay: 'OverlayModule',
//     agNoRowsOverlay: 'OverlayModule',
//     agTooltipComponent: 'TooltipModule',
//     agReadOnlyFloatingFilter: 'CustomFilterModule',
//     agTextColumnFilter: 'TextFilterModule',
//     agNumberColumnFilter: 'NumberFilterModule',
//     agDateColumnFilter: 'DateFilterModule',
//     agDateInput: 'DateFilterModule',
//     agTextColumnFloatingFilter: 'TextFilterModule',
//     agNumberColumnFloatingFilter: 'NumberFilterModule',
//     agDateColumnFloatingFilter: 'DateFilterModule',
//     agCellEditor: 'TextEditorModule',
//     agSelectCellEditor: 'SelectEditorModule',
//     agTextCellEditor: 'TextEditorModule',
//     agNumberCellEditor: 'NumberEditorModule',
//     agDateCellEditor: 'DateEditorModule',
//     agDateStringCellEditor: 'DateEditorModule',
//     agCheckboxCellEditor: 'CheckboxEditorModule',
//     agLargeTextCellEditor: 'LargeTextEditorModule',
//     agMenuItem: 'MenuItemModule',
//     agColumnsToolPanel: 'ColumnsToolPanelModule',
//     agFiltersToolPanel: 'FiltersToolPanelModule',
//     agAggregationComponent: 'StatusBarModule',
//     agSelectedRowCountComponent: 'StatusBarModule',
//     agTotalRowCountComponent: 'StatusBarModule',
//     agFilteredRowCountComponent: 'StatusBarModule',
//     agTotalAndFilteredRowCountComponent: 'StatusBarModule',
// };

// // npx prettier -c ./src/content/docs/cell-editors/ --config /Users/stephencooper/Workspace/latest/.prettierrc --write;

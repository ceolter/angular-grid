import { transform } from 'sucrase';
import ts from 'typescript';

import type { BindingImport, ExampleConfig, InternalFramework, ParsedBindings } from '../types';

export function readAsJsFile(srcFile, internalFramework: InternalFramework) {
    let tsFile = srcFile
        // Remove imports like import 'ag-grid-community/styles/ag-grid.css';
        .replace(/import ['"].*['"](;?)\n/g, '');

    // Remove imports that are not required in javascript
    if (internalFramework !== 'vanilla') {
        // We leave in the relative imports as they are required for the example to work
        // e.g import { colors } from './colors'; for non Vanilla examples
        tsFile = tsFile.replace(/import {((.|\n)*?)} from(?!(\s['"]\.\/)).*\n/g, '');
    } else {
        tsFile = tsFile.replace(/import ((.|\n)*?)from.*\n/g, '');
        tsFile = tsFile.replace(/export /g, '');
    }

    const jsFile = transform(tsFile, { transforms: ['typescript'], disableESTransforms: true }).code;
    return jsFile;
}

export function parseFile(src) {
    return ts.createSourceFile('tempFile.ts', src, ts.ScriptTarget.Latest, true);
}

// export interface PrinterOptions {
//     removeComments?: boolean;
//     newLine?: NewLineKind;
//     omitTrailingSemicolon?: boolean;
//     noEmitHelpers?: boolean;
// }
const printer = ts.createPrinter({
    removeComments: false,
    omitTrailingSemicolon: false,
});

export function tsGenerate(node, srcFile) {
    try {
        if (!node) {
            return '';
        }
        return printer.printNode(ts.EmitHint.Unspecified, node, srcFile);
    } catch (error) {
        console.error(error);
    }
    return 'ERROR - Printing';
}

export function removeFunctionKeyword(code: string): string {
    return code.replace(/^function /, '').replace(/\n\s?function /, '\n ');
}

export function getFunctionName(code: string): string {
    const matches = /function\s+([^(\s]+)\(/.exec(code);
    return matches && matches.length === 2 ? matches[1].trim() : null;
}

export const convertFunctionToProperty = (code: string) =>
    code.replace(/function\s+([^(\s]+)\s*\(([^)]*)\)/, '$1 = ($2) =>');

export const convertFunctionToConstProperty = (code: string) =>
    code.replace(/function\s+([^(\s]+)\s*\(([^)]*)\)/, 'const $1 = ($2) =>');
export const convertFunctionToConstPropertyTs = (code: string) => {
    return code.replace(/function\s+([^(\s]+)\s*\(([^)]*)\):(\s+[^{]*)/, 'const $1: ($2) => $3 = ($2) =>');
};

export function isInstanceMethod(methods: string[], property: any): boolean {
    return methods.map(getFunctionName).filter((name) => name === property.name).length > 0;
}

export const enum NodeType {
    Variable = 'VariableDeclaration',
    Function = 'FunctionDeclaration',
    Expression = 'ExpressionStatement',
}

export function tsCollect(tsTree, tsBindings: ParsedBindings, collectors, recurse = true): ParsedBindings {
    ts.forEachChild(tsTree, (node: ts.Node) => {
        collectors
            .filter((c) => {
                let res = false;
                try {
                    res = c.matches(node);
                } catch (error) {
                    return false;
                }
                return res;
            })
            .forEach((c) => {
                try {
                    c.apply(tsBindings, node);
                } catch (error) {
                    console.error(error);
                }
            });
        if (recurse) {
            tsCollect(node, tsBindings, collectors, recurse);
        }
    });
    return tsBindings;
}

export function tsNodeIsGlobalVarWithName(node: any, name: string): boolean {
    // eg: var currentRowHeight = 10;
    if (ts.isVariableDeclaration(node) && ts.isSourceFile(node.parent.parent.parent)) {
        return node.name.getText() === name;
    }
    return false;
}

export function tsNodeIsPropertyWithName(node: ts.Node, name: string) {
    if (ts.isPropertyAssignment(node)) {
        if (node.name.getText() === name) {
            // If the name matches the initializer then the property will get added via
            // the top level variable matching a gridProperty name
            // This means that we include cellRenderer properties like
            // detailCellRenderer: DetailCellRenderer,
            if (node.name.getText() === node.initializer.getText()) {
                return false;
            }
            return true;
        }
    }
}

export function tsNodeIsTopLevelVariable(node: ts.Node, registered: string[] = []) {
    if (ts.isVariableDeclarationList(node)) {
        // Not registered already
        // are a top level variable declaration so that we do not match variables within function scopes
        // Is not just a type declaration i.e declare function getData: () => any[];
        if (node.declarations.length > 0) {
            const declaration = node.declarations[0];
            return (
                !isDeclareStatement(node.parent) &&
                registered.indexOf(declaration.name.getText()) < 0 &&
                ts.isSourceFile(node.parent.parent)
            );
        }
    }
}

export function tsNodeIsFunctionWithName(node: ts.Node, name: string): boolean {
    // eg: function someFunction() { }
    if (ts.isFunctionDeclaration(node)) {
        const isMatch = node?.name?.getText() === name;
        return isMatch;
    }
    return false;
}

export function tsNodeIsUnusedFunction(node: any, used: string[]): boolean {
    if (ts.isFunctionDeclaration(node) && !!node.name) {
        if (ts.isFunctionLike(node) && used.indexOf(node.name.getText()) < 0) {
            const isTopLevel = ts.isSourceFile(node.parent);
            return isTopLevel && !isDeclareStatement(node);
        }
    }
    return false;
}

function isDeclareStatement(node) {
    return node && node.modifiers && node.modifiers.some((m) => m.getText() === 'declare');
}

export function tsNodeIsTypeDeclaration(node: any): boolean {
    if (ts.isFunctionDeclaration(node) || ts.isVariableStatement(node)) {
        return isDeclareStatement(node);
    }
    return false;
}

export function tsNodeIsFunctionCall(node: any): boolean {
    return ts.isCallExpression(node);
}

export const recognizedDomEvents = ['click', 'change', 'input', 'dragover', 'dragstart', 'drop'];

function flatMap<T>(array: T[], callback: (value: T) => T): T[] {
    return Array.prototype.concat.apply([], array.map(callback));
}

const extractEventHandlerBody = (code: string) => code.match(/^(\w+)\((.*)\)/);

/*
 * for each of the recognised events (click, change etc) extract the corresponding event handler, with (optional) params
 * eg: onclick="refreshEvenRowsCurrencyData()"
 */
export function extractEventHandlers(domTree: any, eventNames: string[]) {
    const getHandlerAttributes = (event: string) => {
        const handlerName = `on${event}`;

        return domTree(`[${handlerName}]`).map((index, el) => {
            return domTree(el).attr(handlerName);
        });
    };

    return flatMap(eventNames, (event: string) => {
        const result = getHandlerAttributes(event)
            .map((index, el) => {
                return [extractEventHandlerBody(el)];
            })
            .toArray();

        return result;
    });
}

export function extractImportStatements(srcFile: ts.SourceFile): BindingImport[] {
    const allImports = [];
    srcFile.statements.forEach((node) => {
        if (ts.isImportDeclaration(node)) {
            const module = node.moduleSpecifier.getText();
            const moduleImports = node.importClause;
            const imports = [];
            let namedImport = undefined;
            let isNamespaced = true;

            if (moduleImports?.namedBindings) {
                if (!ts.isNamespaceImport(moduleImports.namedBindings)) {
                    isNamespaced = false;
                }
                moduleImports.namedBindings.forEachChild((o) => {
                    imports.push(o.getText());
                });
            }
            if (moduleImports?.name) {
                namedImport = moduleImports.name.getText();
                isNamespaced = false;
            }
            allImports.push({
                module,
                isNamespaced,
                namedImport,
                imports,
            });
        }
    });
    return allImports;
}

export function addLicenseManager(imports: any[], exampleConfig: ExampleConfig) {
    if (exampleConfig.licenseKey) {
        imports.push(`import { LicenseManager } from 'ag-grid-enterprise';`);
    }
}

export function addEnterprisePackage(imports: any[], bindings: ParsedBindings) {
    const isEnterprise = bindings.imports.some((i) => i.module.includes('-enterprise'));
    if (isEnterprise) {
        imports.push(`import 'ag-grid-enterprise';`);
    }
}

export function extractModuleRegistration(srcFile: ts.SourceFile): string {
    for (const statement of srcFile.statements) {
        if (
            ts.isExpressionStatement(statement) &&
            statement.expression?.getText().includes('ModuleRegistry.registerModules')
        ) {
            return statement.getText();
        }
    }
    return undefined;
}

export function extractTypeDeclarations(srcFile: ts.SourceFile) {
    const allDeclareStatements = [];
    srcFile.statements.forEach((node) => {
        if ((ts.isVariableStatement(node) || ts.isFunctionDeclaration(node)) && node.modifiers?.length > 0) {
            if (node.modifiers.some((s) => s.kind === ts.SyntaxKind.DeclareKeyword)) {
                allDeclareStatements.push(node.getText());
            }
        }
    });
    return allDeclareStatements;
}

export function extractClassDeclarations(srcFile: ts.SourceFile) {
    const allClasses = [];
    srcFile.statements.forEach((node) => {
        if (ts.isClassDeclaration(node)) {
            allClasses.push(node.getText());
        }
    });
    return allClasses;
}

export function extractInterfaces(srcFile: ts.SourceFile) {
    const allInterfaces = [];
    srcFile.statements.forEach((node) => {
        if (ts.isInterfaceDeclaration(node)) {
            allInterfaces.push(node.getText());
        }
    });
    return allInterfaces;
}

export function tsNodeIsTopLevelFunction(node: any): boolean {
    if (ts.isFunctionLike(node)) {
        const isTopLevel = ts.isSourceFile(node.parent);
        return isTopLevel;
    }
    return false;
}

/**
 * Find all the variables defined in this node tree recursively
 */
export function findAllVariables(node) {
    let allVariables = [];
    if (ts.isClassDeclaration(node)) {
        allVariables.push(node.name.getText());
    }
    if (ts.isVariableDeclaration(node)) {
        if (ts.isObjectBindingPattern(node.name)) {
            // Code like this:  const { pageSetup, margins } = getSheetConfig();
            node.name.elements.forEach((n) => allVariables.push(n.getText()));
        } else {
            allVariables.push(node.name.getText());
        }
    }
    if (ts.isFunctionDeclaration(node)) {
        // catch locally defined functions within the main function body
        // function setMessage(msg: string) { ... }
        allVariables.push(node.name.getText());
    }
    if (ts.isParameter(node)) {
        // catch locally defined arrow functions with their params
        //  const colToNameFunc = (col: Column, index: number) => index + ' = ' + col.getId()
        //  const colNames = cols.map(colToNameFunc).join(', ')

        allVariables.push(node.name.getText());
    }
    ts.forEachChild(node, (n) => {
        const variables = findAllVariables(n);
        if (variables.length > 0) {
            allVariables = [...allVariables, ...variables];
        }
    });
    return allVariables;
}

function getLowestExpression(exp: any) {
    let hasExpression = true;
    while (hasExpression) {
        hasExpression = exp.expression;
        if (hasExpression) {
            exp = exp.expression as any;
        }
    }
    return exp;
}

/**
 * Find all the properties accessed in this node.
 */
export function findAllAccessedProperties(node) {
    let properties = [];
    if (ts.isIdentifier(node)) {
        const property = node.getText();
        if (property !== 'undefined' && property !== 'null') {
            properties.push(node.getText());
        }
    } else if (ts.isCallExpression(node) || ts.isPropertyAccessExpression(node)) {
        // When there are chained accesses we need to recurse to the lowest identifier as this is the first in the statement,
        // and will be the true accessed variable.
        // i.e gridOptions.api!.getModel().getRowCount() we need to recurse down the tree to extract gridOptions
        const exp = getLowestExpression(node.expression);

        if (ts.isArrayLiteralExpression(exp)) {
            // Check if the array has any properties in it that are dependencies
            properties = [...properties, ...findAllAccessedProperties(exp)];
        } else {
            properties.push(exp.getText());
        }
        if (ts.isCallExpression(node) && node.arguments) {
            // Check arguments
            properties = [...properties, ...findAllAccessedProperties(node.arguments)];
        }
    } else if (ts.isBinaryExpression(node)) {
        // In this function we set swimmingHeight but are not dependent on it,
        // so for binary expressions we only check the right hand branch
        // function setSwimmingHeight(height: number) {
        //      swimmingHeight = height
        //      gridOptions.api!.resetRowHeights()
        // }
        const rightProps = findAllAccessedProperties(node.right);
        if (rightProps.length > 0) {
            properties = [...properties, ...rightProps];
        }
    } else if (ts.isVariableDeclaration(node)) {
        // get lowest identifier as this is the first in the statement
        // i.e var nextHeader = params.nextHeaderPosition
        // we need to recurse down the initializer tree to extract params and not nextHeaderPosition
        const init = node.initializer as any;
        if (init) {
            const exp = getLowestExpression(init);
            properties = [...properties, ...findAllAccessedProperties(exp)];
        }
    } else if (ts.isPropertyAssignment(node)) {
        // Ignore the name of rowIndex just check what is being assigned
        //  {
        //      rowIndex: nextRowIndex,
        //  }
        if (node.initializer) {
            properties = [...properties, ...findAllAccessedProperties(node.initializer)];
        }
    } else if (ts.isExpressionStatement(node)) {
        if (node.expression) {
            properties = [...properties, ...findAllAccessedProperties(node.expression)];
        }
    } else if (ts.isClassDeclaration(node)) {
        // Do nothing for Class declarations as this is likely a cell renderer setup
    } else if (ts.isTypeReferenceNode(node)) {
        // Do nothing for Type references
    } else if (node instanceof Array) {
        node.forEach((element) => {
            properties = [...properties, ...findAllAccessedProperties(element)];
        });
    } else {
        // Recurse down the tree looking for more accessed properties
        ts.forEachChild(node, (n) => {
            const props = findAllAccessedProperties(n);
            if (props.length > 0) {
                properties = [...properties, ...props];
            }
        });
    }

    return properties;
}

export function stripTypescriptSuffix(modulePackage: string) {
    return modulePackage.replace('_typescript', '').replace(/"/g, `'`);
}

export function getImport(filename: string) {
    const componentFileName = filename.split('.')[0];
    const componentName = componentFileName[0].toUpperCase() + componentFileName.slice(1);
    return `import { ${componentName} } from './${componentFileName}';`;
}

export function getPropertyInterfaces(properties) {
    let propTypesUsed = [];
    properties.forEach((prop) => {
        if (prop.typings?.typesToInclude?.length > 0) {
            propTypesUsed = [...propTypesUsed, ...prop.typings.typesToInclude];
        }
    });
    return [...new Set(propTypesUsed)];
}

/**
 *  Add the imports from the parsed file
 * We ignore any component files as those imports are generated for each framework.
 */
export function addBindingImports(bindingImports: any, imports: string[], ignoreTsImports: boolean) {
    const workingImports = {};
    const namespacedImports = [];

    bindingImports
        .filter((i: BindingImport) => {
            return !i.module.includes('@ag-grid-community/locale');
        })
        .forEach((i: BindingImport) => {
            const path = stripTypescriptSuffix(i.module);
            if (!i.module.includes('_typescript') || !ignoreTsImports) {
                workingImports[path] = workingImports[path] || {
                    namedImport: undefined,
                    imports: [],
                };
                if (i.isNamespaced) {
                    if (i.imports.length > 0) {
                        namespacedImports.push(`import * as ${i.imports[0]} from ${path};`);
                    } else {
                        namespacedImports.push(`import ${path};`);
                    }
                } else {
                    if (i.namedImport) {
                        workingImports[path] = {
                            ...workingImports[path],
                            namedImport: i.namedImport,
                        };
                    }
                    if (i.imports) {
                        workingImports[path] = {
                            ...workingImports[path],
                            imports: [...workingImports[path].imports, ...i.imports],
                        };
                    }
                }
            }
        });

    [...new Set(namespacedImports)].forEach((ni) => imports.push(ni));

    let hasEnterpriseModules = false;
    Object.entries(workingImports).forEach(([k, v]: [string, { namedImport: string; imports: string[] }]) => {
        const unique = [...new Set([...v.imports])].sort();

        if (k.includes('ag-grid')) {
            // Remove module related imports
            // unique = unique.filter((i) => !i.includes('Module') || i == 'AgGridModule');
            hasEnterpriseModules = hasEnterpriseModules || k.includes('enterprise');
        }

        if (unique.length > 0 || v.namedImport) {
            const namedImport = v.namedImport ? v.namedImport : '';
            const importStr = unique.length > 0 ? `{ ${unique.join(', ')} }` : '';
            const joiningComma = namedImport && importStr ? ', ' : '';
            const fullImportStr = `import ${namedImport}${joiningComma}${importStr} from ${k};`;
            imports.push(fullImportStr);
        }
    });
}

/** Add imports such as "import { colors } from './colors.js';"
 * Does not include the imports for framework component
 */
export function addRelativeImports(bindings: ParsedBindings, imports: string[], extension: string) {
    const filterOtherFiles = (b) => b.module.includes('./') && !b.module.includes('_');
    const bImports = [...(bindings.imports.filter((b) => filterOtherFiles(b)) || [])];
    if (bImports.length > 0) {
        bImports.forEach((b) => {
            imports.push(
                `import { ${b.imports.join(', ')} } from '${b.module.replace(/['"]/g, '')}${extension ? `.${extension}` : ''}';`
            );
        });
    }
}

export function removeModuleRegistration(code: string) {
    return code.replace(/\b(agGrid\.)?ModuleRegistry\.registerModules(.|\n)*?]\)(;?)/g, '');
}

export function handleRowGenericInterface(fileTxt: string, tData: string): string {
    if (tData) {
        fileTxt = fileTxt
            .replace(
                /<(TData|TValue|TContext|any)?(, )?(TData|TValue|TContext|any)?(, )?(TData|TValue|TContext|any)?>/g,
                ''
            )
            .replace(/TData\[\]/g, `${tData}[]`);
    } else {
        fileTxt = fileTxt.replace(/<TData>/g, '').replace(/TData\[\]/g, 'any[]');
    }
    return fileTxt;
}

export function addGenericInterfaceImport(imports: string[], tData: string, bindings) {
    if (tData && !bindings.interfaces.some((i) => i.includes(tData)) && !imports.some((i) => i.includes(tData))) {
        imports.push(`import { ${tData} } from './interfaces'`);
    }
}

export function replaceGridReadyRowData(callback: string, rowDataSetter: string) {
    return (
        callback
            // replace gridApi.setGridOption('rowData', data) with this.rowData = data
            .replace(/gridApi(!?)\.setGridOption\('rowData', data\)/, `${rowDataSetter} = data`)
            // replace gridApi.setGridOption('rowData', data.map(...)) with this.rowData = data.map(...)
            .replace(/gridApi(!?)\.setGridOption\('rowData', data/, `${rowDataSetter} = (data`)
    );
}

export function preferParamsApi(code: string): string {
    // use params.api instead of gridApi.api when we have access to the params object
    return code.replace(/([\s(!])gridApi(\W)/g, '$1params.api$2');
}

export function getInterfaceFileContents(tsBindings: ParsedBindings, currentFile) {
    const interfaces = [];
    // If the example has an existing interface file then merge that with our globally shared interfaces
    if (currentFile) {
        interfaces.push(currentFile);
    }
    if (tsBindings.tData && !interfaces.some((i) => i?.includes(tsBindings.tData))) {
        interfaces.push(getGenericInterface(tsBindings.tData));
    }
    if (interfaces.length > 0) {
        return interfaces.join('\n');
    }
    return undefined;
}

export function findLocaleImport(bindingImports) {
    return bindingImports.find((bindingImport) => bindingImport.module.includes('@ag-grid-community/locale'));
}

function getGenericInterface(tData) {
    let interfaceStr = '';
    switch (tData) {
        case 'IOlympicDataWithId':
            interfaceStr = `
export interface IOlympicDataWithId extends IOlympicData {
    id: number;
}
`; // purposefully fall through to IOlympicData
        case 'IOlympicData':
            interfaceStr =
                interfaceStr +
                `
export interface IOlympicData {
    athlete: string,
    age: number,
    country: string,
    year: number,
    date: string,
    sport: string,
    gold: number,
    silver: number,
    bronze: number,
    total: number
}`;
            break;
        case 'IAccount':
            interfaceStr =
                interfaceStr +
                `
export interface ICallRecord {
    name: string;
    callId: number;
    duration: number;
    switchCode: string;
    direction: string;
    number: string;
}

export interface IAccount {
    name: string;
    account: number;
    calls: number;
    minutes: number;
    callRecords: ICallRecord[];
}`;
            break;
    }

    return interfaceStr;
}

export const DARK_INTEGRATED_START = '/** DARK INTEGRATED START **/';
export const DARK_INTEGRATED_END = '/** DARK INTEGRATED END **/';

// TODO detecting "enableCharts" in the example source would do this more reliably (or also "sparklineOptions")
const chartsExamplePathSubstrings = [
    '/integrated-charts-',
    '/sparklines-',
    '/custom-icons/examples/icons-images',
    '/modules/examples/individual-registration',
    '/localisation/examples/callback',
    '/localisation/examples/localisation',
];

export function getIntegratedDarkModeCode(
    exampleName: string,
    typescript?: boolean,
    apiName = 'params.api'
): string | undefined {
    if (!chartsExamplePathSubstrings.find((s) => exampleName.includes(s))) {
        return undefined;
    }
    return `${DARK_INTEGRATED_START}${(typescript ? darkModeTs : darkModeJS).replace(/params\.api/g, apiName)}${DARK_INTEGRATED_END}`;
}

const darkModeTs = `
        const isInitialModeDark = document.documentElement.dataset.agThemeMode?.includes("dark");
                  
        // update chart themes based on dark mode status
        const updateChartThemes = (isDark: boolean): void => {
            const themes: string[] = ['ag-default', 'ag-material', 'ag-sheets', 'ag-polychroma', 'ag-vivid'];            
            const currentThemes = params.api.getGridOption('chartThemes');    
            const customTheme = currentThemes && currentThemes.some(theme => theme.startsWith('my-custom-theme'));
            
            let modifiedThemes: string[] = customTheme
                ? (isDark ? ['my-custom-theme-dark', 'my-custom-theme-light'] : ['my-custom-theme-light', 'my-custom-theme-dark'])
                : Array.from(new Set(themes.map((theme) => theme + (isDark ? '-dark' : ''))));                      

            // updating the 'chartThemes' grid option will cause the chart to reactively update!
            params.api.setGridOption('chartThemes', modifiedThemes);
        };
        
        // update chart themes when example first loads
        let initialSet = false;
        const maxTries = 5;
        let tries = 0;
        const trySetInitial = (delay) => {
            if(params.api){
                initialSet = true;
                updateChartThemes(isInitialModeDark);
            }else{
                if(tries < maxTries){
                    setTimeout(() => trySetInitial(), 250);
                    tries++;
                }   
            }
        }
        trySetInitial(0);
                      
        interface ColorSchemeChangeEventDetail {
            darkMode: boolean;
        }
        
        // event handler for color scheme changes
        const handleColorSchemeChange = (event: CustomEvent<ColorSchemeChangeEventDetail>): void => {
            const { darkMode } = event.detail;
            updateChartThemes(darkMode);
        }
        
        // listen for user-triggered dark mode changes (not removing listener is fine here!)
        document.addEventListener('color-scheme-change', handleColorSchemeChange as EventListener);                
    `;

const darkModeJS = `
        const isInitialModeDark = document.documentElement.dataset.agThemeMode?.includes("dark");
      
        const updateChartThemes = (isDark) => { 
            const themes = ['ag-default', 'ag-material', 'ag-sheets', 'ag-polychroma', 'ag-vivid'];            
            const currentThemes = params.api.getGridOption('chartThemes');                    
            const customTheme = currentThemes && currentThemes.some(theme => theme.startsWith('my-custom-theme'));
            
            let modifiedThemes = customTheme
                ? (isDark ? ['my-custom-theme-dark', 'my-custom-theme-light'] : ['my-custom-theme-light', 'my-custom-theme-dark'])
                : Array.from(new Set(themes.map((theme) => theme + (isDark ? '-dark' : ''))));                      

            // updating the 'chartThemes' grid option will cause the chart to reactively update!
            params.api.setGridOption('chartThemes', modifiedThemes);
        };

        // update chart themes when example first loads
        let initialSet = false;
        const maxTries = 5;
        let tries = 0;
        const trySetInitial = (delay) => {
            if(params.api){
                initialSet = true;
                updateChartThemes(isInitialModeDark);
            }else{
                if(tries < maxTries){
                    setTimeout(() => trySetInitial(), 250);
                    tries++;
                }   
            }
        }
        trySetInitial(0);

        const handleColorSchemeChange = (event) => {
            const { darkMode } = event.detail;
            updateChartThemes(darkMode);
        }

        // listen for user-triggered dark mode changes (not removing listener is fine here!)
        document.addEventListener('color-scheme-change', handleColorSchemeChange);
    `;

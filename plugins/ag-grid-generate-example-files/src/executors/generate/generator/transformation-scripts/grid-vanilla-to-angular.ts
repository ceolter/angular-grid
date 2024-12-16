import type { ExampleConfig, ParsedBindings } from '../types';
import { convertTemplate, getImport, toConst, toInput, toMemberWithValue, toOutput } from './angular-utils';
import { templatePlaceholder } from './grid-vanilla-src-parser';
import {
    DARK_INTEGRATED_END,
    DARK_INTEGRATED_START,
    addBindingImports,
    addGenericInterfaceImport,
    addLicenseManager,
    convertFunctionToPropertyTs,
    findLocaleImport,
    getIntegratedDarkModeCode,
    getPropertyInterfaces,
    handleRowGenericInterface,
    isInstanceMethod,
    preferParamsApi,
    removeFunctionKeyword,
    replaceGridReadyRowData,
} from './parser-utils';
import { toTitleCase } from './string-utils';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');

function getOnGridReadyCode(
    readyCode: string,
    data: { url: string; callback: string },
    rowDataType: string | undefined,
    hasApi: boolean,
    exampleName: string
): string {
    const additionalLines = [];

    if (readyCode) {
        additionalLines.push(readyCode.trim().replace(/^\{|\}$/g, ''));
    }

    if (data) {
        const { url, callback } = data;
        const setRowDataBlock = replaceGridReadyRowData(callback, 'this.rowData');
        additionalLines.push(`this.http.get<${rowDataType}[]>(${url}).subscribe(data => ${setRowDataBlock});`);
    }
    const gridReadyEventParam = rowDataType !== 'any' ? `<${rowDataType}>` : '';
    if (hasApi || additionalLines.length > 0) {
        // use params in gridReady event
        const additional = preferParamsApi(
            additionalLines.length > 0 ? `\n\n        ${additionalLines.join('\n        ')}` : ''
        );
        return `
        onGridReady(params: GridReadyEvent${gridReadyEventParam}) {
            ${getIntegratedDarkModeCode(exampleName, true)} 
            ${hasApi ? 'this.gridApi = params.api;' : ''}${additional}
        }`;
    } else {
        return '';
    }
}

function addModuleImports(
    imports: string[],
    bindings: ParsedBindings,
    exampleConfig: ExampleConfig,
    allStylesheets: string[]
): string[] {
    const { imports: bindingImports, properties } = bindings;

    imports.push("import { AgGridAngular } from 'ag-grid-angular';");

    if (allStylesheets && allStylesheets.length > 0) {
        allStylesheets.forEach((styleSheet) => imports.push(`import './${path.basename(styleSheet)}';`));
    }

    const propertyInterfaces = getPropertyInterfaces(properties);
    const bImports = [...(bindingImports || [])];
    bImports.push({
        module: `'ag-grid-community'`,
        isNamespaced: false,
        imports: [...propertyInterfaces, 'GridReadyEvent', 'GridApi'],
    });

    addLicenseManager(imports, exampleConfig);

    if (bImports.length > 0) {
        addBindingImports(bImports, imports, true);
    }

    if (bindings.moduleRegistration) {
        imports.push(bindings.moduleRegistration);
    }

    return imports;
}

function getImports(
    bindings: ParsedBindings,
    exampleConfig: ExampleConfig,
    componentFileNames: string[],
    allStylesheets: string[]
): string[] {
    const imports = ["import { Component } from '@angular/core';"];

    if (bindings.data) {
        imports.push("import { HttpClient, HttpClientModule } from '@angular/common/http';");
    }

    const localeImport = findLocaleImport(bindings.imports);
    if (localeImport) {
        imports.push(`import { ${localeImport.imports[0]} } from '@ag-grid-community/locale';`);
    }

    addModuleImports(imports, bindings, exampleConfig, allStylesheets);

    if (componentFileNames) {
        imports.push(...componentFileNames.map(getImport));
    }

    addGenericInterfaceImport(imports, bindings.tData, bindings);

    return imports;
}

function getTemplate(bindings: ParsedBindings, exampleConfig: ExampleConfig, attributes: string[]): string {
    const { inlineGridStyles } = bindings;
    const style = exampleConfig.noStyle
        ? ''
        : `style="width: ${inlineGridStyles.width}; height: ${inlineGridStyles.height};"`;

    const className = inlineGridStyles.className ? `class="${inlineGridStyles.className}"` : '';

    const agGridTag = `<ag-grid-angular
    ${exampleConfig.myGridReference ? 'id="myGrid"' : ''}
    ${style}
    ${className}
    ${attributes.join('\n    ')}
     />`;

    const template = bindings.template ? bindings.template.replace(templatePlaceholder, agGridTag) : agGridTag;

    return convertTemplate(template);
}

export function vanillaToAngular(
    bindings: ParsedBindings,
    exampleConfig: ExampleConfig,
    componentFileNames: string[],
    allStylesheets: string[]
): () => string {
    const { data, properties, typeDeclares, interfaces, tData } = bindings;
    const rowDataType = tData || 'any';
    const diParams = [];

    if (data) {
        diParams.push('private http: HttpClient');
    }

    const instanceMethods = bindings.instanceMethods.map(convertFunctionToPropertyTs);

    const eventHandlers = bindings.eventHandlers.map((event) => event.handler).map(removeFunctionKeyword);
    const externalEventHandlers = bindings.externalEventHandlers.map((handler) => removeFunctionKeyword(handler.body));
    const genericParams = rowDataType !== 'any' ? `<${rowDataType}>` : '';

    return () => {
        const imports = getImports(bindings, exampleConfig, componentFileNames, allStylesheets);
        const propertyAttributes = [];
        const propertyAssignments = [];

        properties
            .filter((property) => property.name !== 'onGridReady')
            .forEach((property) => {
                if (property.value === 'true' || property.value === 'false') {
                    propertyAttributes.push(toConst(property));
                } else if (property.value === null || property.value === 'null') {
                    propertyAttributes.push(toInput(property));
                } else {
                    // for when binding a method
                    // see javascript-grid-keyboard-navigation for an example
                    // tabToNextCell needs to be bound to the angular component
                    if (!isInstanceMethod(bindings.instanceMethods, property)) {
                        propertyAttributes.push(toInput(property));
                    }

                    propertyAssignments.push(toMemberWithValue(property));
                }
            });

        if (!propertyAttributes.find((item) => item.indexOf('[rowData]') >= 0)) {
            propertyAttributes.push('[rowData]="rowData"');
        }

        if (!propertyAssignments.find((item) => item.indexOf('rowData') >= 0)) {
            propertyAssignments.push(`public rowData!: ${rowDataType}[];`);
        }

        const componentForCheckBody = eventHandlers
            .concat(externalEventHandlers)
            .concat(instanceMethods)
            .map((snippet) => snippet.trim())
            .join('\n\n');

        const hasGridApi = componentForCheckBody.includes('gridApi');
        const gridReadyCode = getOnGridReadyCode(
            bindings.onGridReady,
            data,
            rowDataType,
            hasGridApi,
            bindings.exampleName
        );
        const additional = [];
        let darkModeWithGridRef = undefined;
        if (gridReadyCode) {
            additional.push(gridReadyCode);
        } else {
            if (bindings.exampleName.includes('sparklines')) {
                // TEMPORARY ONLY APPLY TO SPARKLINES EXAMPLES

                darkModeWithGridRef = getIntegratedDarkModeCode(bindings.exampleName, true, 'grid?.api');
                const angularImportIdx = imports.findIndex((i) => i.includes('Component'));
                if (darkModeWithGridRef) {
                    // wrap in useEffect
                    darkModeWithGridRef = darkModeWithGridRef.replace(
                        DARK_INTEGRATED_START,
                        `${DARK_INTEGRATED_START} 
                        @ViewChild(AgGridAngular)
                        set agGrid(grid){
                            `
                    );
                    darkModeWithGridRef = darkModeWithGridRef.replace(DARK_INTEGRATED_END, `} ${DARK_INTEGRATED_END}`);

                    if (!imports[angularImportIdx].includes('ViewChild')) {
                        imports[angularImportIdx] = imports[angularImportIdx].replace(
                            'Component',
                            'Component, ViewChild'
                        );
                    }
                }
            }
        }

        const eventAttributes = bindings.eventHandlers
            .filter((event) => event.name !== 'onGridReady')
            .map(toOutput)
            .concat(gridReadyCode ? '(gridReady)="onGridReady($event)"' : '');

        const template = getTemplate(bindings, exampleConfig, propertyAttributes.concat(eventAttributes));

        const componentBody = eventHandlers
            .concat(externalEventHandlers)
            .concat(additional)
            .concat(instanceMethods)
            .map((snippet) => snippet.trim())
            .join('\n\n')
            // We do not need the non-null assertion in component code as already applied to the declaration for the apis.
            .replace(/(?<!this.)gridApi(\??)(!?)/g, 'this.gridApi');

        const standaloneImports = ['AgGridAngular'];
        if (bindings.data) {
            standaloneImports.push('HttpClientModule');
        }

        if (componentFileNames) {
            componentFileNames.forEach((filename) => {
                const componentName = toTitleCase(filename.split('.')[0]);
                standaloneImports.push(componentName);
            });
        }

        let generatedOutput = `
${imports.join('\n')}
${exampleConfig.licenseKey ? "// enter your license key here to suppress console message and watermark\nLicenseManager.setLicenseKey('');\n" : ''}
${typeDeclares?.length > 0 ? '\n' + typeDeclares.join('\n') : ''}${interfaces?.length > 0 ? '\n' + interfaces.join('\n') : ''}

@Component({
    selector: 'my-app',
    standalone: true,
    imports: [${standaloneImports.join(', ')}],
    template: \`${template}\`
})

export class AppComponent {
${hasGridApi ? `    private gridApi!: GridApi${genericParams};\n` : ''}
    ${propertyAssignments.join(';\n')}

${
    diParams.length > 0
        ? `    constructor(${diParams.join(', ')}) {
}

`
        : ''
}
    ${componentBody}
    ${darkModeWithGridRef ?? ''}
}

${bindings.classes.join('\n')}

${bindings.utils.join('\n')}
`;

        // Until we support this cleanly.
        generatedOutput = handleRowGenericInterface(generatedOutput, tData);

        return generatedOutput;
    };
}

if (typeof window !== 'undefined') {
    (<any>window).vanillaToAngular = vanillaToAngular;
}

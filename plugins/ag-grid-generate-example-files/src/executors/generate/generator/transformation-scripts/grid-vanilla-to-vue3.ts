import * as JSON5 from 'json5';

import type { ExampleConfig, ParsedBindings } from '../types';
import {
    GRID_WIDE_COMPONENTS,
    OVERRIDABLE_AG_COMPONENTS,
    convertDefaultColDef,
    getColumnDefs,
    getTemplate,
    isComponent,
    isExternalVueFile,
} from './grid-vanilla-to-vue-common';
import {
    addBindingImports,
    addLicenseManager,
    addRelativeImports,
    convertFunctionToConstProperty,
    findLocaleImport,
    getFunctionName,
    getIntegratedDarkModeCode,
    isInstanceMethod,
    preferParamsApi,
    replaceGridReadyRowData,
} from './parser-utils';
import { getImport, toConst, toInput, toOutput, toRef } from './vue-utils';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');

function getOnGridReadyCode(bindings: ParsedBindings): string {
    const { onGridReady, data } = bindings;
    const additionalLines = [];

    if (onGridReady) {
        additionalLines.push(onGridReady.trim().replace(/^\{|\}$/g, ''));
    }

    if (data) {
        const { url, callback } = data;

        const setRowDataBlock = replaceGridReadyRowData(callback, 'rowData.value');

        additionalLines.push(`
            const updateData = (data) => ${setRowDataBlock};
            
            fetch(${url})
                .then(resp => resp.json())
                .then(data => updateData(data));`);
    }

    const additional = preferParamsApi(
        additionalLines.length > 0 ? `\n\n        ${additionalLines.join('\n        ')}` : ''
    );
    return `const onGridReady = (params) => {
        ${getIntegratedDarkModeCode(bindings.exampleName)}
        gridApi.value = params.api;
        ${additional}
    }`;
}

const replaceApiThisReference = (code) => code.replaceAll('gridApi', 'gridApi.value');

function getAllMethods(bindings: ParsedBindings): [string[], string[], string[], string[], string[]] {
    const eventHandlers = bindings.eventHandlers
        .filter((event) => event.name != 'onGridReady')
        .map((event) => event.handler)
        .map(replaceApiThisReference)
        .map(convertFunctionToConstProperty);

    const externalEventHandlers = bindings.externalEventHandlers
        .map((event) => event.body)
        .map(replaceApiThisReference)
        .map(convertFunctionToConstProperty);
    const instanceMethods = bindings.instanceMethods.map(replaceApiThisReference).map(convertFunctionToConstProperty);

    const utilFunctions = bindings.utils
        .map((body) => {
            const funcName = getFunctionName(body);

            if (funcName) {
                return `window.${funcName} = ${body}`;
            }

            // probably a var
            return body;
        })
        .sort((a, b) => {
            const aIsAssignedToWindow = a.startsWith('window.');
            const bIsAssignedToWindow = b.startsWith('window.');

            if (aIsAssignedToWindow && bIsAssignedToWindow) {
                return 0;
            }
            if (aIsAssignedToWindow) {
                return -1;
            }
            if (bIsAssignedToWindow) {
                return 1;
            }

            return 0;
        });

    const functionNames = bindings.eventHandlers
        .map((event) => event.handlerName)
        .concat(bindings.externalEventHandlers.map((event) => event.name))
        .concat(bindings.instanceMethods.map(getFunctionName));

    return [eventHandlers, externalEventHandlers, instanceMethods, utilFunctions, functionNames];
}

function toAssignment(property: any): string {
    // convert to arrow functions
    const value = property.value.replace(/function\s*\(([^)]+)\)/, '($1) =>');

    return `${property.name}.value = ${value}`;
}

function getPropertyBindings(
    bindings: ParsedBindings,
    componentFileNames: string[],
    vueComponents
): [string[], string[], string[], string[], string[]] {
    const propertyAssignments = [];
    const propertyVars = [];
    const propertyAttributes = [];
    const propertyNames = [];

    bindings.properties
        .filter((property) => property.name !== 'onGridReady' && property.name !== 'columnDefs')
        .forEach((property) => {
            if (bindings.vuePropertyBindings[property.name]) {
                const parsedObj = JSON5.parse(bindings.vuePropertyBindings[property.name]);
                const panelArrayName = parsedObj['toolPanels'] ? 'toolPanels' : 'statusPanels';
                if (parsedObj[panelArrayName]) {
                    parsedObj[panelArrayName].forEach((panel) => {
                        Object.keys(panel).forEach((panelProperty) => {
                            if (
                                !panelProperty.startsWith('ag') &&
                                isComponent(panelProperty) &&
                                typeof panel[panelProperty] === 'string'
                            ) {
                                const parsedValue = panel[panelProperty].replace('AG_LITERAL_', '');
                                if (isExternalVueFile(componentFileNames, parsedValue)) {
                                    panel[panelProperty] = parsedValue;
                                    if (!vueComponents.includes(parsedValue)) {
                                        vueComponents.push(parsedValue);
                                    }
                                }
                            }
                        });
                    });
                    property.value = JSON.stringify(parsedObj);
                }

                propertyAttributes.push(toInput(property));
                propertyVars.push(toRef(property));
                propertyAssignments.push(toAssignment(property));
                propertyNames.push(property.name);
            } else if (componentFileNames.length > 0 && property.name === 'components') {
                if (bindings.components) {
                    const userAgComponents = OVERRIDABLE_AG_COMPONENTS.filter((agComponentName) =>
                        bindings.components.some(
                            (component) =>
                                component.name === agComponentName &&
                                !vueComponents.some((existingComp) => existingComp.includes(agComponentName))
                        )
                    ).map((agComponentName) => `${agComponentName}: '${agComponentName}'`);

                    vueComponents.push(...userAgComponents);
                }
            } else if (property.value === 'true' || property.value === 'false') {
                propertyAttributes.push(toConst(property));
                // propertyNames.push(property.name);
            } else if (property.value === null || property.value === 'null') {
                propertyAttributes.push(toInput(property));
                propertyNames.push(property.name);
            } else if (property.name === 'groupRowRendererParams') {
                const perLine = property.value.split('\n');
                const result = [];
                perLine.forEach((line) => {
                    if (line.includes('innerRenderer')) {
                        const component = line.match(/.*:\s*(.*),/)
                            ? line.match(/.*:\s*(.*),/)[1]
                            : line.match(/.*:\s*(.*)$/)[1];
                        line = line.replace(component, `'${component}'`);
                        result.push(line);

                        if (!vueComponents.includes(component)) {
                            vueComponents.push(component);
                        }
                    } else {
                        result.push(line);
                    }
                });
                const newValue = result.join('\n');

                propertyAttributes.push(toInput(property));
                propertyVars.push(toRef(property));
                propertyAssignments.push(`${property.name}.value = ${newValue}`);
                propertyNames.push(property.name);
            } else if (GRID_WIDE_COMPONENTS.includes(property.name)) {
                const parsedValue = `${property.value.replace('AG_LITERAL_', '')}`;

                propertyAttributes.push(toInput(property));
                propertyVars.push(toRef(property));
                propertyAssignments.push(`${property.name}.value = '${parsedValue}'`);
                propertyNames.push(property.name);
                if (isExternalVueFile(componentFileNames, parsedValue)) {
                    if (!vueComponents.includes(parsedValue)) {
                        vueComponents.push(parsedValue);
                    }
                }
            } else {
                propertyNames.push(property.name);

                // for when binding a method
                // see javascript-grid-keyboard-navigation for an example
                // tabToNextCell needs to be bound to the react component
                if (!isInstanceMethod(bindings.instanceMethods, property)) {
                    propertyAttributes.push(toInput(property));

                    if (property.name !== 'defaultColDef' && property.name !== 'autoGroupColumnDef') {
                        propertyVars.push(toRef(property));
                    }
                }

                if (property.name !== 'defaultColDef' && property.name !== 'autoGroupColumnDef') {
                    propertyAssignments.push(toAssignment(property));
                }
            }
        });

    if (bindings.data && bindings.data.callback.indexOf("gridApi.setGridOption('rowData',") >= 0) {
        if (propertyAttributes.filter((item) => item.indexOf(':rowData') >= 0).length === 0) {
            propertyAttributes.push(':rowData="rowData"');
            propertyNames.push('rowData');
        }

        if (propertyVars.filter((item) => item.indexOf('rowData') >= 0).length === 0) {
            propertyVars.push('const rowData = ref(null)');
        }
    }

    return [propertyAssignments, propertyVars, propertyAttributes, vueComponents, propertyNames];
}

function getModuleImports(
    bindings: ParsedBindings,
    exampleConfig: ExampleConfig,
    componentFileNames: string[],
    allStylesheets: string[]
): string[] {
    const imports = [
        "import { createApp, onBeforeMount, ref, shallowRef } from 'vue';",
        "import { AgGridVue } from 'ag-grid-vue3';",
    ];

    addLicenseManager(imports, exampleConfig);

    if (allStylesheets && allStylesheets.length > 0) {
        allStylesheets.forEach((styleSheet) => imports.push(`import './${path.basename(styleSheet)}';`));
    }

    const bImports = [...(bindings.imports || [])];
    bImports.push({
        module: `'ag-grid-community'`,
        isNamespaced: false,
        imports: [],
    });
    if (bImports.length > 0) {
        addBindingImports(bImports, imports, true);
    }

    if (componentFileNames) {
        imports.push(...componentFileNames.map((componentFileName) => getImport(componentFileName, 'Vue', '')));
    }
    addRelativeImports(bindings, imports, 'js');

    return imports;
}

function getImports(
    bindings: ParsedBindings,
    exampleConfig: ExampleConfig,
    componentFileNames: string[],
    allStylesheets: string[]
): string[] {
    const imports = [];

    const localeImport = findLocaleImport(bindings.imports);
    if (localeImport) {
        imports.push(`import { ${localeImport.imports[0]} } from '@ag-grid-community/locale';`);
    }

    imports.push(...getModuleImports(bindings, exampleConfig, componentFileNames, allStylesheets));

    if (bindings.moduleRegistration) {
        imports.push(bindings.moduleRegistration);
    }

    return imports;
}

export function vanillaToVue3(
    bindings: ParsedBindings,
    exampleConfig: ExampleConfig,
    componentFileNames: string[],
    allStylesheets: string[]
): () => string {
    const vueComponents = bindings.components.map((component) => `${component.name}:${component.value}`);

    const onGridReady = getOnGridReadyCode(bindings);
    const eventAttributes = bindings.eventHandlers.filter((event) => event.name !== 'onGridReady').map(toOutput);
    const [eventHandlers, externalEventHandlers, instanceMethods, utilFunctions, functionNames] =
        getAllMethods(bindings);
    const columnDefs = getColumnDefs(bindings, vueComponents, componentFileNames);
    const defaultColDef = bindings.defaultColDef
        ? convertDefaultColDef(bindings.defaultColDef, vueComponents, componentFileNames)
        : null;
    const autoGroupColumnDef = bindings.autoGroupColumnDef
        ? convertDefaultColDef(bindings.autoGroupColumnDef, vueComponents, componentFileNames)
        : null;

    return () => {
        const imports = getImports(bindings, exampleConfig, componentFileNames, allStylesheets);
        const [propertyAssignments, propertyVars, propertyAttributes, _, propertyNames] = getPropertyBindings(
            bindings,
            componentFileNames,
            vueComponents
        );
        const template = getTemplate(bindings, exampleConfig, propertyAttributes.concat(eventAttributes));

        return `
${imports.join('\n')}
${exampleConfig.licenseKey ? "// enter your license key here to suppress console message and watermark\nLicenseManager.setLicenseKey('');\n" : ''}
${bindings.classes.join('\n')}

const VueExample = {
    template: \`
        <div style="height: 100%">
            ${template}
        </div>
    \`,
    components: {
        'ag-grid-vue': AgGridVue,
        ${vueComponents.join(',\n')}
    },
    setup(props) {
        const columnDefs = ref(${columnDefs});
        const gridApi = shallowRef();
        ${defaultColDef ? `const defaultColDef = ref(${defaultColDef});` : ''}
        ${autoGroupColumnDef ? `const autoGroupColumnDef = ref(${autoGroupColumnDef});` : ''}
        ${propertyVars.join(';\n')}
        
        onBeforeMount(() => {
            ${propertyAssignments.join(';\n')}            
        });
        
        ${eventHandlers
            .concat(externalEventHandlers)
            .concat(onGridReady)
            .concat(instanceMethods)
            .map((snippet) => `${snippet.trim()};`)
            .join('\n')}
                
        return {
            columnDefs,
            gridApi,
            ${propertyNames.length > 0 ? propertyNames.join(',\n') + ',' : ''}
            onGridReady,
            ${functionNames ? functionNames.filter((functionName) => !propertyNames.includes(functionName)).join(',\n') : ''}
        }        
    }
}

${utilFunctions.map((snippet) => `${snippet.trim()}`).join('\n\n')}

createApp(VueExample)
    .mount("#app")

`;
    };
}

if (typeof window !== 'undefined') {
    (<any>window).vanillaToVue3 = vanillaToVue3;
}

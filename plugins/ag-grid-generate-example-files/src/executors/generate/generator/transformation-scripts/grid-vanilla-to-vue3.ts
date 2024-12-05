import type { ExampleConfig, ParsedBindings } from '../types';
import { getTemplate } from './grid-vanilla-to-vue-common';
import {
    addBindingImports,
    addGenericInterfaceImport,
    addLicenseManager,
    addRelativeImports,
    convertFunctionToConstPropertyTs,
    findLocaleImport,
    getFunctionName,
    getIntegratedDarkModeCode,
    getPropertyInterfaces,
    handleRowGenericInterface,
    isInstanceMethod,
    preferParamsApi,
    replaceGridReadyRowData,
} from './parser-utils';
import { getComponentName, getImport, toConst, toInput, toMemberWithType, toOutput } from './vue-utils';

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
    return `const onGridReady = (params: GridReadyEvent) => {
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
        .map(convertFunctionToConstPropertyTs);

    const externalEventHandlers = bindings.externalEventHandlers
        .map((event) => event.body)
        .map(replaceApiThisReference)
        .map(convertFunctionToConstPropertyTs);
    const instanceMethods = bindings.instanceMethods.map(replaceApiThisReference).map(convertFunctionToConstPropertyTs);

    const utilFunctions = bindings.utils;

    const functionNames = bindings.eventHandlers
        .map((event) => event.handlerName)
        .concat(bindings.externalEventHandlers.map((event) => event.name))
        .concat(bindings.instanceMethods.map(getFunctionName));

    return [eventHandlers, externalEventHandlers, instanceMethods, utilFunctions, functionNames];
}

function getPropertyBindings(
    bindings: ParsedBindings,
    rowDataType: string,
    componentFileNames: string[],
    vueComponents
): [string[], string[], string[], string[]] {
    const propertyAssignments = [];
    const propertyAttributes = [];
    const propertyNames = [];

    bindings.properties
        .filter((property) => property.name !== 'onGridReady')
        .forEach((property) => {
            if (property.value === 'true' || property.value === 'false') {
                propertyAttributes.push(toConst(property));
            } else if (property.value === null || property.value === 'null') {
                propertyAttributes.push(toInput(property));
                propertyNames.push(property.name);
            } else if (property.name !== 'components') {
                propertyNames.push(property.name);

                // for when binding a method
                // see javascript-grid-keyboard-navigation for an example
                // tabToNextCell needs to be bound to the react component
                if (!isInstanceMethod(bindings.instanceMethods, property)) {
                    propertyAttributes.push(toInput(property));
                }
                propertyAssignments.push(toMemberWithType(property, componentFileNames));
            }
        });

    if (!propertyAttributes.find((item) => item.indexOf(':rowData') >= 0)) {
        propertyAttributes.push(':rowData="rowData"');
        propertyNames.push('rowData');
    }

    if (!propertyAssignments.find((item) => item.indexOf('rowData') >= 0)) {
        propertyAssignments.push(`const rowData = ref<${rowDataType}[]>(null);`);
    }

    if (bindings.data && bindings.data.callback.indexOf("gridApi.setGridOption('rowData',") >= 0) {
        if (propertyAttributes.filter((item) => item.indexOf(':rowData') >= 0).length === 0) {
            propertyAttributes.push(':rowData="rowData"');
            propertyNames.push('rowData');
        }
    }

    return [propertyAssignments, propertyAttributes, vueComponents, propertyNames];
}

function getModuleImports(
    bindings: ParsedBindings,
    exampleConfig: ExampleConfig,
    componentFileNames: string[],
    allStylesheets: string[]
): string[] {
    const { properties } = bindings;

    const imports = [
        "import { createApp, defineComponent, onBeforeMount, ref, shallowRef } from 'vue';",
        "import { AgGridVue } from 'ag-grid-vue3';",
    ];

    if (allStylesheets && allStylesheets.length > 0) {
        allStylesheets.forEach((styleSheet) => imports.push(`import './${path.basename(styleSheet)}';`));
    }

    const propertyInterfaces = getPropertyInterfaces(properties);
    const bImports = [...(bindings.imports || []).filter((entry) => !entry.module.includes('./'))];
    bImports.push({
        module: `'ag-grid-community'`,
        isNamespaced: false,
        imports: [...propertyInterfaces, 'GridReadyEvent', 'GridApi'],
    });

    addLicenseManager(imports, exampleConfig);

    if (bImports.length > 0) {
        addBindingImports(bImports, imports, true);
    }

    if (componentFileNames) {
        imports.push(...componentFileNames.map((componentFileName) => getImport(componentFileName, 'Vue', '')));
    }

    addRelativeImports(bindings, imports, '');

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

    addGenericInterfaceImport(imports, bindings.tData, bindings);

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
    const { typeDeclares, interfaces } = bindings;

    const vueComponents = new Set(bindings.components.map((component) => `${component.name}:${component.value}`));
    componentFileNames
        .map((componentFileName) => getComponentName(componentFileName, 'Vue', ''))
        .forEach(vueComponents.add, vueComponents);

    const rowDataType = bindings.tData || 'any';

    const onGridReady = getOnGridReadyCode(bindings);
    const eventAttributes = bindings.eventHandlers.filter((event) => event.name !== 'onGridReady').map(toOutput);
    const [eventHandlers, externalEventHandlers, instanceMethods, utilFunctions, functionNames] =
        getAllMethods(bindings);
    const genericParams = rowDataType !== 'any' ? `<${rowDataType}>` : '';

    return () => {
        const imports = getImports(bindings, exampleConfig, componentFileNames, allStylesheets);
        const [propertyAssignments, propertyAttributes, _, propertyNames] = getPropertyBindings(
            bindings,
            rowDataType,
            componentFileNames,
            vueComponents
        );
        const template = getTemplate(bindings, exampleConfig, propertyAttributes.concat(eventAttributes));

        return handleRowGenericInterface(
            `
${imports.join('\n')}
${exampleConfig.licenseKey ? "// enter your license key here to suppress console message and watermark\nLicenseManager.setLicenseKey('');\n" : ''}
${bindings.classes.join('\n')}
${typeDeclares?.length > 0 ? '\n' + typeDeclares.join('\n') : ''}${interfaces?.length > 0 ? '\n' + interfaces.join('\n') : ''}

${utilFunctions.map((snippet) => `${snippet.trim()}`).join('\n\n')}

const VueExample = defineComponent({
    template: \`
        <div style="height: 100%">
            ${template}
        </div>
    \`,
    components: {
        'ag-grid-vue': AgGridVue,
        ${Array.from(vueComponents).join(',\n')}
    },
    setup(props) {
        const gridApi = shallowRef<GridApi${genericParams} | null>(null);
        ${propertyAssignments.join('\n')}
       
        ${eventHandlers
            .concat(externalEventHandlers)
            .concat(onGridReady)
            .concat(instanceMethods)
            .map((snippet) => `${snippet.trim()};`)
            .join('\n')}
                
        return {
            gridApi,
            ${propertyNames.length > 0 ? propertyNames.join(',\n') + ',' : ''}
            onGridReady,
            ${functionNames ? functionNames.filter((functionName) => !propertyNames.includes(functionName)).join(',\n') : ''}
        }        
    }
})

createApp(VueExample)
    .mount("#app")
`,
            bindings.tData
        );
    };
}

if (typeof window !== 'undefined') {
    (<any>window).vanillaToVue3 = vanillaToVue3;
}

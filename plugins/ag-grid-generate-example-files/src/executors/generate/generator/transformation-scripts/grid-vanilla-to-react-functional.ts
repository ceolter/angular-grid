import { basename } from 'path';

import type { ExampleConfig, ParsedBindings } from '../types';
import { templatePlaceholder } from './grid-vanilla-src-parser';
import {
    DARK_INTEGRATED_END,
    DARK_INTEGRATED_START,
    addBindingImports,
    addLicenseManager,
    addRelativeImports,
    convertFunctionToConstProperty,
    findLocaleImport,
    getFunctionName,
    getIntegratedDarkModeCode,
    isInstanceMethod,
    preferParamsApi,
} from './parser-utils';
import {
    EventAndCallbackNames,
    convertFunctionToConstCallback,
    convertFunctionalTemplate,
    getImport,
    getValueType,
} from './react-utils';

function getModuleImports(
    bindings: ParsedBindings,
    exampleConfig: ExampleConfig,
    componentFilenames: string[],
    allStylesheets: string[]
): string[] {
    const imports = [
        "import React, { useCallback, useMemo, useRef, useState, StrictMode } from 'react';",
        "import { createRoot } from 'react-dom/client';",
        "import { AgGridReact } from 'ag-grid-react';",
    ];

    addLicenseManager(imports, exampleConfig);

    if (allStylesheets && allStylesheets.length > 0) {
        allStylesheets.forEach((styleSheet) => imports.push(`import './${basename(styleSheet)}';`));
    }

    if (componentFilenames) {
        imports.push(...componentFilenames.map(getImport));
    }

    addRelativeImports(bindings, imports, 'jsx');

    const moduleImports = bindings.imports.filter((i) => i.imports.find((m) => m.includes('Module')));
    if (moduleImports.length > 0) {
        addBindingImports(moduleImports, imports, true);
    }
    const cssImports = bindings.imports.filter((i) => i.module.includes('.css'));
    if (cssImports.length > 0) {
        addBindingImports(cssImports, imports, true);
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
    const imports = [];
    const localeImport = findLocaleImport(bindings.imports);
    if (localeImport) {
        imports.push(`import { ${localeImport.imports[0]} } from '@ag-grid-community/locale';`);
    }

    imports.push(...getModuleImports(bindings, exampleConfig, componentFileNames, allStylesheets));

    return imports;
}

function getTemplate(bindings: ParsedBindings, componentAttributes: string[], exampleConfig: ExampleConfig): string {
    const className = bindings.inlineGridStyles.className;
    const classAttr = className ? ` className="${className}"` : '';

    const agGridTag = `
        <div ${exampleConfig.myGridReference ? 'id="myGrid"' : ''} style={gridStyle}${classAttr}>
            <AgGridReact
                ref={gridRef}
                ${componentAttributes.join('\n')}
            />
        </div>`;

    const template = bindings.template
        ? bindings.template.replace(templatePlaceholder, agGridTag.replace('$', '$$$$'))
        : agGridTag;

    return convertFunctionalTemplate(template);
}

function extractComponentInformation(properties, componentFilenames: string[]): { [key: string]: string } {
    const components: { [key: string]: string } = {};
    if (componentFilenames.length <= 0) {
        return components;
    }

    properties.forEach((property) => {
        if (property.name === 'components') {
            property.value
                .split(`\n`)
                .filter((keyValue) => keyValue.includes(':'))
                .map((keyValue) => keyValue.replace(/\s/g, ''))
                .map((keyValue) => keyValue.replace(/,/g, ''))
                .map((keyValue) => keyValue.split(':'))
                .reduce((accumulator, keyValue) => {
                    accumulator[keyValue[0]] = keyValue[1];
                    return accumulator;
                }, components);
        }
    });

    return components;
}

export function vanillaToReactFunctional(
    bindings: ParsedBindings,
    exampleConfig: ExampleConfig,
    componentFilenames: string[],
    allStylesheets: string[]
): () => string {
    const { properties, data, inlineGridStyles, onGridReady } = bindings;

    const utilMethodNames = bindings.utils.map(getFunctionName);
    const callbackDependencies = Object.keys(bindings.callbackDependencies).reduce((acc, callbackName) => {
        acc[callbackName] = bindings.callbackDependencies[callbackName]
            .filter((dependency) => !utilMethodNames.includes(dependency))
            .filter((dependency) => !global[dependency]); // exclude things like Number, isNaN etc
        return acc;
    }, {});

    return () => {
        // instance values
        const stateProperties = [
            `const containerStyle = useMemo(() => ({ width: '100%', height: '100%' }), []);`,
            `const gridStyle = useMemo(() => ({height: '${inlineGridStyles.height}', width: '${inlineGridStyles.width}'}), []);`,
            `const [rowData, setRowData] = useState();`,
        ];

        const imports = getImports(bindings, exampleConfig, componentFilenames, allStylesheets);

        // for when binding a method
        // see javascript-grid-keyboard-navigation for an example
        // tabToNextCell needs to be bound to the react component
        // rarely used (one example only - can be improved and this be removed)
        const instanceBindings = [];

        const componentProps = ['rowData={rowData}'];

        const additionalInReady = [];
        if (data) {
            additionalInReady.push(`${getIntegratedDarkModeCode(bindings.exampleName)}`);

            const setRowDataBlock = data.callback.replace("gridApi.setGridOption('rowData',", 'setRowData(');
            additionalInReady.push(`
                fetch(${data.url})
                .then(resp => resp.json())
                .then(data => ${setRowDataBlock});`);
        }

        if (onGridReady) {
            additionalInReady.push(`${getIntegratedDarkModeCode(bindings.exampleName)}`);
            const hackedHandler = onGridReady
                .replace(/^{|}$/g, '')
                .replace("gridApi.setGridOption('rowData',", 'setRowData(');
            additionalInReady.push(hackedHandler);
        }

        const components: { [componentName: string]: string } = extractComponentInformation(
            properties,
            componentFilenames
        );

        const containsQuotes = (data: string) => {
            const withoutBoundaryQuotes = data.replace(/^"|"$/g, '');
            return withoutBoundaryQuotes.includes('"') || withoutBoundaryQuotes.includes("'");
        };
        const stripQuotes = (data: string) => data.replace(/"/g, '').replace(/'/g, '');
        const componentNameExists = (componentName: string) =>
            Object.keys(components).includes(stripQuotes(componentName));

        properties
            .filter((property) => property.name !== 'onGridReady')
            .forEach((property) => {
                if (property.name === 'rowData') {
                    if (property.value !== 'null' && property.value !== null) {
                        const rowDataIndex = stateProperties.indexOf('const [rowData, setRowData] = useState();');
                        stateProperties[rowDataIndex] = `const [rowData, setRowData] = useState(${property.value});`;
                    }
                } else if (property.value === 'true' || property.value === 'false') {
                    componentProps.push(`${property.name}={${property.value}}`);
                } else if (property.value === null) {
                    componentProps.push(`${property.name}={${property.name}}`);
                } else {
                    // for when binding a method
                    // see javascript-grid-keyboard-navigation for an example
                    // tabToNextCell needs to be bound to the react component
                    if (isInstanceMethod(bindings.instanceMethods, property)) {
                        instanceBindings.push(`${property.name}=${property.value}`);
                    } else {
                        if (property.name === 'columnDefs') {
                            stateProperties.push(
                                `const [${property.name}, setColumnDefs] = useState(${property.value});`
                            );
                            componentProps.push(`${property.name}={${property.name}}`);
                        } else {
                            // for values like booleans or strings just inline the prop - no need for a separate variable for it
                            const valueType = getValueType(property.value);
                            if (valueType === 'string') {
                                if (componentNameExists(property.value)) {
                                    componentProps.push(
                                        `${property.name}={${components[stripQuotes(property.value)]}}`
                                    );
                                } else {
                                    if (containsQuotes(property.value)) {
                                        componentProps.push(`${property.name}={${property.value}}`);
                                    } else {
                                        componentProps.push(`${property.name}=${property.value}`);
                                    }
                                }
                            } else if (valueType === 'boolean' || valueType === 'number') {
                                componentProps.push(`${property.name}={${property.value}}`);
                            } else {
                                if (EventAndCallbackNames.has(property.name)) {
                                    stateProperties.push(
                                        `const ${property.name} = useCallback(${property.value}, [${callbackDependencies[property.name] || ''}]);`
                                    );
                                } else {
                                    stateProperties.push(
                                        `const ${property.name} = useMemo(() => { return ${property.value} }, []);`
                                    );
                                }
                                componentProps.push(`${property.name}={${property.name}}`);
                            }
                        }
                    }
                }
            });

        const componentEventAttributes = bindings.eventHandlers.map(
            (event) => `${event.handlerName}={${event.handlerName}}`
        );

        let darkModeWithGridRef = undefined;
        if (additionalInReady.length > 0) {
            componentProps.push('onGridReady={onGridReady}');
        } else {
            // We need to check if we need to add integrated dark mode code for and example that does not have data or onGridReady
            darkModeWithGridRef = getIntegratedDarkModeCode(bindings.exampleName, true, 'gridRef.current?.api?');
        }
        componentProps.push(...componentEventAttributes);

        if (bindings.exampleName.includes('sparklines')) {
            // TEMPORARY ONLY APPLY TO SPARKLINES EXAMPLES

            const reactImportIdx = imports.findIndex((i) => i.includes('useState'));
            if (darkModeWithGridRef) {
                // wrap in useEffect
                darkModeWithGridRef = darkModeWithGridRef.replace(
                    DARK_INTEGRATED_START,
                    `${DARK_INTEGRATED_START} const [tick, setTick] = useState(0);\nuseEffect(() => { setTick(1); `
                );
                darkModeWithGridRef = darkModeWithGridRef.replace(
                    DARK_INTEGRATED_END,
                    `}, [gridRef.current]); ${DARK_INTEGRATED_END}`
                );

                if (!imports[reactImportIdx].includes('useEffect')) {
                    imports[reactImportIdx] = imports[reactImportIdx].replace('useState', 'useState, useEffect');
                }
            }
        }

        // convert this.xxx to just xxx
        // no real need for "this" in hooks
        const thisReferenceConverter = (content) => content.replace(/this\./g, '');

        const gridInstanceConverter = (content) =>
            content
                .replace(/params\.api(!?)\.setGridOption\('rowData', data\)/g, 'setRowData(data)')
                .replace(/gridApi\./g, 'gridRef.current.api.')
                .replace(/gridApi;/g, 'gridRef.current.api;')
                .replace("gridRef.current.api.setGridOption('rowData',", 'setRowData(')
                .replace(/gridApi/g, 'gridRef.current.api');

        const template = getTemplate(bindings, componentProps.map(thisReferenceConverter), exampleConfig);
        const eventHandlers = bindings.eventHandlers
            .map((event) => convertFunctionToConstCallback(event.handler, callbackDependencies))
            .map(thisReferenceConverter)
            .map(gridInstanceConverter);
        const externalEventHandlers = bindings.externalEventHandlers
            .map((handler) => convertFunctionToConstCallback(handler.body, callbackDependencies))
            .map(thisReferenceConverter)
            .map(gridInstanceConverter);
        const instanceMethods = bindings.instanceMethods
            .map((instance) => convertFunctionToConstCallback(instance, callbackDependencies))
            .map(thisReferenceConverter)
            .map(gridInstanceConverter);
        const containerStyle = exampleConfig.noStyle ? '' : `style={containerStyle}`;

        const gridReady =
            additionalInReady.length > 0
                ? `
            const onGridReady = useCallback((params) => {
                ${preferParamsApi(additionalInReady.join('\n'))}
            }, []);`
                : '';

        let generatedOutput = `
'use client';

${imports.join('\n')}

${exampleConfig.licenseKey ? "// enter your license key here to suppress console message and watermark\nLicenseManager.setLicenseKey('');\n" : ''}

${bindings.utils.map(convertFunctionToConstProperty).join('\n\n')}

${bindings.classes.join('\n')}

const GridExample = () => {
    const gridRef = useRef();
    ${stateProperties.join('\n    ')}

${gridReady}

${[].concat(eventHandlers, externalEventHandlers, instanceMethods).join('\n\n   ')}

    return  (
            <div ${containerStyle}>
                ${template}
            </div>
        );

}

const root = createRoot(document.getElementById('root'));
root.render(<StrictMode><GridExample /></StrictMode>);
window.tearDownExample = () => root.unmount();
`;

        if ((generatedOutput.match(/gridRef\.current/g) || []).length === 0) {
            generatedOutput = generatedOutput.replace('const gridRef = useRef();', '');
            generatedOutput = generatedOutput.replace('ref={gridRef}', '');
        }
        if (
            generatedOutput.includes('const [rowData, setRowData] = useState();') &&
            (generatedOutput.match(/setRowData/g) || []).length === 1
        ) {
            generatedOutput = generatedOutput.replace('const [rowData, setRowData] = useState();', '');
            generatedOutput = generatedOutput.replace('rowData={rowData}', '');
        }

        return generatedOutput;
    };
}

if (typeof window !== 'undefined') {
    (<any>window).vanillaToReactFunctional = vanillaToReactFunctional;
}

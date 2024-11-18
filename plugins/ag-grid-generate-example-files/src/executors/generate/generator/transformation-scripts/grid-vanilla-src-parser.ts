import * as cheerio from 'cheerio';
import ts from 'typescript';

import { _ALL_EVENTS } from '../_copiedFromCore/eventTypes';
import { _ALL_GRID_OPTIONS, _FUNCTION_GRID_OPTIONS } from '../_copiedFromCore/propertyKeys';
import type { GridOptionsType, InlineGridStyles, ParsedBindings } from '../types';
import {
    extractClassDeclarations,
    extractEventHandlers,
    extractImportStatements,
    extractInterfaces,
    extractModuleRegistration,
    extractTypeDeclarations,
    findAllAccessedProperties,
    findAllVariables,
    parseFile,
    readAsJsFile,
    recognizedDomEvents,
    tsCollect,
    tsGenerate,
    tsNodeIsFunctionCall,
    tsNodeIsFunctionWithName,
    tsNodeIsGlobalVarWithName,
    tsNodeIsPropertyWithName,
    tsNodeIsTopLevelFunction,
    tsNodeIsTopLevelVariable,
    tsNodeIsTypeDeclaration,
    tsNodeIsUnusedFunction,
} from './parser-utils';

export const templatePlaceholder = 'GRID_TEMPLATE_PLACEHOLDER';
const PROPERTIES: any = _ALL_GRID_OPTIONS;
const FUNCTION_PROPERTIES: any = _FUNCTION_GRID_OPTIONS;

function tsNodeIsDocumentContentLoaded(node) {
    try {
        if (tsNodeIsFunctionCall(node)) {
            return (
                node.arguments?.length > 0 &&
                ts.isStringLiteral(node.arguments[0]) &&
                node.arguments[0].text === 'DOMContentLoaded'
            );
        }
    } catch (e) {
        console.error('We found something which we do not understand', node);
        if (tsNodeIsFunctionCall(node)) {
            return (
                node.arguments?.length > 0 &&
                ts.isStringLiteral(node.arguments[0]) &&
                node.arguments[0].text === 'DOMContentLoaded'
            );
        }
    }
}

function tsNodeIsSimpleFetchRequest(node) {
    if (ts.isCallExpression(node)) {
        node = node as any;
        const isFetch = ts.isCallExpression(node) && node.expression.getText() === 'fetch';
        return isFetch;
    }
}

function processColDefsForFunctionalReactOrVue(propertyName: string, providedExamples) {
    if (propertyName === 'columnDefs') {
        return !(providedExamples['reactFunctional'] && providedExamples['vue3']);
    }

    return false;
}

function processComponentsForVue(propertyName: string, providedExamples) {
    if (propertyName === 'components') {
        return !providedExamples['vue3'];
    }

    return false;
}

function processVueProperties(propertyName: string, providedExamples) {
    if (propertyName === 'statusBar' || propertyName === 'sideBar') {
        return !providedExamples['vue3'];
    }

    return false;
}

function processDefaultColumnDefForVue(propertyName: string, providedExamples) {
    if (propertyName === 'defaultColDef') {
        return !providedExamples['vue3'];
    }

    return false;
}

function processAutoGroupColumnDefForVue(propertyName: string, providedExamples) {
    if (propertyName === 'autoGroupColumnDef') {
        return !providedExamples['vue3'];
    }

    return false;
}

const GLOBAL_COMPONENTS = [
    'dateComponent',
    'loadingCellRenderer',
    'loadingOverlayComponent',
    'noRowsOverlayComponent',
    'dragAndDropImageComponent',
];

function processGlobalComponentsForVue(propertyName: string, providedExamples) {
    if (GLOBAL_COMPONENTS.indexOf(propertyName) !== -1) {
        return !providedExamples['vue3'];
    }

    return false;
}

interface Collector {
    matches: (node: any) => boolean;
    apply: (bindings: ParsedBindings, node: any) => void;
}

function internalParser(
    examplePath: string,
    srcFile: string,
    includeTypes: boolean,
    gridOptionsTypes: Record<string, GridOptionsType>,
    html: string,
    providedExamples
) {
    const domTree = cheerio.load(html, null, false);
    domTree('style').remove();
    const domEventHandlers = extractEventHandlers(domTree, recognizedDomEvents);

    const tsTree = includeTypes ? parseFile(srcFile) : parseFile(readAsJsFile(srcFile, 'vanilla'));
    const gridOpsTypeLookup = includeTypes ? (prop) => gridOptionsTypes[prop] : () => undefined;

    const tsCollectors: Collector[] = [];
    const tsGridOptionsCollectors: Collector[] = [];
    const tsOnReadyCollectors: Collector[] = [];
    const registered = ['gridOptions', 'gridApi'];

    // handler is the function name, params are any function parameters
    domEventHandlers.forEach(([_, handler, params]) => {
        if (registered.indexOf(handler) > -1) {
            return;
        }

        registered.push(handler);

        // one of the event handlers extracted earlier (onclick, onchange etc)
        tsCollectors.push({
            matches: (node) => tsNodeIsFunctionWithName(node, handler),
            apply: (bindings, node) => {
                bindings.externalEventHandlers.push({
                    name: handler,
                    params: params,
                    body: tsGenerate(node, tsTree),
                });
            },
        });
    });

    // anything not marked as "inScope" and not handled above in the eventHandlers is considered an unused/util method
    tsCollectors.push({
        matches: (node) => tsNodeIsUnusedFunction(node, registered),
        apply: (bindings, node) => {
            const util = tsGenerate(node, tsTree);
            bindings.utils.push(util);
        },
    });

    tsCollectors.push({
        matches: (node) => tsNodeIsTypeDeclaration(node),
        apply: (bindings, node) => {
            const declaration = tsGenerate(node, tsTree);
            bindings.declarations.push(declaration);
        },
    });

    // For React we need to identify the external dependencies for callbacks to prevent stale closures
    const GLOBAL_DEPS = new Set(['console', 'document', 'Error', 'this', 'gridApi', 'gridOptions']);
    tsCollectors.push({
        matches: (node) => tsNodeIsTopLevelFunction(node),
        apply: (bindings, node: ts.SignatureDeclaration) => {
            const body = (node as any).body;

            const allVariables = new Set(body ? findAllVariables(body) : []);
            if (node.parameters && node.parameters.length > 0) {
                node.parameters.forEach((p) => {
                    allVariables.add(p.name.getText());
                });
            }

            const deps = body ? findAllAccessedProperties(body) : [];
            const allDeps = deps.filter((id: string) => {
                // Ignore locally defined variables
                const isVariable = allVariables.has(id);
                // Let's assume that all caps are constants so should be ignored, i.e KEY_UP
                const isCapsConst = id === id.toUpperCase();
                return !isVariable && !isCapsConst && !GLOBAL_DEPS.has(id);
            });
            if (allDeps.length > 0) {
                bindings.callbackDependencies[node.name.getText()] = [...new Set(allDeps)];
            }
        },
    });

    // anything vars not handled above in the eventHandlers is considered an unused/util method
    tsCollectors.push({
        matches: (node) => tsNodeIsTopLevelVariable(node, registered),
        apply: (bindings, node) => bindings.utils.push(tsGenerate(node.parent, tsTree)),
    });

    // extract the Http Request call
    tsOnReadyCollectors.push({
        matches: tsNodeIsSimpleFetchRequest,
        apply: (bindings, node) => {
            const url = node.arguments[0].getText();
            const callback = tsGenerate(node.parent.parent.parent.parent.arguments[0].body, tsTree).replace(
                /gridOptions/g,
                'params'
            );
            bindings.data = { url, callback };
        },
    });

    // extract onready
    tsCollectors.push({
        matches: tsNodeIsDocumentContentLoaded,
        apply: (bindings, node) => {
            return tsCollect(node.arguments[1].body, bindings, tsOnReadyCollectors);
        },
    });

    // all onXXX will be handled here
    // note: gridOptions = { onGridSizeChanged = function() {}  handled below
    _ALL_EVENTS.forEach((eventName) => {
        const onEventName = 'on' + eventName.replace(/^\w/, (w) => w.toUpperCase());
        registered.push(onEventName);

        tsCollectors.push({
            matches: (node) => tsNodeIsFunctionWithName(node, onEventName),
            apply: (bindings, node) => {
                bindings.eventHandlers.push({
                    name: eventName,
                    handlerName: onEventName,
                    handler: tsGenerate(node, tsTree),
                });
            },
        });
    });

    _ALL_EVENTS.forEach((eventName) => {
        const onEventName = 'on' + eventName.replace(/^\w/, (w) => w.toUpperCase());
        tsGridOptionsCollectors.push({
            // onGridReady is handled separately
            matches: (node) => tsNodeIsPropertyWithName(node, onEventName) && onEventName !== 'onGridReady',
            apply: (bindings, node: ts.PropertyAssignment) => {
                // Find any inline arrow functions or functions for events and convert to external function definition
                const eventHandler = tsGenerate(node.initializer, tsTree);
                const functionHandler = ts.isArrowFunction(node.initializer)
                    ? eventHandler
                          // (event: RowEditingStoppedEvent) => {
                          .replace(/^(\(.*?\)) (=>) {/, `function ${onEventName} $1 {`)
                          // event => {}
                          .replace(/^(\w*?) (=>) {/, `function ${onEventName} ($1) {`)
                    : eventHandler.replace('function', 'function ' + onEventName);

                bindings.eventHandlers.push({
                    name: eventName,
                    handlerName: onEventName,
                    handler: functionHandler,
                });
            },
        });
    });

    FUNCTION_PROPERTIES.forEach((functionName) => {
        registered.push(functionName);

        tsCollectors.push({
            matches: (node: ts.Node) => tsNodeIsFunctionWithName(node, functionName),
            apply: (bindings, node: ts.NamedDeclaration) => {
                const methodText = tsGenerate(node, tsTree);
                bindings.instanceMethods.push(methodText);
                bindings.properties.push({ name: functionName, value: null, typings: gridOpsTypeLookup(functionName) });
            },
        });
    });

    const tsExtractColDefsStr = (node: any): string => {
        const copyOfColDefs = [];

        // for each column def
        for (let columnDefIndex = 0; columnDefIndex < node.elements.length; columnDefIndex++) {
            const columnDef = node.elements[columnDefIndex];

            if (!ts.isObjectLiteralExpression(columnDef)) {
                // if we find any column defs that aren't objects (e.g. are references to objects instead), give up
                return;
            }

            // for each col def property
            const props = [];
            for (
                let colDefPropertyIndex = 0;
                colDefPropertyIndex < columnDef.properties.length;
                colDefPropertyIndex++
            ) {
                const columnDefProperty: any = columnDef.properties[colDefPropertyIndex];

                if (columnDefProperty.name.getText() === 'children') {
                    const children = tsExtractColDefsStr(columnDefProperty.initializer);
                    props.push(`children: ${children}`);
                } else {
                    props.push(`${tsConvertFunctionsIntoStringsStr(columnDefProperty)}`);
                }
            }
            if (props.length > 0) {
                const propStr = props.length === 1 ? `{ ${props.join()} }` : `{\n        ${props.join(',\n    ')} }`;
                copyOfColDefs.push(propStr);
            }
        }
        return `[${copyOfColDefs.join(',\n    ')}]`;
    };

    const tsArrayStr = (node: any): string => {
        const copyOfArray = [];

        // for each item in the array
        for (let index = 0; index < node.elements.length; index++) {
            const item = node.elements[index];

            if (!ts.isObjectLiteralExpression(item)) {
                copyOfArray.push(tsGenerate(item, tsTree));
            } else {
                // for each property
                const props = [];
                for (let colDefPropertyIndex = 0; colDefPropertyIndex < item.properties.length; colDefPropertyIndex++) {
                    const columnDefProperty: any = item.properties[colDefPropertyIndex];
                    props.push(`${tsConvertFunctionsIntoStringsStr(columnDefProperty)}`);
                }
                if (props.length > 0) {
                    const propStr =
                        props.length === 1 ? `{ ${props.join()} }` : `{\n        ${props.join(',\n    ')} }`;
                    copyOfArray.push(propStr);
                }
            }
        }
        return `[${copyOfArray.join(',\n    ')}]`;
    };

    const tsConvertFunctionsIntoStringsStr = (property: any): string => {
        if (ts.isIdentifier(property.initializer)) {
            return `${property.name.text}: 'AG_LITERAL_${property.initializer.escapedText}'`;
        } else if (ts.isFunctionLike(property.initializer)) {
            const func = tsGenerate(property.initializer, tsTree);
            const escaped = func.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n');
            return `${property.name.text}: "AG_FUNCTION_${escaped}"`;
        } else if (ts.isObjectLiteralExpression(property.initializer)) {
            const objProps = [];
            property.initializer.properties.forEach((p) => {
                objProps.push(tsConvertFunctionsIntoStringsStr(p));
            });

            const props =
                objProps.length === 1 ? `{ ${objProps.join(',\n    ')} }` : `{\n    ${objProps.join(',\n    ')}\n }`;
            return `${property.name.text} : ${props}`;
        } else if (ts.isArrayLiteralExpression(property.initializer)) {
            const result = tsArrayStr(property.initializer);
            return `${property.name.text} : ${result}`;
        }
        return tsGenerate(property, tsTree);
    };

    const tsExtractAndParseColDefs = (node) => {
        const colDefs = tsExtractColDefsStr(node);
        return colDefs || '';
    };

    PROPERTIES.forEach((propertyName) => {
        registered.push(propertyName);

        // grab global variables named as grid properties
        tsCollectors.push({
            matches: (node) => tsNodeIsGlobalVarWithName(node, propertyName),
            apply: (bindings, node) => {
                try {
                    if (processColDefsForFunctionalReactOrVue(propertyName, providedExamples)) {
                        if (ts.isVariableDeclaration(node) && ts.isArrayLiteralExpression(node.initializer)) {
                            bindings.parsedColDefs = tsExtractAndParseColDefs(node.initializer);
                        }
                    }
                    const code = tsGenerate(node.initializer, tsTree);
                    bindings.properties.push({
                        name: propertyName,
                        value: code,
                        typings: gridOpsTypeLookup(propertyName),
                    });
                } catch (e) {
                    console.error('We failed generating', node, node.declarations[0].id);
                    throw e;
                }
            },
        });

        tsGridOptionsCollectors.push({
            matches: (node: ts.Node) => tsNodeIsPropertyWithName(node, propertyName),
            apply: (bindings, node: ts.PropertyAssignment) => {
                if (processColDefsForFunctionalReactOrVue(propertyName, providedExamples)) {
                    const parent = node;
                    if (ts.isPropertyAssignment(parent) && parent.initializer) {
                        const initializer = parent.initializer;
                        if (ts.isArrayLiteralExpression(initializer)) {
                            bindings.parsedColDefs = tsExtractAndParseColDefs(initializer);
                        }
                    }
                }
                if (processComponentsForVue(propertyName, providedExamples)) {
                    const compsNode = node.initializer;
                    if (ts.isObjectLiteralExpression(compsNode)) {
                        for (const componentDefinition of compsNode.properties) {
                            const comp = componentDefinition as any;
                            if (!ts.isCallExpression(comp.initializer) && !ts.isFunctionExpression(comp.initializer)) {
                                bindings.components.push({
                                    name: comp.name.getText(),
                                    value: comp.initializer.getText(),
                                });
                            }
                        }
                    }
                }
                if (processVueProperties(propertyName, providedExamples)) {
                    if (ts.isObjectLiteralExpression(node.initializer)) {
                        const props = [];
                        for (const property of node.initializer.properties) {
                            if (ts.isArrayLiteralExpression((property as any).initializer)) {
                                props.push(`${property.name.getText()}:${tsArrayStr((property as any).initializer)}`);
                            } else {
                                props.push(`${property.name.getText()}:${(property as any).initializer.getText()}`);
                            }
                        }
                        if (props.length > 0) {
                            const propStr =
                                props.length === 1 ? `{ ${props.join()} }` : `{\n        ${props.join(',\n    ')} }`;
                            bindings.vuePropertyBindings[propertyName] = propStr;
                        }
                    }
                }
                if (
                    processDefaultColumnDefForVue(propertyName, providedExamples) &&
                    node.initializer &&
                    ts.isObjectLiteralExpression(node.initializer)
                ) {
                    bindings.defaultColDef = tsGenerate(node.initializer, tsTree);
                }

                if (
                    processAutoGroupColumnDefForVue(propertyName, providedExamples) &&
                    node.initializer &&
                    ts.isObjectLiteralExpression(node.initializer)
                ) {
                    bindings.autoGroupColumnDef = tsGenerate(node.initializer, tsTree);
                }
                if (processGlobalComponentsForVue(propertyName, providedExamples) && ts.isIdentifier(node)) {
                    bindings.globalComponents.push(tsGenerate(node, tsTree));
                }

                bindings.properties.push({
                    name: propertyName,
                    value: tsGenerate(node.initializer, tsTree),
                    typings: gridOpsTypeLookup(propertyName),
                });
            },
        });
    });

    tsGridOptionsCollectors.push({
        matches: (node) => tsNodeIsPropertyWithName(node, 'onGridReady'),
        apply: (bindings, node: ts.PropertyAssignment) => {
            if (node.initializer) {
                bindings.onGridReady = tsGenerate((node.initializer as any).body, tsTree).replace(
                    /gridOptions/g,
                    'params'
                );
            } else {
                console.error(node.getText());
            }
        },
    });

    // gridOptionsCollectors captures all events, properties etc that are related to gridOptions
    tsCollectors.push({
        matches: (node) => tsNodeIsGlobalVarWithName(node, 'gridOptions'),
        apply: (bindings, node) => {
            if (node.type?.typeArguments?.length > 0) {
                bindings.tData = node.type.typeArguments[0].getText();
            }
            bindings = tsCollect(node.initializer, bindings, tsGridOptionsCollectors, false);
            return bindings;
        },
    });

    /*
     * externalEventHandlers -> onclick, onchange etc in index.html
     * eventHandlers -> grid related events
     * properties -> grid related properties
     * components -> name value pair of component name to actual component (ie name: myCustomCell, value: CustomCellRenderer)
     * vuePropertyBindings => vue specific property bindings that can be safely parsed by the vue generators
     * parsedColDefs -> col defs with function values replaced with tokenised strings - for the functional react example generator
     * utils -> none grid related methods/variables (or methods that don't reference the gridApi) (i.e. non-instance)
     * instanceMethods -> methods that are either marked as "inScope" or ones that reference the gridApi
     * onGridReady -> any matching onGridReady method
     * data -> url: dataUrl, callback: callback, http calls etc
     * callbackDependencies -> lookup of function name to function external deps for react useCallback
     * declarations -> Typescript examples add declarations when working with globally defined javascript functions / variables
     * imports -> imports used by Typescript code
     */
    const tsBindings: ParsedBindings = tsCollect(
        tsTree,
        {
            eventHandlers: [],
            properties: [],
            components: [],
            vuePropertyBindings: {},
            defaultColDef: null,
            autoGroupColumnDef: null,
            globalComponents: [],
            parsedColDefs: '',
            instanceMethods: [],
            externalEventHandlers: [],
            utils: [],
            declarations: [],
            callbackDependencies: {},
        } as ParsedBindings,
        tsCollectors
    );

    const gridElement = domTree('#myGrid').replaceWith(templatePlaceholder);
    const inlineClass = gridElement.attr('class');
    const inlineHeight = gridElement.css('height');
    const inlineWidth = gridElement.css('width');

    const inlineGridStyles: InlineGridStyles = {
        width: parseInt(inlineWidth) ? inlineWidth : '100%',
        height: parseInt(inlineHeight) ? inlineHeight : '100%',
        className: inlineClass || undefined,
    };

    tsBindings.template = domTree.html().replace(/<br>/g, '<br />');
    tsBindings.imports = extractImportStatements(tsTree);
    tsBindings.typeDeclares = extractTypeDeclarations(tsTree);
    tsBindings.classes = extractClassDeclarations(tsTree);
    tsBindings.interfaces = extractInterfaces(tsTree);
    tsBindings.exampleName = examplePath;
    tsBindings.moduleRegistration = extractModuleRegistration(tsTree);
    tsBindings.inlineGridStyles = inlineGridStyles;

    return tsBindings;
}

export function parser(
    examplePath,
    srcFile,
    html,
    providedExamples,
    gridOptionsTypes: Record<string, GridOptionsType>
) {
    const typedBindings = internalParser(examplePath, srcFile, true, gridOptionsTypes, html, providedExamples);
    const bindings = internalParser(examplePath, srcFile, false, gridOptionsTypes, html, providedExamples);
    // We need to copy the imports from the typed bindings to the non-typed bindings
    bindings.imports = typedBindings.imports;
    return { bindings, typedBindings };
}

export default parser;

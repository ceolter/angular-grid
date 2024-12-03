import type { ExampleConfig, ParsedBindings } from '../types';
import { templatePlaceholder } from './grid-vanilla-src-parser';
import { getFunctionName, removeFunctionKeyword } from './parser-utils';
import { convertTemplate } from './vue-utils';

export const GRID_WIDE_COMPONENTS = [
    'loadingCellRenderer',
    'loadingOverlayComponent',
    'noRowsOverlayComponent',
    'fullWidthCellRenderer',
    'detailCellRenderer',
    'dragAndDropImageComponent',
];

export const GRID_COMPONENTS = [
    'groupRowRenderer',
    'groupRowInnerRenderer',
    'loadingCellRenderer',
    'loadingOverlayComponent',
    'noRowsOverlayComponent',
    'dragAndDropImageComponent',
    'dateComponent',
    'statusPanel',
    'cellRenderer',
    'cellEditor',
    'filter',
    'floatingFilterComponent',
    'headerComponent',
    'headerGroupComponent',
    'cellRenderer',
    'tooltipComponent',
    'statusPanel',
    'toolPanel',
    'menuItem',
];

export const PARAMS_PROPERTIES = ['cellEditorParams', 'filterParams'];

export const OVERRIDABLE_AG_COMPONENTS = [
    'agDragAndDropImage',
    'agDateInput',
    'agColumnHeader',
    'agColumnGroupHeader',
    'agLoadingCellRenderer',
    'agSkeletonCellRenderer',
    'agLoadingOverlay',
    'agNoRowsOverlay',
    'agTextCellEditor',
    'agDetailCellRenderer',
];

export function isExternalVueFile(componentFileNames, component) {
    return (
        componentFileNames.length > 0 &&
        componentFileNames.some((fileName) => fileName.toUpperCase().includes(component.toUpperCase()))
    );
}

export function getTemplate(bindings: ParsedBindings, exampleConfig: ExampleConfig, attributes: string[]): string {
    const { inlineGridStyles } = bindings;
    const style = exampleConfig.noStyle
        ? ''
        : `style="width: ${inlineGridStyles.width}; height: ${inlineGridStyles.height};"`;

    const className = inlineGridStyles.className ? `class="${inlineGridStyles.className}"` : '';

    const agGridTag = `<ag-grid-vue
    ${exampleConfig.myGridReference ? 'id="myGrid"' : ''}
    ${style}
    ${className}
    @grid-ready="onGridReady"
    ${attributes.join('\n    ')}></ag-grid-vue>`;

    const template = bindings.template ? bindings.template.replace(templatePlaceholder, agGridTag) : agGridTag;

    return convertTemplate(template);
}

export function getAllMethods(bindings: ParsedBindings): [string[], string[], string[], string[]] {
    const eventHandlers = bindings.eventHandlers
        .filter((event) => event.name != 'onGridReady')
        .map((event) => event.handler)
        .map(removeFunctionKeyword);

    const externalEventHandlers = bindings.externalEventHandlers.map((event) => event.body).map(removeFunctionKeyword);
    const instanceMethods = bindings.instanceMethods.map(removeFunctionKeyword);

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

    return [eventHandlers, externalEventHandlers, instanceMethods, utilFunctions];
}

export function isComponent(property) {
    return GRID_COMPONENTS.indexOf(property) !== -1;
}

export function isParamsProperty(property) {
    return PARAMS_PROPERTIES.indexOf(property) !== -1;
}

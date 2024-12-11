import * as JSON5 from 'json5';

import { _ALL_EVENTS } from '../_copiedFromCore/eventTypes';
import { _FUNCTION_GRID_OPTIONS } from '../_copiedFromCore/propertyKeys';
import type { ParsedBindings } from '../types';
import {
    DARK_INTEGRATED_END,
    DARK_INTEGRATED_START,
    getFunctionName,
    getIntegratedDarkModeCode,
    recognizedDomEvents,
} from './parser-utils';

const toTitleCase = (value: string) => value[0].toUpperCase() + value.slice(1);
const toCamelCase = (value: string) => value.replace(/(?:-)(\w)/g, (_, c: string) => (c ? c.toUpperCase() : ''));

function convertStyles(code: string) {
    return code.replace(/style=['"](.+?);?['"]/g, (_, styles) => {
        const parsed = styles.split(';').reduce((obj, declaration) => {
            const [property, value] = declaration.split(':');
            obj[toCamelCase(property.trim())] = value.trim();
            return obj;
        }, {});

        return `style={${JSON.stringify(parsed)}}`;
    });
}

export function convertTemplate(template: string) {
    // React events are case sensitive, so need to ensure casing is correct
    const caseSensitiveEvents = {
        dragover: 'onDragOver',
        dragstart: 'onDragStart',
    };

    recognizedDomEvents.forEach((event) => {
        const jsEvent = caseSensitiveEvents[event] || `on${toTitleCase(event)}`;
        const matcher = new RegExp(`on${event}="(\\w+)\\((.*?)\\)"`, 'g');

        template = template.replace(matcher, `${jsEvent}={() => this.$1($2)}`);
    });

    template = template
        .replace(/,\s+event([),])/g, '$1')
        .replace(/<input (.+?[^=])>/g, '<input $1 />')
        .replace(/<input (.*)value=/g, '<input $1defaultValue=')
        .replace(/ class=/g, ' className=')
        .replace(/ for=/g, ' htmlFor=')
        .replace(/ <option (.*)selected=""/g, '<option $1selected={true}');

    return convertStyles(template);
}

export function convertFunctionalTemplate(template: string) {
    // React events are case sensitive, so need to ensure casing is correct
    const caseSensitiveEvents = {
        dragover: 'onDragOver',
        dragstart: 'onDragStart',
    };

    recognizedDomEvents.forEach((event) => {
        const jsEvent = caseSensitiveEvents[event] || `on${toTitleCase(event)}`;
        const matcher = new RegExp(`on${event}="(\\w+)\\((.*?)\\)"`);

        // if an action takes params then we'll convert it - ie onClick={() => action(params)}
        // otherwise we simplify it to onClick={action}
        let meta;
        do {
            meta = matcher.exec(template);
            if (meta) {
                // 0 original call, 1 function name, 2 arguments
                if (meta[2]) {
                    template = template.replace(matcher, `${jsEvent}={() => $1($2)}`);
                } else {
                    template = template.replace(matcher, `${jsEvent}={$1}`);
                }
            }
        } while (meta);

        template = template.replace(matcher, `${jsEvent}={() => $1($2)}`);
    });

    template = template
        .replace(/,\s+event([),])/g, '$1')
        .replace(/<input (.+?[^=])>/g, '<input $1 />')
        .replace(/<input (.*)value=/g, '<input $1defaultValue=')
        .replace(/ class=/g, ' className=')
        .replace(/ for=/g, ' htmlFor=')
        .replace(/ <option (.*)selected=""/g, '<option $1selected={true}');

    return convertStyles(template);
}

export const getImport = (filename: string) => `import ${toTitleCase(filename.split('.')[0])} from './${filename}';`;

export const getValueType = (value: string) => {
    let type = 'object';
    try {
        type = typeof JSON5.parse(value);
    } catch (_) {
        // if it's something we can't parse we'll assume an object
    }
    return type;
};

export const convertFunctionToConstCallback = (code: string, callbackDependencies: Record<string, any>) => {
    const functionName = getFunctionName(code);
    return `${code.replace(/function\s+([^(\s]+)\s*\(([^)]*)\)/, 'const $1 = useCallback(($2) =>')}, [${callbackDependencies[functionName] || ''}])`;
};
export const convertFunctionToConstCallbackTs = (code: string, callbackDependencies: Record<string, any>) => {
    const functionName = getFunctionName(code); //:(\s+[^\{]*)
    return `${code.replace(/function\s+([^(\s]+)\s*\(([^)]*)\)(:?\s+[^{]*)/, 'const $1 = useCallback(($2) $3 =>')}, [${callbackDependencies[functionName] || ''}])`;
};

export const EventAndCallbackNames = new Set([..._FUNCTION_GRID_OPTIONS, ..._ALL_EVENTS]);

export function addChartsDarkModeIfRequired(bindings: ParsedBindings, imports: string[], useTypescript: boolean) {
    let darkModeWithGridRef = getIntegratedDarkModeCode(bindings.exampleName, useTypescript, 'gridRef.current?.api');
    if (darkModeWithGridRef) {
        const reactImportIdx = imports.findIndex((i) => i.includes('useState'));
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
    return darkModeWithGridRef;
}

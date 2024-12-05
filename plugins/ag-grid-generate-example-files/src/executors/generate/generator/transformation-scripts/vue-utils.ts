import type { EventHandler, Property } from '../types';
import { recognizedDomEvents } from './parser-utils';
import { toKebabCase, toTitleCase } from './string-utils';

export const toInput = (property: Property) => `:${property.name}="${property.name}"`;
export const toConst = (property: Property) => `:${property.name}="${property.value}"`;
export const toOutput = (event: EventHandler) => `@${toKebabCase(event.name)}="${event.handlerName}"`;
export const toMember = (property: Property) => `${property.name}: null`;
export const toRef = (property: Property) => `const ${property.name} = ref(null)`;
export const toComponent = (property: Property) => `'${property.name}': ${property.name}`;

export const quoteVueComponents = (value, componentFileNames: any[]) => {
    if (componentFileNames) {
        componentFileNames
            .map((componentFileName) => getComponentName(componentFileName, 'Vue', ''))
            .forEach((component) => {
                value = value.replaceAll(component, `'${component}'`);
            });
    }
    return value;
};

export const toMemberWithType = (property: Property, componentFileNames: any[]) => {
    const value = quoteVueComponents(property.value, componentFileNames);
    if (property.typings) {
        const typing = property.typings.typeName;
        // Don't include obvious types
        if (!['number', 'string', 'boolean'].includes(typing)) {
            let typeName = property.typings.typeName;
            if (property.name === 'columnDefs') {
                // Special logic for columnDefs as its a popular property
                typeName = value.includes('children') ? '(ColDef | ColGroupDef)[]' : 'ColDef[]';
            }
            return `const ${property.name} = ref<${typeName}>(${value});`;
        }
    }
    return `const ${property.name} = ref(${value});`;
};

export function toAssignment(property: Property, componentFileNames: any[]): string {
    // convert to arrow functions
    const value = quoteVueComponents(property.value.replace(/function\s*\(([^)]+)\)/, '($1) =>'), componentFileNames);

    return `${property.name}.value = ${value}`;
}

export const getComponentName = (filename: string, tokenReplace, replaceValue) => {
    let componentName = filename.split('.')[0];
    if (tokenReplace) {
        componentName = componentName.replace(tokenReplace, replaceValue);
    }

    return toTitleCase(componentName);
};
export function getImport(filename: string, tokenReplace, replaceValue) {
    return `import ${getComponentName(filename, tokenReplace, replaceValue)} from './${filename.replace('.ts', '')}';`;
}

export function indentTemplate(template: string, spaceWidth: number, start: number = 0) {
    let indent = start;
    return template
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => {
            const match = line.match(/^(<\w+)?[^/]*(\/>|<\/\w+>)?$/);
            const open = match?.[1] != null;
            const close = match?.[2] != null;

            if (!open && close) {
                indent -= 1;
            }

            const out = ' '.repeat(indent * spaceWidth) + line;

            if (open && !close) {
                indent += 1;
            }

            return out;
        })
        .join('\n');
}

export function convertTemplate(template: string) {
    recognizedDomEvents.forEach((event) => {
        template = template.replace(new RegExp(`on${event}=`, 'g'), `v-on:${event}=`);
    });

    template = template.replace(/\(event\)/g, '($event)').replace(/\(event\./g, '($event.');

    return indentTemplate(template, 2, 2);
}

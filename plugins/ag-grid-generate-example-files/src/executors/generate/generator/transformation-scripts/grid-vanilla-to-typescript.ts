import type { ParsedBindings } from '../types';
import {
    addBindingImports,
    addGenericInterfaceImport,
    findLocaleImport,
    getIntegratedDarkModeCode,
} from './parser-utils';
import { toTitleCase } from './string-utils';

export function getImport(filename: string) {
    const componentName = filename.split('.')[0];
    return `import { ${toTitleCase(componentName)} } from './${componentName}';`;
}

function getPropertyInterfaces(properties) {
    let propTypesUsed = [];
    properties.forEach((prop) => {
        if (prop.typings?.typesToInclude?.length > 0) {
            propTypesUsed = [...propTypesUsed, ...prop.typings.typesToInclude];
        }
    });
    return [...new Set(propTypesUsed)];
}

function getModuleImports(bindings: ParsedBindings): string[] {
    const { imports: bindingImports, properties } = bindings;

    const imports = [];

    const propertyInterfaces = getPropertyInterfaces(properties);
    const bImports = [...(bindingImports || [])];
    bImports.push({
        module: `'ag-grid-community'`,
        isNamespaced: false,
        imports: [...propertyInterfaces],
    });

    if (bImports.length > 0) {
        addBindingImports(bImports, imports, false);
    }

    addGenericInterfaceImport(imports, bindings.tData, bindings);

    return imports;
}

function getImports(bindings: ParsedBindings): string[] {
    const imports = [];

    const localeImport = findLocaleImport(bindings.imports);
    if (localeImport) {
        imports.push(`import { ${localeImport.imports[0]} } from '@ag-grid-community/locale';`);
    }

    imports.push(...getModuleImports(bindings));

    return imports;
}

export function vanillaToTypescript(bindings: ParsedBindings, mainFilePath: string, tsFile: string): () => string {
    const { externalEventHandlers } = bindings;

    // attach external handlers to window
    let toAttach = '';
    if (externalEventHandlers?.length > 0) {
        const externalBindings = externalEventHandlers.map((e) => ` (<any>window).${e.name} = ${e.name};`);
        toAttach = [
            '\n',
            "if (typeof window !== 'undefined') {",
            '// Attach external event handlers to window so they can be called from index.html',
            ...externalBindings,
            '}',
        ].join('\n');
    }
    let unWrapped = tsFile
        // unwrap the setup code from the DOM loaded event as the DOM is loaded before the typescript file is transpiled.
        // Regex
        // (.*DOMContentLoaded.*)\n Match the line with DOMContentLoaded
        // (.|\n)*? Match the shortest number of lines until the next part matches (body of the event handler)
        // (\n}\)) Match a }) on a new line with no indentation
        .replace(/(.*DOMContentLoaded.*)\n((.|\n)*?)(\n}\))/g, '$2');

    if (unWrapped.includes('DOMContentLoaded')) {
        console.error('DomContentLoaded replace failed for', mainFilePath);
        throw Error('DomContentLoaded replace failed for ' + mainFilePath);
    }

    return () => {
        const importStrings = getImports(bindings);
        const formattedImports = `${importStrings.join('\n')}\n`;

        // Remove the original import statements
        unWrapped = unWrapped.replace(/import ((.|\n)*?)from.*\n/g, '');

        const result = `${formattedImports}${unWrapped} ${toAttach || ''} ${getIntegratedDarkModeCode(bindings.exampleName, true, 'gridApi') ?? ''}`;
        return result;
    };
}

if (typeof window !== 'undefined') {
    (<any>window).vanillaToTypescript = vanillaToTypescript;
}

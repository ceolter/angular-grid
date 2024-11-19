export interface SelectedModules {
    community: string[];
    enterprise: string[];
}

const TAB_SPACING = '    ';

const getCodeSnippet = (selectedModules: SelectedModules) => {
    const { community, enterprise } = selectedModules;
    const communityImportsString = community.length
        ? community
              .map((name) => {
                  return `${TAB_SPACING}${name},`;
              })
              .join('\n')
        : '';
    const enterpriseImportsString = enterprise.length
        ? enterprise.map((name) => `${TAB_SPACING}${name},`).join('\n')
        : '';
    const allModules = community
        .concat(enterprise)
        .map((name) => `${TAB_SPACING}${name},`)
        .join('\n');

    return `import { 
    ModuleRegistry,${communityImportsString ? `\n${communityImportsString}` : ''}
} from 'ag-grid-community';${
        enterpriseImportsString
            ? `\nimport {
${enterpriseImportsString}
} from 'ag-grid-enterprise';`
            : ''
    }

ModuleRegistry.registerModules([
${allModules}
]);`;
};

export function getModuleMappingsSnippet(selectedModules: SelectedModules): string | undefined {
    if (!selectedModules.community.length && !selectedModules.enterprise.length) {
        return;
    }

    return getCodeSnippet(selectedModules);
}

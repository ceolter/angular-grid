import type { Framework } from '@ag-grid-types';
import { throwDevWarning } from '@ag-website-shared/utils/throwDevWarning';

import type {
    ChildDocEntry,
    CodeEntry,
    Config,
    DocCode,
    DocEntryMap,
    DocProperties,
    InterfaceDocumentationModel,
    InterfaceEntry,
    Overrides,
} from '../types';
import {
    escapeGenericCode,
    formatJsDocString,
    getInterfaceWithGenericParams,
    sortAndFilterProperties,
    writeAllInterfaces,
} from './documentation-helpers';
import { getDefinitionType } from './getDefinitionType';
import { getDetailsCode } from './getDetailsCode';
import { getShowAdditionalDetails } from './getShowAdditionalDetails';
import { getInterfacesToWrite } from './interface-helpers';

interface Params {
    interfaceName: string;
    framework: Framework;
    overrides: Overrides;
    names: string[];
    exclude: string[];
    config: any;
    interfaceLookup: Record<string, any>;
    codeLookup: Record<string, any>;
}

export function getProperties({
    framework,
    interfaceName,
    interfaceData,
    interfaceLookup,
    overrides,
    names,
    exclude,
    codeData,
    config,
}: {
    framework: Framework;
    interfaceName: string;
    interfaceData: InterfaceEntry;
    interfaceLookup: Record<string, InterfaceEntry>;
    overrides: Overrides;
    names: string[];
    exclude: string[];
    codeData: CodeEntry;
    config: Config;
}): DocProperties {
    const props: any = {};
    let interfaceOverrides: Overrides = {} as Overrides;
    let interfaceOverridesMeta = {};

    if (!interfaceData?.type) {
        throw new Error(`Could not find interface '${interfaceName}' for interfaceDocumentation component!`);
    }

    if (Object.keys(overrides).length) {
        const { meta: interfaceMetaOverrides, ...interfaceOverridesData } = overrides[interfaceName];

        interfaceOverrides = interfaceOverridesData;
        interfaceOverridesMeta = interfaceMetaOverrides;
        if (!interfaceOverrides) {
            throw new Error(`override provided but does not contain expected section named: '${interfaceName}'!`);
        }
    }

    let typeProps: any[] = [];
    if (typeof interfaceData.type === 'string') {
        if (interfaceOverrides) {
            typeProps = Object.entries(interfaceOverrides);
        } else {
            // eslint-disable-next-line no-console
            console.error(`Please provide an override for type alias: ${interfaceName}`);
        }
    } else {
        typeProps = Object.entries(interfaceData.type);
    }

    sortAndFilterProperties(typeProps, framework).forEach(([k, v]) => {
        // interfaces include the ? as part of the name. We want to remove this for the <interface-documentation> component
        // Instead the type will be unioned with undefined as part of the propertyType
        let propNameOnly = k.replace('?', '');
        // for function properties like failCallback(): void; We only want the name failCallback part
        // as this is what is listed in the doc-interfaces.AUTO.json file
        propNameOnly = propNameOnly.split('(')[0];
        if (
            (names.length === 0 || names.includes(propNameOnly)) &&
            (exclude.length == 0 || !exclude.includes(propNameOnly)) &&
            (config.namePattern ? new RegExp(config.namePattern).test(propNameOnly) : true)
        ) {
            const docs = (interfaceData.docs && formatJsDocString(interfaceData.docs[k])) || '';
            if (!docs.includes('@deprecated')) {
                props[propNameOnly] = { description: docs || v, ...interfaceOverrides[propNameOnly] };
            }
        }
    });

    const orderedProps = {};
    const ordered = Object.entries<ChildDocEntry>(props)
        .sort(([, v1], [, v2]) => {
            // Put required props at the top as likely to be the most important
            if ((v1 as ChildDocEntry).isRequired == (v2 as ChildDocEntry).isRequired) {
                return 0;
            }
            return (v1 as ChildDocEntry).isRequired ? -1 : 1;
        })
        .sort((a, b) => {
            return config.sortAlphabetically ? (a[0] < b[0] ? -1 : 1) : 0;
        });

    const interfaceDeclaration = getInterfaceWithGenericParams(interfaceName, interfaceData.meta);
    const description =
        config.description == null
            ? `Properties available on the \`${interfaceDeclaration}\` interface.`
            : config.description;
    const meta = {
        displayName: interfaceName,
        description,
        ...interfaceOverridesMeta,
    };

    ordered.forEach(([name, definition]) => {
        const gridOpProp = codeData[name];
        const showAdditionalDetails = getShowAdditionalDetails({ name, definition, gridOpProp, interfaceLookup });

        const { type, propertyType } = getDefinitionType({
            name,
            definition,
            gridOpProp,
            interfaceLookup,
            isEvent: meta.isEvent,
            config,
        });
        const { interfaceHierarchyOverrides } = definition;
        const detailsCode = showAdditionalDetails
            ? getDetailsCode({
                  framework,
                  name,
                  type,
                  gridOpProp,
                  interfaceLookup,
                  interfaceHierarchyOverrides,
                  isApi: config.isApi,
              })
            : undefined;

        orderedProps[name] = {
            definition,
            detailsCode,
            gridOpProp,
            propertyType,
        };
    });

    const properties: DocEntryMap = {
        [interfaceName]: {
            ...orderedProps,
        },
    };

    return { type: 'properties', properties, meta };
}

function getDocCode({
    interfaceName,
    framework,
    exclude,
    interfaceLookup,
    config,
}: {
    interfaceName: string;
    framework: Framework;
    exclude: string[];
    interfaceLookup: Record<string, InterfaceEntry>;
    config: Config;
}): DocCode {
    const interfacesToWrite = getInterfacesToWrite({
        name: interfaceName,
        definition: interfaceName,
        interfaceLookup,
    });

    if (interfacesToWrite.length < 1) {
        throwDevWarning({
            message: `Could not find interface ${interfaceName} for interface-documentation component!`,
        });
    }
    const lines = [];
    lines.push(
        ...writeAllInterfaces(interfacesToWrite.slice(0, 1), framework, {
            lineBetweenProps: config.lineBetweenProps ?? true,
            hideName: config.hideName,
            exclude,
            applyOptionalOrdering: true,
        })
    );
    const code = escapeGenericCode(lines);

    return {
        type: 'code',
        code,
    };
}

export function getInterfaceDocumentationModel({
    framework,
    interfaceName,
    overrides,
    names = [],
    exclude = [],
    config = {},
    interfaceLookup,
    codeLookup,
}: Params): InterfaceDocumentationModel {
    const codeData = codeLookup[interfaceName];
    const model = config.asCode
        ? getDocCode({
              interfaceName,
              framework,
              exclude,
              interfaceLookup,
              config,
          })
        : getProperties({
              framework,
              interfaceName,
              interfaceData: interfaceLookup[interfaceName],
              interfaceLookup,
              overrides,
              names,
              exclude,
              codeData,
              config,
          });

    return model;
}

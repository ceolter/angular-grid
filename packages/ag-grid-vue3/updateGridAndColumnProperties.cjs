const replace = require('replace-in-file');
const fs = require('fs');
const { EOL } = require('os');
const ts = require('typescript');
const { _getCallbackForEvent, _PUBLIC_EVENTS } = require('ag-grid-community');
const { getFormatterForTS } = require('./../../scripts/formatAST');
const { _ALL_GRID_OPTIONS } = require('ag-grid-community');

const { formatNode, findNode, getFullJsDoc } = getFormatterForTS(ts);

const AG_CHART_TYPES = ['AgChartTheme', 'AgChartThemeOverrides'];

const skippableProperties = ['gridOptions', 'reactiveCustomComponents'];
const skippableEvents = [];
const skippableEventTypes = [];

function writeSortedLines(toWrite, result) {
    toWrite.sort((a, b) => {
        if (a.order < b.order) return -1;
        if (a.order > b.order) return 1;
        return 0;
    });

    toWrite.forEach((p) => {
        result += p.line;
    });
    // for readability
    result += EOL;
    return result;
}

function extractTypesFromNode(srcFile, node, { typeLookup, eventTypeLookup, publicEventLookup, docLookup }) {
    const kind = ts.SyntaxKind[node.kind];
    const name = node && node.name && node.name.escapedText;
    const returnType = node && node.type && node.type.getFullText();
    docLookup[name] = getFullJsDoc(node);
    if (kind === 'PropertySignature') {
        typeLookup[name] = returnType;
    } else if (kind === 'MethodSignature') {
        if (node.parameters && node.parameters.length > 0) {
            const methodParams = node.parameters.map((p) => `${p.name.escapedText}: ${formatNode(p.type, srcFile)}`);
            typeLookup[name] = `(${methodParams.join(', ')}) => ${returnType}`;
        } else {
            typeLookup[name] = `() => ${returnType}`;
        }

        if (publicEventLookup[name]) {
            // Events are assumed to have a single parameter
            if (node.parameters.length > 1) {
                throw new Error('Events with more than one parameter will cause issues to the frameworks!');
            }
            const typeName = formatNode(node.parameters[0].type, srcFile);
            eventTypeLookup[name] = typeName;
        }
    }
    ts.forEachChild(node, (n) =>
        extractTypesFromNode(srcFile, n, { typeLookup, eventTypeLookup, publicEventLookup, docLookup })
    );
}

function generatePropsAndEmits({ typeLookup, eventTypeLookup, docLookup }) {
    let propsToWrite = [];
    let propDefaultsToWrite = [];
    const typeKeysOrder = Object.keys(typeLookup);

    _ALL_GRID_OPTIONS.forEach((property) => {
        if (skippableProperties.includes(property)) return;

        const typeName = typeLookup[property];
        const inputType = getSafeType(typeName);
        let line = addDocLine(docLookup, property, '');
        let inputTypeWithGenerics = inputType;
        if (property === 'columnDefs') {
            // Use the Generic hint types for improved type checking by updating the columnDefs property
            inputTypeWithGenerics = inputType.replace('ColDef<TData>', 'TColDef');
        }

        line += `    ${property}?: ${inputTypeWithGenerics},${EOL}`;
        const order = typeKeysOrder.findIndex((p) => p === property);
        propsToWrite.push({ order, line });

        propDefaultsToWrite.push({ order, line: `        ${property}: undefined,${EOL}` });
    });

    const props = writeSortedLines(propsToWrite, '');
    const defaults = writeSortedLines(propDefaultsToWrite, '');

    const eventsToWrite = [];
    const eventsPropTypesWrite = [];
    const missingEventTypes = [];
    _PUBLIC_EVENTS.forEach((event) => {
        if (skippableEvents.includes(event)) return;

        const onEvent = _getCallbackForEvent(event);
        const eventType = eventTypeLookup[onEvent];
        if (eventType) {
            let line = addDocLine(docLookup, onEvent, '');
            line += `   '${event}': [event: ${eventType}],${EOL}`;
            const order = typeKeysOrder.findIndex((p) => p === onEvent);
            eventsToWrite.push({ order, line });
            eventsPropTypesWrite.push({
                order,
                line: `   '${kebabNameToAttrEventName(kebabProperty(event))}'?: ${eventType},${EOL}`,
            });
        } else {
            missingEventTypes.push(event);
        }
    });

    if (missingEventTypes.length > 0) {
        throw new Error(
            `The following events are missing type information: [${missingEventTypes.join()}]\n If this is a public event add it to the GridOptions interface. \n If a private event add it to _INTERNAL_EVENTS.\n`
        );
    }

    const events = writeSortedLines(eventsToWrite, '');
    const eventPropTypes = writeSortedLines(eventsPropTypesWrite, '');

    const typesToImport = extractNonEventTypes(
        { eventTypeLookup, typeLookup },
        skippableProperties,
        skippableEventTypes
    );
    const eventTypesToImport = extractEventTypes(
        { eventTypeLookup, typeLookup },
        skippableProperties,
        skippableEventTypes
    );
    return { code: props, types: typesToImport, eventTypes: eventTypesToImport, defaults, events, eventPropTypes };
}

function getSafeType(typeName) {
    let inputType = 'any';
    if (typeName) {
        inputType = applyUndefinedUnionType(typeName);
    }
    return inputType;
}

/**
 * Ensure that we correctly apply the undefined as a separate union type for complex type
 *  e.g isExternalFilterPresent: (() => boolean) | undefined = undefined;
 *  Without the brackets this changes the return type!
 */
function applyUndefinedUnionType(typeName) {
    const trimmed = typeName.trim();
    if (trimmed === 'any') {
        // Don't union type with any
        return trimmed;
    }
    if (trimmed.includes('=>')) {
        return `(${trimmed}) | undefined`;
    } else {
        return `${trimmed} | undefined`;
    }
}

function addDocLine(docLookup, property, result) {
    const doc = docLookup[property];
    if (doc) {
        // Get comments to line up properly
        result += `    ${doc.replace(/\s\*/g, `     *`)}${EOL}`;
    }
    return result;
}

function parseFile(sourceFile) {
    const src = fs.readFileSync(sourceFile, 'utf8');
    return ts.createSourceFile('tempFile.ts', src, ts.ScriptTarget.Latest, true);
}

function extractType(allTypes, typesToSkip) {
    let propertyTypes = [];
    const regex = new RegExp(/(?<!\w)(?:[A-Z]\w+)/, 'g');
    allTypes.forEach((tt) => {
        const matches = tt.matchAll(regex);
        for (const match of matches) {
            propertyTypes.push(Array.from(match, (m) => m));
        }
    });
    let expandedTypes = propertyTypes.flatMap((m) => m);

    const nonAgTypes = ['Partial', 'Document', 'HTMLElement', 'Function', 'TData'];
    expandedTypes = [...new Set(expandedTypes)]
        .filter((t) => !nonAgTypes.includes(t) && !AG_CHART_TYPES.includes(t))
        .sort();
    return expandedTypes.filter((t) => !typesToSkip.includes(t));
}

function extractNonEventTypes(context, propsToSkip = [], typesToSkip = []) {
    let allTypes = [
        ...Object.entries(context.typeLookup)
            .filter(([k]) => !propsToSkip.includes(k))
            .filter(([k]) => !context.eventTypeLookup[k])
            .map(([_, v]) => v),
    ];

    return extractType(allTypes, typesToSkip);
}

function extractEventTypes(context, propsToSkip = [], typesToSkip = []) {
    let allTypes = [...Object.values(context.eventTypeLookup)];

    return extractType(allTypes, typesToSkip);
}

function kebabNameToAttrEventName(kebabName) {
    // grid-ready for example would become onGrid-ready in Vue
    return `on${kebabName.charAt(0).toUpperCase()}${kebabName.substring(1, kebabName.length)}`;
}

function kebabProperty(property) {
    return property.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function getGridPropertiesAndEventsJs() {
    const gridOpsFile = '../ag-grid-community/src/entities/gridOptions.ts';
    const srcFile = parseFile(gridOpsFile);
    const gridOptionsNode = findNode('GridOptions', srcFile);

    // Apply @Output formatting to public events that are present in this lookup
    const publicEventLookup = {};
    _PUBLIC_EVENTS.forEach((e) => (publicEventLookup[_getCallbackForEvent(e)] = true));

    let context = {
        typeLookup: {},
        eventTypeLookup: {},
        docLookup: {},
        publicEventLookup,
    };
    extractTypesFromNode(srcFile, gridOptionsNode, context);

    const eventNameAsProps = _PUBLIC_EVENTS
        .filter((eventName) => !skippableEvents.includes(eventName))
        .map((eventName) => `        '${kebabNameToAttrEventName(kebabProperty(eventName))}': undefined`);

    return {
        ...generatePropsAndEmits(context),
        eventNameAsProps,
    };
}

const updateGridProperties = (getGridPropertiesAndEvents) => {
    // extract the grid properties & events and add them to our angular grid component
    const {
        code: gridPropertiesAndEvents,
        types,
        eventTypes,
        defaults,
        events,
        eventNameAsProps,
        eventPropTypes,
    } = getGridPropertiesAndEvents();
    const importsForProps = `import type {${EOL}    ${types.join(',' + EOL + '    ')}${EOL}} from 'ag-grid-community';`;
    const importsForEvents = `import type {${EOL}    ${eventTypes.join(',' + EOL + '    ')}${EOL}} from 'ag-grid-community';`;

    const optionsForUtils = {
        files: './src/components/utils.ts',
        from: [
            /(\/\/ @START_PROPS@)[^]*(\/\/ @END_PROPS@)/,
            /(\/\/ @START_IMPORTS@)[^]*(\/\/ @END_IMPORTS@)/,
            /(\/\/ @START_EVENTS_IMPORTS@)[^]*(\/\/ @END_EVENTS_IMPORTS@)/,
            /(\/\/ @START_DEFAULTS@)[^]*(\/\/ @END_DEFAULTS@)/,
            /(\/\/ @START_EVENT_PROPS@)[^]*(\/\/ @END_EVENT_PROPS@)/,
            /(\/\/ @START_EVENT_PROP_TYPES@)[^]*(\/\/ @END_EVENT_PROP_TYPES@)/,
        ],
        to: [
            `// @START_PROPS@${EOL}${gridPropertiesAndEvents}    // @END_PROPS@`,
            `// @START_IMPORTS@${EOL}${importsForProps}${EOL}// @END_IMPORTS@`,
            `// @START_EVENTS_IMPORTS@${EOL}${importsForEvents}${EOL}// @END_EVENTS_IMPORTS@`,
            `// @START_DEFAULTS@${EOL}${defaults}// @END_DEFAULTS@`,
            `// @START_EVENT_PROPS@${EOL}${eventNameAsProps.join(`,${EOL}`)}${EOL}// @END_EVENT_PROPS@`,
            `// @START_EVENT_PROP_TYPES@${EOL}${eventPropTypes}${EOL}// @END_EVENT_PROP_TYPES@`,
        ],
    };

    replace(optionsForUtils).then((filesChecked) => {
        const changes = filesChecked.filter((change) => change.hasChanged);
        console.log(
            `Grid Properties: ${changes.length === 0 ? 'No Modified files' : 'Modified files: ' + changes.map((change) => change.file).join(', ')}`
        );
    });

    const optionsForVue = {
        files: './src/components/AgGridVue.vue',
        from: [/(\/\/ @START_IMPORTS@)[^]*(\/\/ @END_IMPORTS@)/],
        to: [`// @START_IMPORTS@${EOL}${importsForEvents}${EOL}// @END_IMPORTS@`],
    };

    replace(optionsForVue).then((filesChecked) => {
        const changes = filesChecked.filter((change) => change.hasChanged);
        console.log(
            `Grid Properties: ${changes.length === 0 ? 'No Modified files' : 'Modified files: ' + changes.map((change) => change.file).join(', ')}`
        );
    });
};

const updatePropertiesBuilt = () => {
    updateGridProperties(getGridPropertiesAndEventsJs);
};

console.log(`--------------------------------------------------------------------------------`);
console.log(`Generate Vue Component Input / Outputs...`);
console.log('Using Typescript version: ', ts.version);

updatePropertiesBuilt();

console.log(`--------------------------------------------------------------------------------`);

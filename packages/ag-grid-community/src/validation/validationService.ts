import type { ApiFunction, ApiFunctionName } from '../api/iApiFunction';
import type { NamedBean } from '../context/bean';
import { BeanStub } from '../context/beanStub';
import type { BeanCollection, UserComponentName } from '../context/context';
import type { ColDef, ColGroupDef } from '../entities/colDef';
import type { GridOptions } from '../entities/gridOptions';
import { INITIAL_GRID_OPTION_KEYS } from '../gridOptionsInitial';
import type { PropertyChangedSource } from '../gridOptionsService';
import type { RowNodeEventType } from '../interfaces/iRowNode';
import type { DefaultMenuItem } from '../interfaces/menuItem';
import { _areModulesGridScoped } from '../modules/moduleRegistry';
import { _warnOnce } from '../utils/function';
import { _fuzzySuggestions } from '../utils/fuzzyMatch';
import type { IconName, IconValue } from '../utils/icon';
import { validateApiFunction } from './apiFunctionValidator';
import type { ErrorId, GetErrorParams } from './errorMessages/errorText';
import { getError } from './errorMessages/errorText';
import { _error, _warn, provideValidationServiceLogger } from './logging';
import { COL_DEF_VALIDATORS } from './rules/colDefValidations';
import { GRID_OPTIONS_VALIDATORS } from './rules/gridOptionsValidations';
import { DEPRECATED_ICONS_V33, ICON_MODULES, ICON_VALUES } from './rules/iconValidations';
import { MENU_ITEM_MODULES } from './rules/menuItemValidations';
import { USER_COMP_MODULES } from './rules/userCompValidations';
import type { DependentValues, OptionsValidation, OptionsValidator, RequiredOptions } from './validationTypes';

export class ValidationService extends BeanStub implements NamedBean {
    beanName = 'validation' as const;

    private gridOptions: GridOptions;

    public wireBeans(beans: BeanCollection): void {
        this.gridOptions = beans.gridOptions;
        provideValidationServiceLogger(this);
    }

    public postConstruct(): void {
        this.processGridOptions(this.gridOptions);
    }

    public warnOnInitialPropertyUpdate(source: PropertyChangedSource, key: string): void {
        if (source === 'api' && (INITIAL_GRID_OPTION_KEYS as any)[key]) {
            _warn(22, { key });
        }
    }

    public processGridOptions(options: GridOptions): void {
        this.processOptions(options, GRID_OPTIONS_VALIDATORS());
    }

    public validateApiFunction<TFunctionName extends ApiFunctionName>(
        functionName: TFunctionName,
        apiFunction: ApiFunction<TFunctionName>
    ): ApiFunction<TFunctionName> {
        return validateApiFunction(functionName, apiFunction, this.beans);
    }

    public missingUserComponent(
        propertyName: string,
        componentName: string,
        agGridDefaults: { [key in UserComponentName]?: any },
        jsComps: { [key: string]: any }
    ): void {
        const moduleForComponent = USER_COMP_MODULES[componentName as UserComponentName];
        if (moduleForComponent) {
            this.gos.assertModuleRegistered(
                moduleForComponent,
                `AG Grid '${propertyName}' component: ${componentName}`
            );
        } else {
            _warn(101, {
                propertyName,
                componentName,
                agGridDefaults,
                jsComps,
            });
        }
    }
    public checkRowEvents(eventType: RowNodeEventType): void {
        if (DEPRECATED_ROW_NODE_EVENTS.has(eventType)) {
            _warn(10, { eventType });
        }
    }

    public validateIcon(iconName: IconName): void {
        if (DEPRECATED_ICONS_V33.has(iconName)) {
            _warn(43, { iconName });
        }
        if (ICON_VALUES[iconName as IconValue]) {
            // directly referencing icon
            return;
        }
        const moduleName = ICON_MODULES[iconName];
        if (moduleName) {
            _error(200, {
                reasonOrId: `icon '${iconName}'`,
                moduleName,
                gridScoped: _areModulesGridScoped(),
                gridId: this.beans.context.getGridId(),
                rowModelType: this.gos.get('rowModelType'),
                additionalText: 'Alternatively, use the CSS icon name directly.',
            });
            return;
        }
        _warn(134, { iconName });
    }

    public validateMenuItem(key: string): void {
        const moduleName = MENU_ITEM_MODULES[key as DefaultMenuItem];
        if (moduleName) {
            this.gos.assertModuleRegistered(moduleName, `menu item '${key}'`);
        }
    }

    public isProvidedUserComp(compName: string): boolean {
        return !!USER_COMP_MODULES[compName as UserComponentName];
    }

    public validateColDef(colDef: ColDef | ColGroupDef, colId: string): void {
        if (!this.beans.dataTypeSvc?.isColPendingInference(colId)) {
            this.processOptions(colDef, COL_DEF_VALIDATORS());
        }
    }

    private processOptions<T extends object>(options: T, validator: OptionsValidator<T>): void {
        const { validations, deprecations, allProperties, propertyExceptions, objectName, docsUrl } = validator;

        if (allProperties && this.gridOptions.suppressPropertyNamesCheck !== true) {
            this.checkProperties(
                options,
                [...(propertyExceptions ?? []), ...Object.keys(deprecations)],
                allProperties,
                objectName,
                docsUrl
            );
        }

        const warnings = new Set<string>();

        const getRules = (key: keyof T): OptionsValidation<T> | undefined => {
            const rulesOrGetter = validations[key];
            if (!rulesOrGetter) {
                return;
            } else if (typeof rulesOrGetter === 'function') {
                const fromGetter = rulesOrGetter(options, this.gridOptions, this.beans);
                if (!fromGetter) {
                    return;
                }

                // this is a sub validator.
                if ('objectName' in fromGetter) {
                    const value = options[key];
                    if (Array.isArray(value)) {
                        value.forEach((item) => {
                            this.processOptions(item, fromGetter);
                        });
                        return;
                    }
                    this.processOptions(options[key] as any, fromGetter);
                    return;
                }

                return fromGetter;
            } else {
                return rulesOrGetter;
            }
        };

        const optionKeys = Object.keys(options) as (keyof T)[];
        optionKeys.forEach((key: keyof T) => {
            const deprecation = deprecations[key];
            if (deprecation) {
                const { message, version } = deprecation;
                warnings.add(`As of v${version}, ${String(key)} is deprecated. ${message ?? ''}`);
            }

            const value = options[key];
            if (value == null || value === false) {
                // false implies feature is disabled, don't validate.
                return;
            }

            const rules = getRules(key);
            if (!rules) {
                return;
            }

            const { module, dependencies, validate, supportedRowModels, expectedType } = rules;

            if (expectedType) {
                const actualType = typeof value;
                if (actualType !== expectedType) {
                    warnings.add(
                        `${String(key)} should be of type '${expectedType}' but received '${actualType}' (${value}).`
                    );
                    return;
                }
            }

            if (supportedRowModels) {
                const rowModel = this.gridOptions.rowModelType ?? 'clientSide';
                if (!supportedRowModels.includes(rowModel)) {
                    warnings.add(
                        `${String(key)} is not supported with the '${rowModel}' row model. It is only valid with: ${supportedRowModels.join(', ')}.`
                    );
                    return;
                }
            }

            if (module) {
                const modules = Array.isArray(module) ? module : [module];

                let allRegistered = true;
                modules.forEach((m) => {
                    if (!this.gos.assertModuleRegistered(m, String(key))) {
                        allRegistered = false;
                    }
                });

                if (!allRegistered) {
                    return;
                }
            }

            if (dependencies) {
                const warning = this.checkForRequiredDependencies(key, dependencies, options);
                if (warning) {
                    warnings.add(warning);
                    return;
                }
            }
            if (validate) {
                const warning = validate(options, this.gridOptions, this.beans);
                if (warning) {
                    warnings.add(warning);
                    return;
                }
            }
        });
        if (warnings.size > 0) {
            warnings.forEach((warning) => {
                _warnOnce(warning);
            });
        }
    }

    private checkForRequiredDependencies<T extends object>(
        key: keyof T,
        validator: RequiredOptions<T>,
        options: T
    ): string | null {
        const optionEntries = Object.entries<DependentValues<T, keyof T>>(validator);
        const failedOptions = optionEntries.filter(([key, value]) => {
            const gridOptionValue = options[key as keyof T];
            return !value.required.includes(gridOptionValue);
        });

        if (failedOptions.length === 0) {
            return null;
        }

        return failedOptions
            .map(
                ([failedKey, possibleOptions]: [string, DependentValues<any, any>]) =>
                    `'${String(key)}' requires '${failedKey}' to be one of [${possibleOptions.required
                        .map((o: any) => {
                            if (o === null) {
                                return 'null';
                            } else if (o === undefined) {
                                return 'undefined';
                            }
                            return o;
                        })
                        .join(', ')}]. ${possibleOptions.reason ?? ''}`
            )
            .join('\n           '); // make multiple messages easier to read
    }

    private checkProperties<T extends object>(
        object: T,
        exceptions: string[], // deprecated properties generally
        validProperties: string[], // properties to recommend
        containerName: string,
        docsUrl?: string
    ): void {
        // Vue adds these properties to all objects, so we ignore them when checking for invalid properties
        const VUE_FRAMEWORK_PROPS = ['__ob__', '__v_skip', '__metadata__'];

        const invalidProperties: { [p: string]: string[] } = _fuzzyCheckStrings(
            Object.getOwnPropertyNames(object),
            [...VUE_FRAMEWORK_PROPS, ...exceptions, ...validProperties],
            validProperties
        );

        Object.entries(invalidProperties).forEach(([key, value]) => {
            let message = `invalid ${containerName} property '${key}' did you mean any of these: ${value.slice(0, 8).join(', ')}.`;
            if (validProperties.includes('context')) {
                message += `\nIf you are trying to annotate ${containerName} with application data, use the '${containerName}.context' property instead.`;
            }
            _warnOnce(message);
        });

        if (Object.keys(invalidProperties).length > 0 && docsUrl) {
            const url = this.beans.frameworkOverrides.getDocLink(docsUrl);
            _warnOnce(`to see all the valid ${containerName} properties please check: ${url}`);
        }
    }

    public getConsoleMessage<TId extends ErrorId>(id: TId, args: GetErrorParams<TId>): any[] {
        return getError(id, args);
    }
}

export function _fuzzyCheckStrings(
    inputValues: string[],
    validValues: string[],
    allSuggestions: string[]
): { [p: string]: string[] } {
    const fuzzyMatches: { [p: string]: string[] } = {};
    const invalidInputs: string[] = inputValues.filter(
        (inputValue) => !validValues.some((validValue) => validValue === inputValue)
    );

    if (invalidInputs.length > 0) {
        invalidInputs.forEach(
            (invalidInput) =>
                (fuzzyMatches[invalidInput] = _fuzzySuggestions({ inputValue: invalidInput, allSuggestions }).values)
        );
    }

    return fuzzyMatches;
}

const DEPRECATED_ROW_NODE_EVENTS: Set<RowNodeEventType> = new Set([
    'firstChildChanged',
    'lastChildChanged',
    'childIndexChanged',
]);

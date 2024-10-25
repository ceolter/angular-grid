import type { Module, ModuleName, ModuleValidationInvalidResult } from '../interfaces/iModule';
import type { RowModelType } from '../interfaces/iRowModel';
import { _errorOnce } from '../utils/function';

interface RowModelModuleStore {
    [name: string]: Module;
}

type ModuleStore = {
    [modelType in RowModelType | 'all']?: RowModelModuleStore;
};

const allRegisteredModules = new Set<Module>();
const globalModulesMap: ModuleStore = {};
const gridModulesMap: { [gridId: string]: ModuleStore } = {};
let currentModuleVersion: string;
let areGridScopedModules = false;

function isValidModuleVersion(module: Module): boolean {
    const [moduleMajor, moduleMinor] = module.version.split('.') || [];
    const [currentModuleMajor, currentModuleMinor] = currentModuleVersion.split('.') || [];

    return moduleMajor === currentModuleMajor && moduleMinor === currentModuleMinor;
}

function runVersionChecks(module: Module) {
    if (!currentModuleVersion) {
        currentModuleVersion = module.version;
    }
    const errorMsg = (details: string) =>
        `You are using incompatible versions of AG Grid modules. Major and minor versions should always match across modules. ${details} Please update all modules to the same version.`;
    if (!module.version) {
        _errorOnce(errorMsg(`'${module.moduleName}' is incompatible.`));
    } else if (!isValidModuleVersion(module)) {
        _errorOnce(
            errorMsg(
                `'${module.moduleName}' is version ${module.version} but the other modules are version ${currentModuleVersion}.`
            )
        );
    }

    if (module.validate) {
        const result = module.validate();
        if (!result.isValid) {
            const errorResult = result as ModuleValidationInvalidResult;
            _errorOnce(`${errorResult.message}`);
        }
    }
}

export function _registerModule(module: Module, gridId: string | undefined): void {
    runVersionChecks(module);
    const rowModels = module.rowModels ?? ['all'];

    allRegisteredModules.add(module);

    let moduleStore: ModuleStore;
    if (gridId !== undefined) {
        areGridScopedModules = true;
        if (gridModulesMap[gridId] === undefined) {
            gridModulesMap[gridId] = {};
        }
        moduleStore = gridModulesMap[gridId];
    } else {
        moduleStore = globalModulesMap;
    }
    rowModels.forEach((rowModel) => {
        if (moduleStore[rowModel] === undefined) {
            moduleStore[rowModel] = {};
        }
        moduleStore[rowModel]![module.moduleName] = module;
    });

    if (module.dependsOn) {
        module.dependsOn.forEach((dependency) => _registerModule(dependency, gridId));
    }
}

export function _unRegisterGridModules(gridId: string): void {
    delete gridModulesMap[gridId];
}

export function _isModuleRegistered(moduleName: ModuleName, gridId: string, rowModel: RowModelType): boolean {
    const isRegisteredForRowModel = (model: RowModelType | 'all') =>
        !!globalModulesMap[model]?.[moduleName] || !!gridModulesMap[gridId][model]?.[moduleName];
    return isRegisteredForRowModel(rowModel) || isRegisteredForRowModel('all');
}

export function _areModulesGridScoped(): boolean {
    return areGridScopedModules;
}

export function _getRegisteredModules(gridId: string, rowModel: RowModelType): Module[] {
    const gridModules = gridModulesMap[gridId] ?? {};
    return [
        ...Object.values(globalModulesMap['all'] ?? {}),
        ...Object.values(gridModules['all'] ?? {}),
        ...Object.values(globalModulesMap[rowModel] ?? {}),
        ...Object.values(gridModules[rowModel] ?? {}),
    ];
}

export function _getAllRegisteredModules(): Set<Module> {
    return new Set(allRegisteredModules);
}

export function _getGridRegisteredModules(gridId: string, rowModel: RowModelType): Module[] {
    const gridModules = gridModulesMap[gridId] ?? {};
    return [...Object.values(gridModules['all'] ?? {}), ...Object.values(gridModules[rowModel] ?? {})];
}

export class ModuleRegistry {
    /**
     * @deprecated v33 Use `registerModules([module])` instead.
     */
    public static register(module: Module): void {
        _registerModule(module, undefined);
    }
    /**
     * Globally register the given modules for all grids.
     * @param modules - modules to register
     */
    public static registerModules(modules: Module[]): void {
        modules.forEach((module) => _registerModule(module, undefined));
    }
}

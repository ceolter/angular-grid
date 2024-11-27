import type { BeanCollection } from '../context/context';
import type { GridOptions } from '../entities/gridOptions';
import type { ManagedGridOptionKey, ManagedGridOptions } from '../gridOptionsInitial';
import type { AsObject, ObjectKeys } from '../gridOptionsUtils';

export function getGridId(beans: BeanCollection): string {
    return beans.context.getGridId();
}

export function destroy(beans: BeanCollection): void {
    beans.gridDestroySvc.destroy();
}

export function isDestroyed(beans: BeanCollection): boolean {
    return beans.gridDestroySvc.destroyCalled;
}

export function getGridOption<Key extends keyof GridOptions<TData>, TData = any>(
    beans: BeanCollection,
    key: Key
): GridOptions<TData>[Key] {
    return beans.gos.get(key);
}

export function setGridOption<Key extends ManagedGridOptionKey, TData = any>(
    beans: BeanCollection,
    key: Key,
    value: GridOptions<TData>[Key]
): void {
    updateGridOptions(beans, { [key]: value });
}

export function setDeepGridOption<P1 extends ObjectKeys<GridOptions<TData>>, TData = any>(
    beans: BeanCollection,
    prop1: P1,
    value: GridOptions<TData>[P1]
): void;
export function setDeepGridOption<
    P1 extends ObjectKeys<GridOptions<TData>>,
    P2 extends ObjectKeys<AsObject<GridOptions<TData>>[P1]>,
    TData = any,
>(beans: BeanCollection, prop1: P1, prop2: P2, value: AsObject<AsObject<GridOptions<TData>>[P1]>[P2]): void;
export function setDeepGridOption<
    P1 extends ObjectKeys<GridOptions<TData>>,
    P2 extends ObjectKeys<AsObject<GridOptions<TData>>[P1]>,
    P3 extends ObjectKeys<AsObject<AsObject<GridOptions<TData>>[P1]>[P2]>,
    TData = any,
>(
    beans: BeanCollection,
    prop1: P1,
    prop2: P2,
    prop3: P3,
    value: AsObject<AsObject<AsObject<GridOptions<TData>>[P1]>[P2]>[P3]
): void;
export function setDeepGridOption(beans: BeanCollection, ...args: any[]): void {
    beans.gridOptions;
}

export function updateGridOptions<TDataUpdate = any>(
    beans: BeanCollection,
    options: ManagedGridOptions<TDataUpdate>
): void {
    // NOTE: The TDataUpdate generic is used to ensure that the update options match the generic passed into the GridApi above as TData.
    // This is required because if we just use TData directly then Typescript will get into an infinite loop due to callbacks which recursively include the GridApi.
    beans.gos.updateGridOptions({ options });
}

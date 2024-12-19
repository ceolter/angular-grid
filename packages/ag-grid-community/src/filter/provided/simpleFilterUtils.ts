import type { IFilterOptionDef } from '../../interfaces/iFilter';
import { _warn } from '../../validation/logging';
import type { ISimpleFilterModelType, JoinOperator, Tuple } from './iSimpleFilter';
import type { OptionsFactory } from './optionsFactory';

export function removeItems<T>(items: T[], startPosition: number, deleteCount?: number): T[] {
    return deleteCount == null ? items.splice(startPosition) : items.splice(startPosition, deleteCount);
}

export function isBlank<V>(cellValue: V) {
    return cellValue == null || (typeof cellValue === 'string' && cellValue.trim().length === 0);
}

export function getDefaultJoinOperator(defaultJoinOperator?: JoinOperator): JoinOperator {
    return defaultJoinOperator === 'AND' || defaultJoinOperator === 'OR' ? defaultJoinOperator : 'AND';
}

export function evaluateCustomFilter<V>(
    customFilterOption: IFilterOptionDef | undefined,
    values: Tuple<V>,
    cellValue: V | null | undefined
): boolean | undefined {
    if (customFilterOption == null) {
        return;
    }

    const { predicate } = customFilterOption;
    // only execute the custom filter if a value exists or a value isn't required, i.e. input is hidden
    if (predicate != null && !values.some((v) => v == null)) {
        return predicate(values, cellValue);
    }

    // No custom filter invocation, indicate that to the caller.
    return;
}

export function validateAndUpdateConditions<M>(conditions: M[], maxNumConditions: number): number {
    let numConditions = conditions.length;
    if (numConditions > maxNumConditions) {
        conditions.splice(maxNumConditions);
        // 'Filter Model contains more conditions than "filterParams.maxNumConditions". Additional conditions have been ignored.'
        _warn(78);
        numConditions = maxNumConditions;
    }
    return numConditions;
}

export function getNumberOfInputs(
    type: ISimpleFilterModelType | null | undefined,
    optionsFactory: OptionsFactory
): number {
    const customOpts = optionsFactory.getCustomOption(type);
    if (customOpts) {
        const { numberOfInputs } = customOpts;
        return numberOfInputs != null ? numberOfInputs : 1;
    }

    const zeroInputTypes: ISimpleFilterModelType[] = ['empty', 'notBlank', 'blank'];

    if (type && zeroInputTypes.indexOf(type) >= 0) {
        return 0;
    } else if (type === 'inRange') {
        return 2;
    }

    return 1;
}

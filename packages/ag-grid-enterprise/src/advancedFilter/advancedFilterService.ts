import type {
    AdvancedFilterModel,
    BeanCollection,
    ColumnModel,
    DataTypeService,
    FilterValueService,
    IAdvancedFilterService,
    IRowNode,
    NamedBean,
    NewColumnsLoadedEvent,
    ValueService,
} from 'ag-grid-community';
import { BeanStub, _exists, _isClientSideRowModel, _isServerSideRowModel, _warn } from 'ag-grid-community';

import { AdvancedFilterCtrl } from './advancedFilterCtrl';
import type { AdvancedFilterExpressionService } from './advancedFilterExpressionService';
import type { AutocompleteEntry } from './autocomplete/autocompleteParams';
import { FilterExpressionParser } from './filterExpressionParser';
import type {
    ExpressionProxy,
    FilterExpressionFunction,
    FilterExpressionFunctionParams,
} from './filterExpressionUtils';

export class AdvancedFilterService extends BeanStub implements NamedBean, IAdvancedFilterService {
    beanName = 'advancedFilter' as const;

    private valueSvc: ValueService;
    private colModel: ColumnModel;
    private dataTypeSvc?: DataTypeService;
    private advancedFilterExpressionService: AdvancedFilterExpressionService;
    private filterValueSvc: FilterValueService;

    public wireBeans(beans: BeanCollection): void {
        this.valueSvc = beans.valueSvc;
        this.colModel = beans.colModel;
        this.dataTypeSvc = beans.dataTypeSvc;
        this.advancedFilterExpressionService = beans.advancedFilterExpressionService as AdvancedFilterExpressionService;
        this.filterValueSvc = beans.filterValueSvc!;
    }

    private enabled: boolean;
    private ctrl: AdvancedFilterCtrl;

    private expressionProxy: ExpressionProxy;
    private appliedExpression: string | null = null;
    /** The value displayed in the input, which may be invalid */
    private expression: string | null = null;
    private expressionFunction: FilterExpressionFunction | null;
    private expressionParams: FilterExpressionFunctionParams | null;
    private isValid: boolean = true;

    public postConstruct(): void {
        this.setEnabled(this.gos.get('enableAdvancedFilter'), true);

        this.ctrl = this.createManagedBean(new AdvancedFilterCtrl(this.enabled));

        this.expressionProxy = {
            getValue: (colId, node) => {
                const column = this.colModel.getColDefCol(colId);
                return column ? this.filterValueSvc.getValue(column, node) : undefined;
            },
        };

        this.addManagedPropertyListener('enableAdvancedFilter', (event) => this.setEnabled(!!event.currentValue));
        this.addManagedEventListeners({
            newColumnsLoaded: (event) => this.onNewColumnsLoaded(event),
        });
        this.addManagedPropertyListener('includeHiddenColumnsInAdvancedFilter', () => this.updateValidity());
    }

    public isEnabled(): boolean {
        return this.enabled;
    }

    public isFilterPresent(): boolean {
        return !!this.expressionFunction;
    }

    public doesFilterPass(node: IRowNode): boolean {
        return this.expressionFunction!(this.expressionProxy, node, this.expressionParams!);
    }

    public getModel(): AdvancedFilterModel | null {
        const expressionParser = this.createExpressionParser(this.appliedExpression);
        expressionParser?.parseExpression();
        return expressionParser?.getModel() ?? null;
    }

    public setModel(model: AdvancedFilterModel | null): void {
        const parseModel = (model: AdvancedFilterModel, isFirstParent?: boolean): string | null => {
            if (model.filterType === 'join') {
                const operator = this.advancedFilterExpressionService.parseJoinOperator(model);
                const expression = model.conditions
                    .map((condition) => parseModel(condition))
                    .filter((condition) => _exists(condition))
                    .join(` ${operator} `);
                return isFirstParent || model.conditions.length <= 1 ? expression : `(${expression})`;
            } else {
                return this.advancedFilterExpressionService.parseColumnFilterModel(model);
            }
        };

        const expression = model ? parseModel(model, true) : null;

        this.setExpressionDisplayValue(expression);
        this.applyExpression();
        this.ctrl.refreshComp();
        this.ctrl.refreshBuilderComp();
    }

    public getExpressionDisplayValue(): string | null {
        return this.expression;
    }

    public setExpressionDisplayValue(expression: string | null): void {
        this.expression = expression;
    }

    public isCurrentExpressionApplied(): boolean {
        return this.appliedExpression === this.expression;
    }

    public createExpressionParser(expression: string | null): FilterExpressionParser | null {
        if (!expression) {
            return null;
        }

        return new FilterExpressionParser({
            expression,
            colModel: this.colModel,
            dataTypeSvc: this.dataTypeSvc,
            valueSvc: this.valueSvc,
            advancedFilterExpressionService: this.advancedFilterExpressionService,
        });
    }

    public getDefaultExpression(updateEntry: AutocompleteEntry): {
        updatedValue: string;
        updatedPosition: number;
    } {
        const updatedValue = this.advancedFilterExpressionService.getColumnValue(updateEntry) + ' ';
        return {
            updatedValue,
            updatedPosition: updatedValue.length,
        };
    }

    public isHeaderActive(): boolean {
        return !this.gos.get('advancedFilterParent');
    }

    public getCtrl(): AdvancedFilterCtrl {
        return this.ctrl;
    }

    private setEnabled(enabled: boolean, silent?: boolean): void {
        const previousValue = this.enabled;
        const isValidRowModel = _isClientSideRowModel(this.gos) || _isServerSideRowModel(this.gos);
        if (enabled && !isValidRowModel) {
            _warn(123);
        }
        this.enabled = enabled && isValidRowModel;
        if (!silent && this.enabled !== previousValue) {
            this.eventSvc.dispatchEvent({
                type: 'advancedFilterEnabledChanged',
                enabled: this.enabled,
            });
        }
    }

    public applyExpression(): void {
        const expressionParser = this.createExpressionParser(this.expression);
        expressionParser?.parseExpression();
        this.applyExpressionFromParser(expressionParser);
    }

    private applyExpressionFromParser(expressionParser: FilterExpressionParser | null): void {
        this.isValid = !expressionParser || expressionParser.isValid();
        if (!expressionParser || !this.isValid) {
            this.expressionFunction = null;
            this.expressionParams = null;
            this.appliedExpression = null;
            return;
        }

        const { expressionFunction, params } = this.getFunction(expressionParser);

        this.expressionFunction = expressionFunction;
        this.expressionParams = params;
        this.appliedExpression = this.expression;
    }

    private getFunction(expressionParser: FilterExpressionParser): {
        expressionFunction: FilterExpressionFunction;
        params: FilterExpressionFunctionParams;
    } {
        if (this.gos.get('suppressAdvancedFilterEval')) {
            return expressionParser.getFunctionParsed();
        } else {
            const { functionString, params } = expressionParser.getFunctionString();
            return {
                expressionFunction: new Function(
                    'expressionProxy',
                    'node',
                    'params',
                    functionString
                ) as FilterExpressionFunction,
                params,
            };
        }
    }

    public updateValidity(): boolean {
        this.advancedFilterExpressionService.resetColumnCaches();
        const expressionParser = this.createExpressionParser(this.expression);
        expressionParser?.parseExpression();
        const isValid = !expressionParser || expressionParser.isValid();

        const updatedValidity = isValid !== this.isValid;

        this.applyExpressionFromParser(expressionParser);
        this.ctrl.refreshComp();
        this.ctrl.refreshBuilderComp();
        return updatedValidity;
    }

    private onNewColumnsLoaded(event: NewColumnsLoadedEvent): void {
        if (event.source !== 'gridInitializing' || !this.dataTypeSvc?.isPendingInference()) {
            return;
        }

        this.ctrl.setInputDisabled(true);
        const [destroyFunc] = this.addManagedEventListeners({
            dataTypesInferred: () => {
                destroyFunc?.();
                this.ctrl.setInputDisabled(false);
            },
        });
    }
}

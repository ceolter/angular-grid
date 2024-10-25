import type { ApiFunction, ApiFunctionName } from '../api/iApiFunction';
import type { BeanCollection } from '../context/context';
import type { RowModelType } from '../interfaces/iRowModel';
import { _errorOnce, _warnOnce } from '../utils/function';

const clientSide = 'clientSide';
const serverSide = 'serverSide';
const infinite = 'infinite';

const functionRowModels: { [name in ApiFunctionName]?: RowModelType[] } = {
    onGroupExpandedOrCollapsed: [clientSide],
    refreshClientSideRowModel: [clientSide],
    isRowDataEmpty: [clientSide],
    forEachLeafNode: [clientSide],
    forEachNodeAfterFilter: [clientSide],
    forEachNodeAfterFilterAndSort: [clientSide],
    resetRowHeights: [clientSide],
    applyTransaction: [clientSide],
    applyTransactionAsync: [clientSide],
    flushAsyncTransactions: [clientSide],
    getBestCostNodeSelection: [clientSide],
    getServerSideSelectionState: [serverSide],
    setServerSideSelectionState: [serverSide],
    applyServerSideTransaction: [serverSide],
    applyServerSideTransactionAsync: [serverSide],
    applyServerSideRowData: [serverSide],
    retryServerSideLoads: [serverSide],
    flushServerSideAsyncTransactions: [serverSide],
    refreshServerSide: [serverSide],
    getServerSideGroupLevelState: [serverSide],
    refreshInfiniteCache: [infinite],
    purgeInfiniteCache: [infinite],
    getInfiniteRowCount: [infinite],
    isLastRowIndexKnown: [infinite, serverSide],
    expandAll: [clientSide, serverSide],
    collapseAll: [clientSide, serverSide],
    onRowHeightChanged: [clientSide, serverSide],
    setRowCount: [infinite, serverSide],
    getCacheBlockState: [infinite, serverSide],
};

/** Utility type to support adding params to a grid api method. */
type StartsWithApiFunctionName = `${ApiFunctionName}${string}`;

const deprecatedFunctions: {
    [name in ApiFunctionName]?: {
        version: string;
        old?: StartsWithApiFunctionName;
        new?: StartsWithApiFunctionName;
        message?: string;
    };
} = {
    showLoadingOverlay: {
        version: 'v32',
        message:
            '`showLoadingOverlay` is deprecated. Use the grid option "loading"=true instead or setGridOption("loading", true).',
    },
    clearRangeSelection: {
        version: 'v32.2',
        message: 'Use `clearCellSelection` instead.',
    },
    getInfiniteRowCount: {
        version: 'v32.2',
        old: 'getInfiniteRowCount()',
        new: 'getDisplayedRowCount()',
    },
    selectAllFiltered: {
        version: 'v33',
        old: 'selectAllFiltered()',
        new: 'selectAll("filtered")',
    },
    deselectAllFiltered: {
        version: 'v33',
        old: 'deselectAllFiltered()',
        new: 'deselectAll("filtered")',
    },
    selectAllOnCurrentPage: {
        version: 'v33',
        old: 'selectAllOnCurrentPage()',
        new: 'selectAll("currentPage")',
    },
    deselectAllOnCurrentPage: {
        version: 'v33',
        old: 'deselectAllOnCurrentPage()',
        new: 'deselectAll("currentPage")',
    },
};

export function validateApiFunction<TFunctionName extends ApiFunctionName>(
    functionName: TFunctionName,
    apiFunction: ApiFunction<TFunctionName>,
    beans: BeanCollection
): ApiFunction<TFunctionName> {
    const deprecation = deprecatedFunctions[functionName];
    if (deprecation) {
        const { version, new: replacement, old, message } = deprecation;
        const apiMethod = old ?? functionName;
        return (...args: any[]) => {
            const replacementMessage = replacement ? `Please use ${replacement} instead. ` : '';
            _warnOnce(`Since ${version} api.${apiMethod} is deprecated. ${replacementMessage}${message ?? ''}`);
            return apiFunction.apply(apiFunction, args);
        };
    }
    const rowModels = functionRowModels[functionName];
    if (rowModels) {
        return (...args: any[]) => {
            const rowModel = beans.rowModel.getType();
            if (!rowModels.includes(rowModel)) {
                _errorOnce(
                    `api.${functionName} can only be called when gridOptions.rowModelType is ${rowModels.join(' or ')}`
                );
                return undefined as any;
            }
            return apiFunction.apply(apiFunction, args);
        };
    }
    return apiFunction;
}

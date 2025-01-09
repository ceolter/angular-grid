import type { Column } from '../interfaces/iColumn';
import type { IRowNode } from '../interfaces/iRowNode';
import type { BaseColDefOptionalDataParams, ValueFormatterParams, ValueParserParams } from './colDef';

export type ValueParserLiteParams<TData, TValue> = Omit<ValueParserParams<TData, TValue>, 'data' | 'node' | 'oldValue'>;

export interface ValueParserLiteFunc<TData, TValue> {
    (params: ValueParserLiteParams<TData, TValue>): TValue | null | undefined;
}

export type ValueFormatterLiteParams<TData, TValue> = Omit<ValueFormatterParams<TData, TValue>, 'data' | 'node'>;

export interface ValueFormatterLiteFunc<TData, TValue> {
    (params: ValueFormatterLiteParams<TData, TValue>): string;
}

export type DataTypeCheckerParams<TData, TValue> = Omit<
    BaseColDefOptionalDataParams<TData, TValue>,
    'data' | 'node'
> & {
    /** Value to be checked (e.g. from the cell). */
    value: TValue | null | undefined;
};

export interface DataTypeChecker<TData, TValue> {
    (params: DataTypeCheckerParams<TData, TValue>): boolean;
}

/**
 * The pre-defined base data types.
 *
 * `'text'` is type `string`.
 *
 * `'number'` is type `number`.
 *
 * `'boolean'` is type `boolean`.
 *
 * `'date'` is type `Date`.
 *
 * `'dateString'` is type `string` but represents a date.
 *
 * `object` is any other type.
 */
export type BaseCellDataType = 'text' | 'number' | 'boolean' | 'date' | 'dateString' | 'object' | 'bigint';

interface BaseDataTypeDefinition<TValueType extends BaseCellDataType, TData = any, TValue = any> {
    /** The underlying data type */
    baseDataType: TValueType;
    /**
     * The data type that this extends. Either one of the pre-defined data types
     * (`'text'`, `'number'`,  `'boolean'`,  `'date'`,  `'dateString'` or  `'object'`)
     * or another custom data type.
     */
    extendsDataType: string;
    /**
     * Parses a value into the correct data type.
     * This will be used as the `colDef.valueParser` (unless overridden),
     * and in other places where parsing is required.
     * As this could be used in places where there is no row,
     * the `params` do not have row node or data properties.
     * If not provided, the value parser of the data type that this extends will be used.
     */
    valueParser?: ValueParserLiteFunc<TData, TValue>;
    /**
     * Formats a value for display.
     * This will be used as the `colDef.valueFormatter` (unless overridden),
     * and in other places where formatting is required.
     * As this could be used in places where there is no row,
     * the `params` do not have row node or data properties.
     * If not provided, the value formatter of the data type that this extends will be used.
     */
    valueFormatter?: ValueFormatterLiteFunc<TData, TValue>;
    /**
     * Returns `true` if the `value` is of this data type.
     * Used when inferring cell data types as well as to ensure values of the
     * wrong data type cannot be set into this column.
     * If not provided, the data type matcher of the data type that this extends will be used.
     */
    dataTypeMatcher?: (value: any) => boolean;
    /**
     * A comma separated string or array of strings containing `ColumnType` keys,
     * which can be used as a template for columns of this data type.
     */
    columnTypes?: string | string[];
    /**
     * If `true`, this data type will append any specified column types to those of the data type that this extends.
     * If `false`, the column types for this data type will replace any of the data type that this extends.
     * @default false
     */
    appendColumnTypes?: boolean;
    /**
     * By default, certain column definition properties are set based on the base data type.
     * If this is set to `true`, these properties will not be set.
     * @default false
     */
    suppressDefaultProperties?: boolean;
}

/** Represents a `'text'` data type (type `string`). */
export interface TextDataTypeDefinition<TData = any> extends BaseDataTypeDefinition<'text', TData, string> {}

/** Represents a `'number'` data type (type `number`). */
export interface NumberDataTypeDefinition<TData = any> extends BaseDataTypeDefinition<'number', TData, number> {}

/** Represents a `'bigint'` data type (type `bigint`). */
export interface BigIntDataTypeDefinition<TData = any> extends BaseDataTypeDefinition<'bigint', TData, bigint> {}

/** Represents a `'boolean'` data type (type `boolean`). */
export interface BooleanDataTypeDefinition<TData = any> extends BaseDataTypeDefinition<'boolean', TData, boolean> {}

/** Represents a `'date'` data type (type `Date`). */
export interface DateDataTypeDefinition<TData = any> extends BaseDataTypeDefinition<'date', TData, Date> {}

/** Represents a `'dateString'` data type (type `string` that represents a date). */
export interface DateStringDataTypeDefinition<TData = any> extends BaseDataTypeDefinition<'dateString', TData, string> {
    /** Converts a date in `string` format to a `Date`. */
    dateParser?: (value: string | undefined) => Date | undefined;
    /** Converts a date in `Date` format to a `string`. */
    dateFormatter?: (value: Date | undefined) => string | undefined;
}

/** Represents an `'object'` data type (any type). */
export interface ObjectDataTypeDefinition<TData, TValue> extends BaseDataTypeDefinition<'object', TData, TValue> {}

/** Configuration options for a cell data type. */
export type DataTypeDefinition<TData = any> =
    | TextDataTypeDefinition<TData>
    | NumberDataTypeDefinition<TData>
    | BigIntDataTypeDefinition<TData>
    | BooleanDataTypeDefinition<TData>
    | DateDataTypeDefinition<TData>
    | DateStringDataTypeDefinition<TData>
    | ObjectDataTypeDefinition<TData, any>;

/** Configuration options for pre-defined data types. */
export type CoreDataTypeDefinition<TData = any> =
    | Omit<TextDataTypeDefinition<TData>, 'extendsDataType'>
    | Omit<NumberDataTypeDefinition<TData>, 'extendsDataType'>
    | Omit<BigIntDataTypeDefinition<TData>, 'extendsDataType'>
    | Omit<BooleanDataTypeDefinition<TData>, 'extendsDataType'>
    | Omit<DateDataTypeDefinition<TData>, 'extendsDataType'>
    | Omit<DateStringDataTypeDefinition<TData>, 'extendsDataType'>
    | Omit<ObjectDataTypeDefinition<TData, any>, 'extendsDataType'>;

export type DataTypeFormatValueFunc = (params: { column: Column; node: IRowNode | null; value: any }) => string;

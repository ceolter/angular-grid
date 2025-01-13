import { Collapsible } from '@ag-website-shared/components/collapsible/Collapsible';
import { Icon } from '@ag-website-shared/components/icon/Icon';
import classnames from 'classnames';
import React, { useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import styles from './ComparisonTable.module.scss';
import { Feature } from './renderers/Feature';
import { Label } from './renderers/Label';
import { createRowDataFilter } from './utils/createRowDataFilter';

type Columns = Record<string, string>;
type Data = Record<string, any>;
type CellRenderer = 'label' | 'feature';
type CellRendererDef = Record<string, CellRenderer>;

// Added level field for rendering indentation
const LEVEL_FIELD = '_level';
const GROUP_HEADING_FIELD = '_isGroupHeading';
const GROUP_ITEMS_FIELD = 'items';

const getColumnFields = (column: string) => column.split('||').map((col) => col.trim());

/**
 * Column fields can be separated by `||` (an "or" operator)
 */
const getAllColumnFields = (columns: Columns) => Object.keys(columns).flatMap(getColumnFields);

const CellValue = ({
    value,
    field,
    cellRenderer = {},
}: {
    value: any;
    field: string;
    cellRenderer?: CellRendererDef;
}) => {
    const renderer = cellRenderer[field] as CellRenderer;

    if (renderer === 'label') {
        return <Label value={value} />;
    }

    if (renderer === 'feature') {
        return <Feature value={value} />;
    }

    if (value === undefined) {
        return null;
    }

    if (typeof value === 'object') {
        return null;
    }

    return value;
};

const getFieldValue = ({ columnField, datum }: { columnField: string; datum: Data[] }) => {
    const isNegated = columnField?.startsWith('!');
    const field = isNegated ? columnField.slice(1) : columnField;
    const value = datum[field];

    return isNegated ? !value : value;
};

const getColumnField = ({ datum, columnField }: { datum: Data[]; columnField: string }) => {
    const columnFields = getColumnFields(columnField);
    if (columnFields.length === 1) {
        return {
            field: columnField,
            value: getFieldValue({
                columnField,
                datum,
            }),
        };
    }

    const field = columnFields.find((f) => datum[f]);
    const value = getFieldValue({
        columnField: field!,
        datum,
    });

    return {
        field,
        value,
    };
};

const TitleCell = ({ level, children }: { level: number; children: ReactNode }) => (
    <span
        className={classnames({
            [styles.title]: level === 1,
            [styles[`level${level}`]]: level > 2,
        })}
    >
        {children}
    </span>
);

const TableRows = ({ data, columns, cellRenderer }: { data: Data; columns: Columns; cellRenderer: CellRendererDef }) =>
    data.map((datum: any, i: number) => (
        <TableRow datum={datum} cellRenderer={cellRenderer} columns={columns} key={i} id={i} />
    ));

const TableRow = ({ datum, cellRenderer, columns, id }) => {
    const [subGroupOpen, setSubGroupOpen] = useState(false);

    const { [LEVEL_FIELD]: level } = datum;

    const subGroup = datum.isSubGroup;

    if (!subGroup) {
        return (
            <div className={styles.row}>
                {Object.keys(columns).map((columnField, index) => {
                    const { field, value } = getColumnField({ datum, columnField });
                    const cellValue = <CellValue field={field!} value={value} cellRenderer={cellRenderer} />;
                    const isFirstColumn = index === 0;
                    const isHeaderGroup = datum[GROUP_HEADING_FIELD];

                    if (!isFirstColumn && isHeaderGroup) {
                        return <td key={`column-${columnField}`}></td>;
                    }

                    return (
                        <div
                            className={classnames(styles.cell, value.detail ? styles.hasDetails : undefined)}
                            key={`column-${columnField}`}
                        >
                            {isFirstColumn ? <TitleCell level={level}>{cellValue}</TitleCell> : cellValue}
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <div className={classnames(styles.subGroup, subGroupOpen ? styles.isOpen : undefined)}>
            <header
                className={styles.subGroupHeader}
                onClick={() => {
                    setSubGroupOpen(!subGroupOpen);
                }}
            >
                <div className={classnames(styles.cell)}>
                    <span className={styles.subGroupTitleIcon}>
                        {datum.name}{' '}
                        <div className={styles.subGroupIconWrapper}>
                            <Icon name="chevronDown" />
                        </div>
                    </span>
                </div>
                <div className={classnames(styles.cell)}>
                    <Feature value={datum.items.every((item) => item.community)} />
                </div>
                <div className={classnames(styles.cell)}>
                    <Feature value={true} />
                </div>
                <div className={classnames(styles.cell)}>
                    <Feature value={true} />
                </div>
            </header>

            <Collapsible id={`subgroup-${id}`} isDisabled={false} isOpen={subGroupOpen}>
                <ComparisonTable
                    data={datum.items}
                    columns={{
                        label: '',
                        community: '',
                        enterprise: '',
                        chartsGrid: '',
                    }}
                    cellRenderer={{
                        label: 'label',
                        community: 'feature',
                        enterprise: 'feature',
                        chartsGrid: 'feature',
                    }}
                />
            </Collapsible>
        </div>
    );
};

const columnsGroupRendererFields = ({ columns }: { columns: Columns }): string[] =>
    getAllColumnFields(columns).filter((field) => field === 'group');

const recursivelyNormalizeData = ({
    data,
    groupFields,
    level = 1,
}: {
    data: Data;
    groupFields: string[];
    level?: number;
}) =>
    data
        .flatMap((datum) => {
            const dataFields = Object.keys(datum);
            // Take first field that is a group
            const groupFieldName = groupFields.find((field) => dataFields.includes(field));
            const { [GROUP_ITEMS_FIELD]: items, ...groupData } = datum[groupFieldName!] || {};

            if (!groupFieldName || !items) {
                return datum;
            }

            const children = recursivelyNormalizeData({ data: items, groupFields, level: level + 1 });

            return [{ [GROUP_HEADING_FIELD]: true, ...groupData }].concat(children);
        })
        .map((datum) => ({
            [LEVEL_FIELD]: level,
            ...datum,
        }));

const normalizeGroupedData = ({ data, columns }: { data: Data; columns: Columns }) => {
    const groupFields = columnsGroupRendererFields({
        columns,
    });

    if (!groupFields.length) {
        return data;
    }

    return recursivelyNormalizeData({
        data,
        groupFields,
    });
};

/**
 * This presents a matrix of information, e.g. to show which features are available with different versions of the grid.
 */
export const ComparisonTable = ({
    data,
    columns,
    filter,
    cellRenderer,
}: {
    data: Data;
    columns: Columns;
    filter?: string;
    cellRenderer: CellRendererDef;
}) => {
    const tableData = useMemo(() => {
        const normalizedData = normalizeGroupedData({ data, columns });
        const filteredData = filter ? normalizedData.filter(createRowDataFilter(filter)) : normalizedData;

        return filteredData;
    }, [data, filter]);

    const numColumns = { '--num-columns': Object.keys(columns).length } as React.CSSProperties;

    return (
        <div
            className={classnames(styles.comparisonTable, Object.keys(columns).length <= 2 ? styles.twoColumn : '')}
            style={numColumns}
        >
            <TableRows data={tableData} columns={columns} cellRenderer={cellRenderer} />
        </div>
    );
};

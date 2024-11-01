import { type Framework } from '@ag-grid-types';
import { EnterpriseIcon } from '@ag-website-shared/components/icon/EnterpriseIcon';
import { transformMarkdoc } from '@utils/markdoc/transformMarkdoc';
import classnames from 'classnames';
import { useMemo } from 'react';

import { createRowDataFilter } from '../utils/createRowDataFilter';
import styles from './MatrixTable.module.scss';
import { FeaturesTickCross, TickCross } from './renderers/TickCross';

type Columns = Record<string, string>;
type Data = Record<string, any>;
type CellRenderer = 'tickCross' | 'featuresTickCross' | 'group';
type CellRendererDef = Record<string, CellRenderer>;

// Added level field for rendering indentation
const LEVEL_FIELD = '_level';
const GROUP_HEADING_FIELD = '_isGroupHeading';
const GROUP_ITEMS_FIELD = 'items';
const ENTERPRISE_FIELD = 'enterprise';

const getColumnFields = (column: string) => column.split('||').map((col) => col.trim());

/**
 * Column fields can be separated by `||` (an "or" operator)
 */
const getAllColumnFields = (columns: Columns) => Object.keys(columns).flatMap(getColumnFields);

function HeaderRow({ framework, columns }: { framework: Framework; columns: Columns }) {
    return (
        <tr>
            {Object.entries(columns).map(([column, columnName]) => (
                <th key={`header-column-${column}`} scope="col">
                    <CellValue framework={framework} value={columnName} />
                </th>
            ))}
        </tr>
    );
}

function CellValue({
    framework,
    value,
    field,
    cellRenderer = {},
}: {
    framework: Framework;
    value: any;
    field?: string;
    cellRenderer?: CellRendererDef;
}) {
    const renderer = cellRenderer && (cellRenderer[field] as CellRenderer);

    if (renderer === 'tickCross') {
        return <TickCross value={value} />;
    } else if (renderer === 'featuresTickCross') {
        return <FeaturesTickCross value={value} />;
    }

    if (value === undefined) {
        return null;
    }

    if (typeof value === 'object') {
        // eslint-disable-next-line no-console
        console.error(`Cannot render object for cell value of field "${field}": ${JSON.stringify(value)}`);
        return null;
    }

    const { MarkdocContent } = transformMarkdoc({ framework, markdocContent: value });

    return <MarkdocContent />;
}

const getFieldValue = ({ columnField, datum }) => {
    const isNegated = columnField?.startsWith('!');
    const field = isNegated ? columnField.slice(1) : columnField;
    const value = datum[field];

    return isNegated ? !value : value;
};

function getColumnField({ datum, columnField }) {
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
        columnField: field,
        datum,
    });

    return {
        field,
        value,
    };
}

function TitleCell({ level, children, isEnterprise }) {
    return (
        <span
            className={classnames({
                [styles.title]: level === 1,
                [styles[`level${level}`]]: level > 2,
            })}
        >
            {children} {isEnterprise && <EnterpriseIcon />}
        </span>
    );
}

function TableRows({
    framework,
    data,
    columns,
    cellRenderer,
}: {
    framework: Framework;
    data: Data;
    columns: Columns;
    cellRenderer?: CellRendererDef;
}) {
    return data.map((datum: any) => {
        const { [LEVEL_FIELD]: level } = datum;
        return (
            <tr>
                {Object.keys(columns).map((columnField, index) => {
                    const { field, value } = getColumnField({ datum, columnField });
                    const cellValue = (
                        <CellValue framework={framework} field={field} value={value} cellRenderer={cellRenderer} />
                    );
                    const isFirstColumn = index === 0;
                    const isHeaderGroup = datum[GROUP_HEADING_FIELD];
                    const isEnterprise = datum[ENTERPRISE_FIELD];

                    if (!isFirstColumn && isHeaderGroup) {
                        return <td key={`column-${columnField}`}></td>;
                    }

                    return (
                        <td key={`column-${columnField}`}>
                            {isFirstColumn ? (
                                <TitleCell level={level} isEnterprise={isEnterprise}>
                                    {cellValue}
                                </TitleCell>
                            ) : (
                                cellValue
                            )}
                        </td>
                    );
                })}
            </tr>
        );
    });
}

function columnsGroupRendererFields({ columns }: { columns: Columns }) {
    const allFields = getAllColumnFields(columns);

    return allFields.filter((field) => {
        return field === 'group';
    });
}

function recursivelyNormalizeData({ data, groupFields, level = 1 }) {
    return data
        .flatMap((datum) => {
            const dataFields = Object.keys(datum);
            // Take first field that is a group
            const groupFieldName = groupFields.find((field) => {
                return dataFields.includes(field);
            });
            const { [GROUP_ITEMS_FIELD]: items, ...groupData } = datum[groupFieldName] || {};

            if (!groupFieldName || !items) {
                return datum;
            }

            const children = recursivelyNormalizeData({ data: items, groupFields, level: level + 1 });

            return [{ [GROUP_HEADING_FIELD]: true, ...groupData }].concat(children);
        })
        .map((datum) => {
            return {
                [LEVEL_FIELD]: level,
                ...datum,
            };
        });
}

function normalizeGroupedData({ data, columns, cellRenderer }) {
    const groupFields = columnsGroupRendererFields({
        columns,
        cellRenderer,
    });
    if (!groupFields.length) {
        return data;
    }

    return recursivelyNormalizeData({
        data,
        groupFields,
    });
}

/**
 * This presents a matrix of information, e.g. to show which features are available with different versions of the grid.
 */
export function MatrixTable({
    framework,
    data,
    columns,
    filter,
    cellRenderer,
}: {
    framework: Framework;
    data: Data;
    columns: Columns;
    filter?: string;
    cellRenderer?: CellRendererDef;
}) {
    const tableData = useMemo(() => {
        const normalizedData = normalizeGroupedData({ data, columns, cellRenderer });
        const filteredData = filter ? normalizedData.filter(createRowDataFilter(filter)) : normalizedData;

        return filteredData;
    }, [data, filter, columns, cellRenderer]);

    return (
        <div className={styles.outer}>
            <table className={styles.matrix}>
                <thead>
                    <HeaderRow framework={framework} columns={columns} />
                </thead>
                <tbody>
                    <TableRows framework={framework} data={tableData} columns={columns} cellRenderer={cellRenderer} />
                </tbody>
            </table>
        </div>
    );
}

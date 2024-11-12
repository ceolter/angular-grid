import type { IServerSideGetRowsRequest } from 'ag-grid-community';

export const GROUP_ROW_DATA = [
    {
        athlete: 'Michael Phelps',
        age: 23,
        country: 'United States',
        year: 2008,
        date: '24/08/2008',
        sport: 'Swimming',
        gold: 8,
        silver: 0,
        bronze: 0,
        total: 8,
    },
    {
        athlete: 'Michael Phelps',
        age: 19,
        country: 'United States',
        year: 2004,
        date: '29/08/2004',
        sport: 'Swimming',
        gold: 6,
        silver: 0,
        bronze: 2,
        total: 8,
    },
    {
        athlete: 'Michael Phelps',
        age: 27,
        country: 'United States',
        year: 2012,
        date: '12/08/2012',
        sport: 'Swimming',
        gold: 4,
        silver: 2,
        bronze: 0,
        total: 6,
    },
    {
        athlete: 'Natalie Coughlin',
        age: 25,
        country: 'United States',
        year: 2008,
        date: '24/08/2008',
        sport: 'Swimming',
        gold: 1,
        silver: 2,
        bronze: 3,
        total: 6,
    },
    {
        athlete: 'Aleksey Nemov',
        age: 24,
        country: 'Russia',
        year: 2000,
        date: '01/10/2000',
        sport: 'Gymnastics',
        gold: 2,
        silver: 1,
        bronze: 3,
        total: 6,
    },
    {
        athlete: 'Alicia Coutts',
        age: 24,
        country: 'Australia',
        year: 2012,
        date: '12/08/2012',
        sport: 'Swimming',
        gold: 1,
        silver: 3,
        bronze: 1,
        total: 5,
    },
    {
        athlete: 'Missy Franklin',
        age: 17,
        country: 'United States',
        year: 2012,
        date: '12/08/2012',
        sport: 'Swimming',
        gold: 4,
        silver: 0,
        bronze: 1,
        total: 5,
    },
    {
        athlete: 'Ryan Lochte',
        age: 27,
        country: 'United States',
        year: 2012,
        date: '12/08/2012',
        sport: 'Swimming',
        gold: 2,
        silver: 2,
        bronze: 1,
        total: 5,
    },
    {
        athlete: 'Allison Schmitt',
        age: 22,
        country: 'United States',
        year: 2012,
        date: '12/08/2012',
        sport: 'Swimming',
        gold: 3,
        silver: 1,
        bronze: 1,
        total: 5,
    },
    {
        athlete: 'Natalie Coughlin',
        age: 21,
        country: 'United States',
        year: 2004,
        date: '29/08/2004',
        sport: 'Swimming',
        gold: 2,
        silver: 2,
        bronze: 1,
        total: 5,
    },
    {
        athlete: 'Ian Thorpe',
        age: 17,
        country: 'Australia',
        year: 2000,
        date: '01/10/2000',
        sport: 'Swimming',
        gold: 3,
        silver: 2,
        bronze: 0,
        total: 5,
    },
    {
        athlete: 'Dara Torres',
        age: 33,
        country: 'United States',
        year: 2000,
        date: '01/10/2000',
        sport: 'Swimming',
        gold: 2,
        silver: 0,
        bronze: 3,
        total: 5,
    },
    {
        athlete: 'Cindy Klassen',
        age: 26,
        country: 'Canada',
        year: 2006,
        date: '26/02/2006',
        sport: 'Speed Skating',
        gold: 1,
        silver: 2,
        bronze: 2,
        total: 5,
    },
    {
        athlete: 'Nastia Liukin',
        age: 18,
        country: 'United States',
        year: 2008,
        date: '24/08/2008',
        sport: 'Gymnastics',
        gold: 1,
        silver: 3,
        bronze: 1,
        total: 5,
    },
    {
        athlete: 'Marit Bjørgen',
        age: 29,
        country: 'Norway',
        year: 2010,
        date: '28/02/2010',
        sport: 'Cross Country Skiing',
        gold: 3,
        silver: 1,
        bronze: 1,
        total: 5,
    },
    {
        athlete: 'Sun Yang',
        age: 20,
        country: 'China',
        year: 2012,
        date: '12/08/2012',
        sport: 'Swimming',
        gold: 2,
        silver: 1,
        bronze: 1,
        total: 4,
    },
    {
        athlete: 'Kirsty Coventry',
        age: 24,
        country: 'Zimbabwe',
        year: 2008,
        date: '24/08/2008',
        sport: 'Swimming',
        gold: 1,
        silver: 3,
        bronze: 0,
        total: 4,
    },
    {
        athlete: 'Libby Lenton-Trickett',
        age: 23,
        country: 'Australia',
        year: 2008,
        date: '24/08/2008',
        sport: 'Swimming',
        gold: 2,
        silver: 1,
        bronze: 1,
        total: 4,
    },
    {
        athlete: 'Ryan Lochte',
        age: 24,
        country: 'United States',
        year: 2008,
        date: '24/08/2008',
        sport: 'Swimming',
        gold: 2,
        silver: 0,
        bronze: 2,
        total: 4,
    },
    {
        athlete: 'Inge de Bruijn',
        age: 30,
        country: 'Netherlands',
        year: 2004,
        date: '29/08/2004',
        sport: 'Swimming',
        gold: 1,
        silver: 1,
        bronze: 2,
        total: 4,
    },
];

type RowData = typeof GROUP_ROW_DATA;
type Row = RowData[number];
type GroupedRowData = Record<string | number, RowData>;

export function fakeFetch(params: IServerSideGetRowsRequest) {
    const grouped = group(params, where(params));

    if (Array.isArray(grouped)) {
        return select(params, grouped);
    } else {
        return Object.entries(grouped)
            .map(([, rows]) => {
                const selected = select(params, rows);
                return selected[0];
            })
            .flat();
    }
}

// Ignore valueCols for tests
function select({ rowGroupCols, groupKeys }: IServerSideGetRowsRequest, rows: RowData): Partial<Row>[] {
    if (rowGroupCols.length > groupKeys.length) {
        const groupCol = rowGroupCols[groupKeys.length];
        const field = groupCol.field! as keyof Row;
        return rows.map((row) => ({ [field]: row[field] }));
    }
    return rows;
}

function where({ rowGroupCols, groupKeys }: IServerSideGetRowsRequest): RowData {
    if (groupKeys.length) {
        return GROUP_ROW_DATA.filter((row) => {
            for (let i = 0; i < groupKeys.length; i++) {
                const field = rowGroupCols[i].field! as keyof Row;
                if (row[field] === groupKeys[i]) {
                    return true;
                }
            }
            return false;
        });
    }
    return GROUP_ROW_DATA;
}

function group({ rowGroupCols, groupKeys }: IServerSideGetRowsRequest, rows: RowData): RowData | GroupedRowData {
    if (rowGroupCols.length > groupKeys.length) {
        const groupCol = rowGroupCols[groupKeys.length];
        return groupBy(rows, groupCol.field! as keyof Row);
    }
    return rows;
}

function groupBy(objs: RowData, key: keyof Row): GroupedRowData {
    return objs.reduce((acc, obj) => {
        const value = obj[key];
        acc[value] ||= [];
        acc[value].push(obj);
        return acc;
    }, {});
}

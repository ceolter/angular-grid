import { ClientSideRowModelModule } from 'ag-grid-community';
import type {
    ColDef,
    GetRowIdParams,
    GridApi,
    GridOptions,
    RowSelectedEvent,
    ValueFormatterParams,
} from 'ag-grid-community';
import { createGrid } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

interface ICar {
    make: string;
    model: string;
    price: number;
}

interface IDiscountRate {
    discount: number;
}

const columnDefs: ColDef<ICar>[] = [
    { headerName: 'Make', field: 'make' },
    { headerName: 'Model', field: 'model' },
    {
        headerName: 'Price',
        field: 'price',
        valueFormatter: (params: ValueFormatterParams<ICar, number>) => {
            // params.value: number
            return '£' + params.value;
        },
    },
];

// Data with ICar interface
const rowData: ICar[] = [
    { make: 'Toyota', model: 'Celica', price: 35000 },
    { make: 'Ford', model: 'Mondeo', price: 32000 },
    { make: 'Porsche', model: 'Boxster', price: 72000 },
];

let gridApi: GridApi<ICar>;

// Pass ICar as generic row data type
const gridOptions: GridOptions<ICar> = {
    columnDefs,
    rowData,
    rowSelection: {
        mode: 'multiRow',
    },
    context: {
        discount: 0.9,
    } as IDiscountRate,
    // Type specified her but can be omitted and inferred by Typescript
    getRowId: (params: GetRowIdParams<ICar>) => {
        // params.data : ICar
        return params.data.make + params.data.model;
    },
    onRowSelected: (event: RowSelectedEvent<ICar, IDiscountRate>) => {
        // event.data: ICar | undefined
        if (event.data && event.node.isSelected()) {
            const price = event.data.price;
            // event.context: IContext
            const discountRate = event.context.discount;
            console.log('Price with 10% discount:', price * discountRate);
        }
    },
};

function onShowSelection() {
    // api.getSelectedRows() : ICar[]
    const cars: ICar[] = gridApi!.getSelectedRows();
    console.log(
        'Selected cars are',
        cars.map((c) => `${c.make} ${c.model}`)
    );
}

// wait for the document to be loaded, otherwise
// AG Grid will not find the div in the document.
document.addEventListener('DOMContentLoaded', function () {
    // lookup the container we want the Grid to use
    const eGridDiv = document.querySelector<HTMLElement>('#myGrid')!;

    // create the grid passing in the div to use together with the columns & data we want to use
    gridApi = createGrid(eGridDiv, gridOptions);
});

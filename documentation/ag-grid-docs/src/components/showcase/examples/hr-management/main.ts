import { getData } from './data';
import { flagRenderer } from './flagRenderer';
import { imageCellRenderer } from './imageCellRenderer';
import './styles.css';
import { tagCellRenderer } from './tagCellRenderer';

let gridApi;

const gridOptions = {
    columnDefs: [
        // we're using the auto group column by default!
        {
            headerName: 'Employee',
            field: 'name',
            cellDataType: 'text',
            width: '220px',
            cellRenderer: 'agGroupCellRenderer',
            cellRendererParams: {
                innerRenderer: imageCellRenderer,
            },
        },
        {
            headerName: 'Location',
            field: 'location',
            cellDataType: 'text',
            width: '200px',
            cellRenderer: flagRenderer, // Use the custom cell renderer
        },
        {
            headerName: 'Title',
            field: 'department',
            cellDataType: 'text',
            width: '200px',
            cellRenderer: tagCellRenderer, // Use the custom cell renderer
        },
        { field: 'employmentType' },
        { field: 'basicMonthlySalary', cellDataType: 'number', valueFormatter: currencyFormatter },
        { field: 'employeeId', cellDataType: 'number' },
        { field: 'paymentMethod', cellDataType: 'text' },
        { field: 'paymentStatus', cellDataType: 'text' },
    ],
    rowData: getData(),
    groupDefaultExpanded: 0,
    getDataPath: (data) => {
        return data.orgHierarchy;
    },
    masterDetail: true, // enable master detail
    detailCellRendererParams: {
        detailGridOptions: {
            columnDefs: [
                { field: 'attribute', headerName: 'Attribute', width: 150 },
                { field: 'value', headerName: 'Value', width: 150 },
            ],
            defaultColDef: {
                flex: 1,
                minWidth: 100,
            },
        },
        getDetailRowData: function (params) {
            // Here you can provide the detail data for each row
            params.successCallback([
                { attribute: 'Age', value: params.data.age },
                { attribute: 'Hire Date', value: params.data.hireDate },
                { attribute: 'Department', value: params.data.department },
                // Add more attributes as needed
            ]);
        },
    },
};

function currencyFormatter(params) {
    const locale = 'en-US';
    const value = parseFloat(params.value).toFixed(2);
    const currency = params.data.currency;
    const numberFormatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currencyDisplay: 'code',
        currency,
        maximumFractionDigits: 2,
    });

    return numberFormatter.format(value);
}

function formatNumber(number) {
    return Math.floor(number).toLocaleString();
}

function onFilterTextBoxChanged() {
    gridApi.setGridOption('quickFilterText', document.getElementById('filter-text-box').value);
}

// wait for the document to be loaded, otherwise
// AG Grid will not find the div in the document.
document.addEventListener('DOMContentLoaded', function () {
    // lookup the container we want the Grid to use
    const gridDiv = document.querySelector('#myGrid');

    // create the grid passing in the div to use together with the columns & data we want to use
    gridApi = agGrid.createGrid(gridDiv, gridOptions);
});

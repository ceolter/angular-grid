import { getData } from './data';
import { imageCellRenderer } from './imageCellRenderer';
import './styles.css';
let gridApi;

const gridOptions = {
    columnDefs: [
        // we're using the auto group column by default!
        {
            headerName: 'Employee',
            field: 'name',
            cellDataType: 'text',
            pinned: 'left',
            width: "250px",
            cellRenderer: imageCellRenderer, // Use the custom cell renderer
        },
        { field: 'jobTitle' },
        { field: 'employmentType' },
        { field: 'department' },
        { field: 'employeeId', cellDataType: 'number' },
        { field: 'location' },
        { field: 'joinDate', cellDataType: 'dateString' },
        { field: 'basicMonthlySalary', cellDataType: 'number', valueFormatter: currencyFormatter },
        { field: 'paymentMethod' },
        { field: 'paymentStatus' },
    ],
    defaultColDef: {
        flex: 1,
        editable: true,
    },
    rowData: getData(),
    groupDefaultExpanded: -1, // expand all groups by default
    getDataPath: (data) => {
        return data.orgHierarchy;
    },
};

function currencyFormatter(params) {
    return '$' + formatNumber(params.value);
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

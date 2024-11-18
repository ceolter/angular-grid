import { ClientSideRowModelModule } from 'ag-grid-community';
import type {
    ColDef,
    GetRowIdParams,
    GridApi,
    GridOptions,
    GridReadyEvent,
    ICellRendererComp,
    ICellRendererParams,
} from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry, createGrid } from 'ag-grid-community';

ModuleRegistry.registerModules([AllCommunityModule, ClientSideRowModelModule]);

class SportRenderer implements ICellRendererComp {
    eGui!: HTMLElement;

    init(params: ICellRendererParams) {
        this.eGui = document.createElement('i');

        this.eGui.addEventListener('click', () => {
            params.api.applyTransaction({ remove: [params.node.data] });
        });

        this.eGui.classList.add('far', 'fa-trash-alt');
        this.eGui.style.cursor = 'pointer';
    }

    getGui() {
        return this.eGui;
    }

    refresh(params: ICellRendererParams): boolean {
        return false;
    }
}

const leftColumnDefs: ColDef[] = [
    {
        rowDrag: true,
        maxWidth: 50,
        suppressHeaderMenuButton: true,
        suppressHeaderFilterButton: true,
        rowDragText: (params, dragItemCount) => {
            if (dragItemCount > 1) {
                return dragItemCount + ' athletes';
            }
            return params.rowNode!.data.athlete;
        },
    },
    { field: 'athlete' },
    { field: 'sport' },
];

const rightColumnDefs: ColDef[] = [
    {
        rowDrag: true,
        maxWidth: 50,
        suppressHeaderMenuButton: true,
        suppressHeaderFilterButton: true,
        rowDragText: (params, dragItemCount) => {
            if (dragItemCount > 1) {
                return dragItemCount + ' athletes';
            }
            return params.rowNode!.data.athlete;
        },
    },
    { field: 'athlete' },
    { field: 'sport' },
    {
        suppressHeaderMenuButton: true,
        suppressHeaderFilterButton: true,
        maxWidth: 50,
        cellRenderer: SportRenderer,
    },
];
let leftApi: GridApi;
const leftGridOptions: GridOptions = {
    defaultColDef: {
        flex: 1,
        minWidth: 100,
        filter: true,
    },
    rowSelection: {
        mode: 'multiRow',
    },
    rowDragMultiRow: true,
    getRowId: (params: GetRowIdParams) => {
        return params.data.athlete;
    },
    rowDragManaged: true,
    suppressMoveWhenRowDragging: true,
    columnDefs: leftColumnDefs,
    onGridReady: (params) => {
        addGridDropZone(params);
    },
};
let rightApi: GridApi;
const rightGridOptions: GridOptions = {
    defaultColDef: {
        flex: 1,
        minWidth: 100,
        filter: true,
    },
    getRowId: (params: GetRowIdParams) => {
        return params.data.athlete;
    },
    rowDragManaged: true,
    columnDefs: rightColumnDefs,
};

function addGridDropZone(params: GridReadyEvent) {
    const dropZoneParams = rightApi!.getRowDropZoneParams({
        onDragStop: (params) => {
            const deselectCheck = (document.querySelector('input#deselect') as HTMLInputElement).checked;
            const moveCheck = (document.querySelector('input#move') as HTMLInputElement).checked;
            const nodes = params.nodes;

            if (moveCheck) {
                leftApi!.applyTransaction({
                    remove: nodes.map(function (node) {
                        return node.data;
                    }),
                });
            } else if (deselectCheck) {
                leftApi!.setNodesSelected({ nodes, newValue: false });
            }
        },
    });

    params.api.addRowDropZone(dropZoneParams);
}

function loadGrid(options: GridOptions, oldApi: GridApi, side: string, data: any[]) {
    const grid = document.querySelector<HTMLElement>('#e' + side + 'Grid')!;

    oldApi?.destroy();

    options.rowData = data;
    return createGrid(grid, options);
}

function resetInputs() {
    const inputs = document.querySelectorAll('.example-toolbar input') as NodeListOf<HTMLInputElement>;
    const checkbox = inputs[inputs.length - 1];

    if (!checkbox.checked) {
        checkbox.click();
    }

    inputs[0].checked = true;
}

function loadGrids() {
    fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
        .then((response) => response.json())
        .then(function (data) {
            const athletes: any[] = [];
            let i = 0;

            while (athletes.length < 20 && i < data.length) {
                const pos = i++;
                if (
                    athletes.some(function (rec) {
                        return rec.athlete === data[pos].athlete;
                    })
                ) {
                    continue;
                }
                athletes.push(data[pos]);
            }

            leftApi = loadGrid(leftGridOptions, leftApi, 'Left', athletes);
            rightApi = loadGrid(rightGridOptions, rightApi, 'Right', []);
        });
}

const resetBtn = document.querySelector('button.reset')!;

resetBtn.addEventListener('click', () => {
    resetInputs();
    loadGrids();
});

loadGrids();

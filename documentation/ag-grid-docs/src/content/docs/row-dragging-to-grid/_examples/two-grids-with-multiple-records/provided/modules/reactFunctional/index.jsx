import React, { StrictMode, useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

import {
    ClientSideRowModelApiModule,
    ClientSideRowModelModule,
    ModuleRegistry,
    RowDragModule,
    RowSelectionModule,
    TextFilterModule,
    ValidationModule,
} from 'ag-grid-community';
import { AgGridReact } from 'ag-grid-react';

import './styles.css';

ModuleRegistry.registerModules([
    ClientSideRowModelApiModule,
    TextFilterModule,
    RowDragModule,
    RowSelectionModule,
    ClientSideRowModelModule,
    ValidationModule /* Development Only */,
]);

const SportRenderer = (props) => {
    return (
        <i
            className="far fa-trash-alt"
            style={{ cursor: 'pointer' }}
            onClick={() => props.api.applyTransaction({ remove: [props.node.data] })}
        ></i>
    );
};

const leftColumns = [
    {
        rowDrag: true,
        maxWidth: 50,
        suppressHeaderMenuButton: true,
        suppressHeaderFilterButton: true,
        rowDragText: (params, dragItemCount) => {
            if (dragItemCount > 1) {
                return dragItemCount + ' athletes';
            }
            return params.rowNode.data.athlete;
        },
    },
    { field: 'athlete' },
    { field: 'sport' },
];

const rightColumns = [
    {
        rowDrag: true,
        maxWidth: 50,
        suppressHeaderMenuButton: true,
        suppressHeaderFilterButton: true,
        rowDragText: (params, dragItemCount) => {
            if (dragItemCount > 1) {
                return dragItemCount + ' athletes';
            }
            return params.rowNode.data.athlete;
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

const defaultColDef = {
    flex: 1,
    minWidth: 100,
    filter: true,
};

const rowSelection = {
    mode: 'multiRow',
};

const GridExample = () => {
    const [leftApi, setLeftApi] = useState(null);
    const [rightApi, setRightApi] = useState(null);
    const [rawData, setRawData] = useState([]);
    const [leftRowData, setLeftRowData] = useState(null);
    const [rightRowData, setRightRowData] = useState([]);
    const [radioChecked, setRadioChecked] = useState(0);

    useEffect(() => {
        if (!rawData.length) {
            fetch('https://www.ag-grid.com/example-assets/olympic-winners.json')
                .then((resp) => resp.json())
                .then((data) => {
                    const athletes = [];
                    let i = 0;

                    while (athletes.length < 20 && i < data.length) {
                        var pos = i++;
                        if (athletes.some((rec) => rec.athlete === data[pos].athlete)) {
                            continue;
                        }
                        athletes.push(data[pos]);
                    }
                    setRawData(athletes);
                });
        }
    }, [rawData]);

    const loadGrids = useCallback(() => {
        setLeftRowData([...rawData]);
        setRightRowData([]);
        leftApi.deselectAll();
    }, [leftApi, rawData]);

    useEffect(() => {
        if (rawData.length) {
            loadGrids();
        }
    }, [rawData, loadGrids]);

    const reset = () => {
        setRadioChecked(0);
        loadGrids();
    };

    const onRadioChange = (e) => {
        setRadioChecked(parseInt(e.target.value, 10));
    };

    const getRowId = (params) => params.data.athlete;

    const onDragStop = useCallback(
        (params) => {
            var nodes = params.nodes;

            if (radioChecked === 0) {
                leftApi.applyTransaction({
                    remove: nodes.map(function (node) {
                        return node.data;
                    }),
                });
            } else if (radioChecked === 1) {
                leftApi.setNodesSelected({ nodes, newValue: false });
            }
        },
        [leftApi, radioChecked]
    );

    useEffect(() => {
        if (!leftApi || !rightApi) {
            return;
        }
        const dropZoneParams = rightApi.getRowDropZoneParams({ onDragStop });

        leftApi.removeRowDropZone(dropZoneParams);
        leftApi.addRowDropZone(dropZoneParams);
    }, [leftApi, rightApi, onDragStop]);

    const onGridReady = (params, side) => {
        if (side === 0) {
            setLeftApi(params.api);
        }

        if (side === 1) {
            setRightApi(params.api);
        }
    };

    const getTopToolBar = () => (
        <div className="example-toolbar panel panel-default">
            <div className="panel-body">
                <div onChange={onRadioChange}>
                    <input type="radio" id="move" name="radio" value="0" checked={radioChecked === 0} />{' '}
                    <label htmlFor="move">Remove Source Rows</label>
                    <input type="radio" id="deselect" name="radio" value="1" checked={radioChecked === 1} />{' '}
                    <label htmlFor="deselect">Only Deselect Source Rows</label>
                    <input type="radio" id="none" name="radio" value="2" checked={radioChecked === 2} />{' '}
                    <label htmlFor="none">None</label>
                </div>
                <span className="input-group-button">
                    <button
                        type="button"
                        className="btn btn-default reset"
                        style={{ marginLeft: '5px' }}
                        onClick={reset}
                    >
                        <i className="fas fa-redo" style={{ marginRight: '5px' }}></i>Reset
                    </button>
                </span>
            </div>
        </div>
    );

    const getGridWrapper = (id) => (
        <div className="panel panel-primary" style={{ marginRight: '10px' }}>
            <div className="panel-heading">{id === 0 ? 'Athletes' : 'Selected Athletes'}</div>
            <div className="panel-body" style={{ height: '100%' }}>
                <AgGridReact
                    defaultColDef={defaultColDef}
                    getRowId={getRowId}
                    rowDragManaged={true}
                    rowSelection={id === 0 ? rowSelection : undefined}
                    rowDragMultiRow={id === 0}
                    suppressMoveWhenRowDragging={id === 0}
                    rowData={id === 0 ? leftRowData : rightRowData}
                    columnDefs={id === 0 ? leftColumns : rightColumns}
                    onGridReady={(params) => onGridReady(params, id)}
                />
            </div>
        </div>
    );

    return (
        <div className="top-container">
            {getTopToolBar()}
            <div className="grid-wrapper">
                {getGridWrapper(0)}
                {getGridWrapper(1)}
            </div>
        </div>
    );
};

const root = createRoot(document.getElementById('root'));
root.render(
    <StrictMode>
        <GridExample />
    </StrictMode>
);

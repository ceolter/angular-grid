export const modules = {
    groups: [
        {
            moduleName: 'CommunityDefaultModule',
            name: 'Community Defaults',
        },
        {
            moduleName: 'EnterpriseDefaultModule',
            name: 'Enterprise Defaults',
            isEnterprise: true,
        },
        {
            moduleName: 'ValidationModule',
            name: 'Validation (Dev Mode)',
        },
        {
            moduleName: 'SparklinesModule',
            name: 'Sparklines',
            isEnterprise: true,
        },
        {
            moduleName: 'GridChartsModule',
            name: 'Integrated Charts',
            isEnterprise: true,
        },
        {
            name: 'Columns',
            children: [
                {
                    name: 'Column Headers',
                    children: [
                        {
                            moduleName: 'ColumnHeaderCompModule',
                            name: 'Column Header Component',
                        },
                        {
                            moduleName: 'ColumnGroupHeaderCompModule',
                            name: 'Column Group Header Component',
                        },
                    ],
                },
                {
                    moduleName: 'ColumnGroupModule',
                    name: 'Column Groups',
                },
                {
                    name: 'Column Sizing',
                    children: [
                        {
                            moduleName: 'ColumnAutoSizeModule',
                            name: 'Column Auto-Sizing',
                        },
                        {
                            moduleName: 'ColumnResizeModule',
                            name: 'Column Resizing',
                        },
                        {
                            moduleName: 'ColumnFlexModule',
                            name: 'Column Flex',
                        },
                    ],
                },
                {
                    moduleName: 'ColumnMoveModule',
                    name: 'Column Moving',
                    children: [
                        {
                            moduleName: 'ColumnMoveCoreModule',
                            name: 'Core Column Moving',
                        },
                        {
                            moduleName: 'ColumnAnimationModule',
                            name: 'Column Animations',
                        },
                    ],
                },
                {
                    moduleName: 'PinnedColumnModule',
                    name: 'Column Pinning',
                },
                {
                    moduleName: 'ColumnHoverModule',
                    name: 'Column Hover',
                },
            ],
        },
        {
            name: 'Rows',
            children: [
                {
                    moduleName: 'SortModule',
                    name: 'Row Sorting',
                    children: [
                        {
                            moduleName: 'SortCoreModule',
                            name: 'Core Row Sorting',
                        },
                        {
                            moduleName: 'SortIndicatorCompModule',
                            name: 'Header Component Sort Indicator',
                        },
                    ],
                },
                {
                    moduleName: 'PinnedRowModule',
                    name: 'Row Pinning',
                },
                {
                    moduleName: 'RowAutoHeightModule',
                    name: 'Auto Row Height',
                },
                {
                    moduleName: 'RowStyleModule',
                    name: 'Styling Rows',
                },
                {
                    moduleName: 'PaginationModule',
                    name: 'Row Pagination',
                },
                {
                    moduleName: 'RowDragModule',
                    name: 'Row Dragging',
                },
            ],
        },
        {
            name: 'Cells',
            children: [
                {
                    name: 'Cell Content',
                    children: [
                        {
                            name: 'Cell Components',
                            children: [
                                {
                                    moduleName: 'CheckboxCellRendererModule',
                                    name: 'Checkbox Cell Renderer',
                                },
                                {
                                    moduleName: 'CellRendererFunctionModule',
                                    name: 'Cell Renderer Function',
                                },
                            ],
                        },
                        {
                            moduleName: 'DataTypeModule',
                            name: 'Cell Data Types',
                        },
                    ],
                },
                {
                    moduleName: 'CellStyleModule',
                    name: 'Styling Cells',
                },
                {
                    name: 'Highlighting Changes',
                    children: [
                        {
                            moduleName: 'AnimateShowChangeCellRendererModule',
                            name: 'Animate Show Change Cell Renderer',
                        },
                        {
                            moduleName: 'AnimateSlideCellRendererModule',
                            name: 'Animate Slide Cell Renderer',
                        },
                        {
                            moduleName: 'CellFlashModule',
                            name: 'Cell Flash',
                        },
                    ],
                },
                {
                    moduleName: 'TooltipModule',
                    name: 'Tooltips',
                    children: [
                        {
                            moduleName: 'TooltipCoreModule',
                            name: 'Core Tooltips',
                        },
                        {
                            moduleName: 'TooltipCompModule',
                            name: 'Tooltip Component',
                        },
                    ],
                },
                {
                    moduleName: 'ExpressionModule',
                    name: 'Expressions',
                },
            ],
        },
        {
            name: 'Filtering',
            children: [
                {
                    moduleName: 'FilterModule',
                    name: 'Community Filter Module',
                },
                {
                    moduleName: 'FilterCoreModule',
                    name: 'Core Filtering',
                },
                {
                    name: 'Column Filters',
                    children: [
                        {
                            moduleName: 'ColumnFilterModule',
                            name: 'Core Column Filters',
                        },
                        {
                            moduleName: 'SimpleFilterModule',
                            name: 'Text Filter / Number Filter / Date Filter',
                        },
                        {
                            moduleName: 'FloatingFilterModule',
                            name: 'Floating Filters',
                        },
                        {
                            moduleName: 'SimpleFloatingFilterModule',
                            name: 'Text Floating Filter / Number Floating Filter / Date Floating Filter',
                        },
                        {
                            moduleName: 'ReadOnlyFloatingFilterModule',
                            name: 'Read Only Floating Filter',
                        },
                        {
                            moduleName: 'SetFilterModule',
                            name: 'Set Filter',
                            isEnterprise: true,
                            children: [
                                {
                                    moduleName: 'SetFilterCoreModule',
                                    name: 'Core Set Filter',
                                    isEnterprise: true,
                                },
                                {
                                    moduleName: 'SetFloatingFilterModule',
                                    name: 'Set Floating Filter',
                                    isEnterprise: true,
                                },
                            ],
                        },
                        {
                            moduleName: 'MultiFilterModule',
                            name: 'Multi Filter',
                            isEnterprise: true,
                            children: [
                                {
                                    moduleName: 'MultiFilterCoreModule',
                                    name: 'Core Multi Filter',
                                    isEnterprise: true,
                                },
                                {
                                    moduleName: 'MultiFloatingFilterModule',
                                    name: 'Multi Floating Filter',
                                    isEnterprise: true,
                                },
                            ],
                        },
                    ],
                },
                {
                    moduleName: 'AdvancedFilterModule',
                    name: 'AdvancedFilterModule',
                    isEnterprise: true,
                },
                {
                    moduleName: 'QuickFilterModule',
                    name: 'Quick Filter',
                },
            ],
        },
        {
            name: 'Selection',
            children: [
                {
                    moduleName: 'RowSelectionModule',
                    name: 'Row Selection',
                    children: [
                        {
                            moduleName: 'RowSelectionCoreModule',
                            name: 'Core Row Selection',
                        },
                        {
                            moduleName: 'RowSelectionApiModule',
                            name: 'Row Selection API',
                        },
                        {
                            moduleName: 'SelectionColumnModule',
                            name: 'Selection Column',
                        },
                    ],
                },
                {
                    moduleName: 'CellSelectionModule',
                    name: 'Cell Selection',
                    isEnterprise: true,
                    children: [
                        {
                            moduleName: 'CellSelectionCoreModule',
                            name: 'Core Cell Selection',
                            isEnterprise: true,
                        },
                        {
                            moduleName: 'CellSelectionRangeHandleModule',
                            name: 'Range Handle',
                            isEnterprise: true,
                        },
                        {
                            moduleName: 'CellSelectionFillHandleModule',
                            name: 'Fill Handle',
                            isEnterprise: true,
                        },
                    ],
                },
            ],
        },
        {
            name: 'Editing',
            children: [
                {
                    moduleName: 'EditModule',
                    name: 'Community Editing Module',
                },
                {
                    moduleName: 'EditCoreModule',
                    name: 'Basic Editing',
                },
                {
                    moduleName: 'AllCommunityEditorsModule',
                    name: 'Provided Cell Editors',
                    children: [
                        {
                            moduleName: 'DefaultEditorModule',
                            name: 'Text Editor',
                        },
                        {
                            moduleName: 'LargeTextEditorModule',
                            name: 'Large Text Editor',
                        },
                        {
                            moduleName: 'SelectEditorModule',
                            name: 'Select Editor',
                        },
                        {
                            moduleName: 'RichSelectModule',
                            name: 'Rich Select Editor',
                            isEnterprise: true,
                        },
                        {
                            moduleName: 'DataTypeEditorsModule',
                            name: 'Number / Date / Checkbox Editors',
                        },
                    ],
                },
                {
                    moduleName: 'UndoRedoEditModule',
                    name: 'Undo / Redo Edits',
                },
                {
                    moduleName: 'FullRowEditModule',
                    name: 'Full Row Editing',
                },
            ],
        },
        {
            name: 'Client-Side Row Model',
            children: [
                {
                    moduleName: 'ClientSideRowModelCoreModule',
                    name: 'Core Client-Side Row Model',
                },
                {
                    moduleName: 'ClientSideRowModelApiModule',
                    name: 'Client-Side Row Model API',
                },
                {
                    moduleName: 'ClientSideRowModelSortModule',
                    name: 'Client-Side Row Model Row Sorting',
                },
                {
                    moduleName: 'ClientSideRowModelFilterModule',
                    name: 'Client-Side Row Model Filtering',
                },
                {
                    moduleName: 'ClientSideRowModelHierarchyModule',
                    name: 'Client-Side Row Model Row Hierarchy',
                    isEnterprise: true,
                },
                {
                    moduleName: 'ClientSideRowModelDefaultModule',
                    name: 'Default Client-Side Row Model',
                },
            ],
        },
        {
            name: 'Interactivity',
            children: [
                {
                    moduleName: 'KeyboardNavigationModule',
                    name: 'Keyboard Navigation',
                },
                {
                    moduleName: 'TouchModule',
                    name: 'Touch',
                },
                {
                    moduleName: 'AriaModule',
                    name: 'Accessibility (ARIA)',
                },
                {
                    moduleName: 'LocaleModule',
                    name: 'Localisation',
                },
            ],
        },
        {
            name: 'Row Grouping',
            children: [
                {
                    moduleName: 'RowGroupingCoreModule',
                    name: 'Core Row Grouping',
                    isEnterprise: true,
                },
                {
                    moduleName: 'GroupCellRendererModule',
                    name: 'Group Cell Renderer',
                    isEnterprise: true,
                },
                {
                    moduleName: 'RowGroupingPanelModule',
                    name: 'Row Grouping Panel',
                    isEnterprise: true,
                },
                {
                    moduleName: 'GroupFilterModule',
                    name: 'Group Filter',
                    isEnterprise: true,
                },
                {
                    moduleName: 'GroupFloatingFilterModule',
                    name: 'Group Floating Filter',
                    isEnterprise: true,
                },
                {
                    moduleName: 'StickyRowModule',
                    name: 'Sticky Rows',
                },
                {
                    moduleName: 'RowGroupingOnlyModule',
                    name: 'Default Row Grouping',
                    isEnterprise: true,
                },
            ],
        },
        {
            name: 'Pivoting',
            children: [
                {
                    moduleName: 'PivotCoreModule',
                    name: 'Core Pivoting',
                    isEnterprise: true,
                },
                {
                    moduleName: 'PivotModule',
                    name: 'Default Pivoting',
                    isEnterprise: true,
                },
            ],
        },
        {
            name: 'Tree Data',
            children: [
                {
                    moduleName: 'TreeDataCoreModule',
                    name: 'Core Tree Data',
                    isEnterprise: true,
                },
                {
                    moduleName: 'TreeDataModule',
                    name: 'Default Tree Data',
                    isEnterprise: true,
                },
            ],
        },
        {
            name: 'Master Detail',
            children: [
                {
                    moduleName: 'MasterDetailCoreModule',
                    name: 'Core Master Detail',
                    isEnterprise: true,
                },
                {
                    moduleName: 'MasterDetailModule',
                    name: 'Default Master Detail',
                    isEnterprise: true,
                },
            ],
        },
        {
            name: 'Accessories',
            children: [
                {
                    name: 'Tool Panels',
                    isEnterprise: true,
                    children: [
                        {
                            moduleName: 'SideBarModule',
                            name: 'Side Bar',
                            isEnterprise: true,
                        },
                        {
                            moduleName: 'ColumnsToolPanelModule',
                            name: 'Columns Tool Panel',
                            isEnterprise: true,
                            children: [
                                {
                                    moduleName: 'ColumnsToolPanelCoreModule',
                                    name: 'Core Columns Tool Panel',
                                    isEnterprise: true,
                                },
                                {
                                    moduleName: 'ColumnsToolPanelRowGroupingModule',
                                    name: 'Columns Tool Panel Row Grouping',
                                    isEnterprise: true,
                                },
                            ],
                        },
                        {
                            moduleName: 'FiltersToolPanelModule',
                            name: 'Filters Tool Panel',
                            isEnterprise: true,
                        },
                    ],
                },
                {
                    moduleName: 'ColumnMenuModule',
                    name: 'Column Menu',
                    isEnterprise: true,
                },
                {
                    moduleName: 'ContextMenuModule',
                    name: 'Context Menu',
                    isEnterprise: true,
                },
                {
                    moduleName: 'StatusBarModule',
                    name: 'Status Bar',
                    isEnterprise: true,
                    children: [
                        {
                            moduleName: 'StatusBarCoreModule',
                            name: 'Core Status Bar',
                            isEnterprise: true,
                        },
                        {
                            moduleName: 'StatusBarSelectionModule',
                            name: 'Status Bar Selection Component',
                            isEnterprise: true,
                        },
                    ],
                },
                {
                    moduleName: 'OverlayModule',
                    name: 'Overlays',
                    children: [
                        {
                            moduleName: 'OverlayCoreModule',
                            name: 'Core Overlays',
                        },
                        {
                            moduleName: 'LoadingOverlayModule',
                            name: 'Loading Overlay',
                        },
                        {
                            moduleName: 'NoRowsOverlayModule',
                            name: 'No Rows Overlay',
                        },
                    ],
                },
            ],
        },
        {
            name: 'Server-Side Data',
            children: [
                {
                    name: 'Server-Side Row Model',
                    children: [
                        {
                            moduleName: 'ServerSideRowModelCoreModule',
                            name: 'Core Server-Side Row Model',
                            isEnterprise: true,
                        },
                        {
                            moduleName: 'ServerSideRowModelApiModule',
                            name: 'Server-Side Row Model API',
                            isEnterprise: true,
                        },
                        {
                            moduleName: 'ServerSideRowModelRowSelectionModule',
                            name: 'Server-Side Row Model Row Selection',
                            isEnterprise: true,
                        },
                        {
                            moduleName: 'ServerSideRowModelSortModule',
                            name: 'Server-Side Row Model Row Sorting',
                            isEnterprise: true,
                        },
                        {
                            moduleName: 'ServerSideRowModelHierarchyModule',
                            name: 'Server-Side Row Model Row Hierarchy',
                            isEnterprise: true,
                        },
                        {
                            name: 'Loading Component',
                            isEnterprise: true,
                            children: [
                                {
                                    moduleName: 'LoadingCellRendererModule',
                                    name: 'Loading Cell Renderer',
                                    isEnterprise: true,
                                },
                                {
                                    moduleName: 'SkeletonCellRendererModule',
                                    name: 'Skeleton Cell Renderer',
                                    isEnterprise: true,
                                },
                            ],
                        },
                        {
                            moduleName: 'ServerSideRowModelDefaultModule',
                            name: 'Default Server-Side Row Model',
                            isEnterprise: true,
                        },
                    ],
                },
                {
                    name: 'Viewport Row Model',
                    children: [
                        {
                            moduleName: 'ViewportRowModelCoreModule',
                            name: 'Core Viewport Row Model',
                            isEnterprise: true,
                        },
                        {
                            moduleName: 'ViewportRowModelDefaultModule',
                            name: 'Default Viewport Row Model',
                            isEnterprise: true,
                        },
                    ],
                },
                {
                    name: 'Infinite Row Model',
                    children: [
                        {
                            moduleName: 'InfiniteRowModelCoreModule',
                            name: 'Core Infinite Row Model',
                        },
                        {
                            moduleName: 'InfiniteRowModelApiModule',
                            name: 'Infinite Row Model API',
                        },
                        {
                            moduleName: 'InfiniteRowModelDefaultModule',
                            name: 'Default Infinite Row Model',
                        },
                    ],
                },
            ],
        },
        {
            name: 'Import & Export',
            children: [
                {
                    moduleName: 'CsvExportModule',
                    name: 'CSV Export',
                },

                {
                    moduleName: 'ExcelExportModule',
                    name: 'Excel Export',
                    isEnterprise: true,
                },
                {
                    moduleName: 'ClipboardModule',
                    name: 'Clipboard',
                    isEnterprise: true,
                },
                {
                    moduleName: 'NativeDragModule',
                    name: 'Drag & Drop',
                },
            ],
        },
        {
            name: 'Performance',
            children: [
                {
                    moduleName: 'ValueCacheModule',
                    name: 'Value Cache',
                },
                {
                    moduleName: 'AnimationFrameModule',
                    name: 'Animation Frames',
                },
            ],
        },
        {
            name: 'Other',
            children: [
                {
                    moduleName: 'ChangeDetectionModule',
                    name: 'Change Detection',
                },
                {
                    moduleName: 'AlignedGridsModule',
                    name: 'Aligned Grids',
                },
            ],
        },
        {
            name: 'API',
            children: [
                {
                    moduleName: 'StateModule',
                    name: 'Grid State',
                },
                {
                    moduleName: 'ColumnApiModule',
                    name: 'Column API',
                },
                {
                    moduleName: 'RowApiModule',
                    name: 'Row API',
                },
                {
                    moduleName: 'CellApiModule',
                    name: 'Cell API',
                },
                {
                    moduleName: 'ScrollApiModule',
                    name: 'Scrolling API',
                },
                {
                    moduleName: 'RenderApiModule',
                    name: 'Rendering API',
                },
                {
                    moduleName: 'GetColumnDefsApiModule',
                    name: 'Get Column Definitions API',
                },
                {
                    moduleName: 'EventApiModule',
                    name: 'Event API',
                },
            ],
        },
    ],
};

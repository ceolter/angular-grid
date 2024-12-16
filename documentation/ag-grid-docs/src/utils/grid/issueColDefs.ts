import ChevronButtonCellRenderer from '@components/grid/ChevronButtonRenderer';
import IssueTypeCellRenderer from '@components/grid/IssueTypeRenderer';
import PaddingCellRenderer from '@components/grid/PaddingCellRenderer';

const getIssueNumber = (issueKey: string) => parseInt(issueKey.replace('AG-', ''));
export const IssueColDef = {
    colId: 'key',
    field: 'key',
    headerName: 'Issue',
    width: 150,
    maxWidth: 150,
    comparator: (a, b) => {
        const valA = a == null ? 0 : getIssueNumber(a);
        const valB = b == null ? 0 : getIssueNumber(b);
        if (valA === valB) return 0;
        return valA > valB ? 1 : -1;
    },
    cellRendererSelector: (params) => {
        if (
            params.node.data.moreInformation ||
            params.node.data.deprecationNotes ||
            params.node.data.breakingChangesNotes
        ) {
            return {
                component: ChevronButtonCellRenderer,
            };
        }
        return {
            component: PaddingCellRenderer,
        };
    },
    filter: 'agSetColumnFilter',
};
export const IssueTypeColDef = {
    field: 'issueType',
    valueFormatter: (params) => (params.value === 'Bug' ? 'Defect' : 'Feature Request'),
    cellRenderer: IssueTypeCellRenderer,
    width: 175,
    resizable: false,
    filterParams: {
        valueFormatter: (params) => (params.value === 'Bug' ? 'Defect' : 'Feature Request'),
    },
};

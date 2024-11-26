import type { IHeaderGroupParams } from 'ag-grid-community';

export interface ICustomInnerHeaderGroupParams {
    icon: string;
}

export class CustomInnerHeaderGroup {
    private agParams!: ICustomInnerHeaderGroupParams & IHeaderGroupParams;
    private eGui!: HTMLDivElement;

    init(agParams: ICustomInnerHeaderGroupParams & IHeaderGroupParams) {
        const eGui = (this.eGui = document.createElement('div'));
        eGui.classList.add('customInnerHeaderGroup');
        const textNode = document.createElement('span');

        textNode.textContent = agParams.displayName;

        if (agParams.icon) {
            const icon = document.createElement('i');
            icon.classList.add('fa', `${agParams.icon}`);
            eGui.appendChild(icon);
        }

        eGui.appendChild(textNode);
    }

    getGui() {
        return this.eGui;
    }
}

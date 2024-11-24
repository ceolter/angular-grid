import type { IHeaderParams } from 'ag-grid-community';

export interface ICustomInnerHeaderParams {
    icon: string;
}

export class CustomInnerHeader {
    private agParams!: ICustomInnerHeaderParams & IHeaderParams;
    private eGui!: HTMLDivElement;

    init(agParams: ICustomInnerHeaderParams & IHeaderParams) {
        const eGui = (this.eGui = document.createElement('div'));
        eGui.classList.add('customInnerHeader');
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

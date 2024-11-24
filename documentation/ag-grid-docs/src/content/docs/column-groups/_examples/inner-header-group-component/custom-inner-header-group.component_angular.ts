import { NgClass } from '@angular/common';
import { Component } from '@angular/core';

import type { IHeaderGroupAngularComp } from 'ag-grid-angular';
import type { IHeaderGroupParams } from 'ag-grid-community';

export interface ICustomInnerHeaderGroupParams {
    icon: string;
}

@Component({
    standalone: true,
    imports: [NgClass],
    template: `
        <div class="customInnerHeaderGroup">
            @if (params.icon) {
                <i class="fa {{ params.icon }}"></i>
            }
            <span>{{ params.displayName }}</span>
        </div>
    `,
    styles: [
        `
            .customInnerHeaderGroup {
                display: flex;
                gap: 0.25rem;
                align-items: center;
            }

            .customInnerHeaderGroup span {
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .fa {
                color: cornflowerblue;
            }
        `,
    ],
})
export class CustomInnerHeaderGroup implements IHeaderGroupAngularComp {
    public params!: IHeaderGroupParams & ICustomInnerHeaderGroupParams;

    agInit(params: IHeaderGroupParams & ICustomInnerHeaderGroupParams): void {
        this.params = params;
    }

    refresh(params: IHeaderGroupParams): boolean {
        return true;
    }
}

import { NgClass } from '@angular/common';
import { Component } from '@angular/core';

import type { IHeaderAngularComp } from 'ag-grid-angular';
import type { IHeaderParams } from 'ag-grid-community';

export interface ICustomInnerHeaderParams {
    icon: string;
}

@Component({
    standalone: true,
    imports: [NgClass],
    template: `
        <div class="customInnerHeader">
            @if (params.icon) {
                <i class="fa {{ params.icon }}"></i>
            }
            <span>{{ params.displayName }}</span>
        </div>
    `,
    styles: [
        `
            .customInnerHeader {
                display: flex;
                gap: 0.25rem;
                align-items: center;
            }

            .customInnerHeader span {
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .fa {
                color: cornflowerblue;
            }
        `,
    ],
})
export class CustomInnerHeader implements IHeaderAngularComp {
    public params!: IHeaderParams & ICustomInnerHeaderParams;

    agInit(params: IHeaderParams & ICustomInnerHeaderParams): void {
        this.params = params;
    }

    refresh(params: IHeaderParams): boolean {
        return true;
    }
}

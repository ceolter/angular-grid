import { Component } from '@angular/core';

import { GridWrapperComponent } from './grid-wrapper/grid-wrapper.component';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [GridWrapperComponent],
    styleUrls: ['./app.component.css'],
    // links to the grid-wrapper component
    template: `
        <h1>Grid Wrapper</h1>
        @defer {
            <grid-wrapper></grid-wrapper>
        }
    `,
})
export class AppComponent {}

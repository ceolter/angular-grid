import { Component } from '@angular/core';

import { GridWrapperComponent } from './grid-wrapper/grid-wrapper.component';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [GridWrapperComponent],
    styleUrls: ['./app.component.css'],
    // Wrap the grid-wrapper component in a deferred component so that it gets a separate chunk which does not include Angular in its size
    template: `
        <h1>Grid Wrapper</h1>
        @defer {
            <grid-wrapper></grid-wrapper>
        }
    `,
})
export class AppComponent {}

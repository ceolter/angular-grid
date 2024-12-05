export default {
    template: `
        <div role="presentation" class="ag-overlay-loading-center" style="background-color: #b4bebe;"> 
            <i class="far fa-frown" aria-live="polite" aria-atomic="true"> {{params.noRowsMessageFunc()}}</i>
        </div>
    `,
};

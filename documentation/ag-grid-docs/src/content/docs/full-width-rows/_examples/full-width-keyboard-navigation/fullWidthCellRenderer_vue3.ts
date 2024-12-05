export default {
    template: `
        <div class="full-width-panel">
            <button><img width="15" height="10" :src="'https://www.ag-grid.com/example-assets/flags/' + params.data.code + '.png'"></button>
            <input :value="params.data.name"/>
            <a :href="'https://www.google.com/search?q=' + params.data.language" target="_blank">{{ params.data.language }}</a>
        </div>`,
};

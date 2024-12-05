export default {
    template: `
      <div class="ag-status-name-value">
          <span>Status Bar Component&nbsp; 
            <input type="button" class="status-bar-input" v-on:click="onClick" value="Click Me"/>
          </span>
      </div>
    `,
    data: function () {
        return {};
    },
    methods: {
        onClick() {
            alert('Selected Row Count: ' + this.params.api.getSelectedRows().length);
        },
    },
};

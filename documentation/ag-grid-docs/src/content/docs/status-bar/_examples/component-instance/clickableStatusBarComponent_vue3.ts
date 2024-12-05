export default {
    template: `
      <div class="container" v-if="visible">
      <div>
          <span class="component">Status Bar Component&nbsp;
            <input type="button" v-on:click="onClick" value="Click Me"/>
          </span>
      </div>
      </div>
    `,
    data: function () {
        return {
            visible: true,
        };
    },
    methods: {
        onClick() {
            alert('Selected Row Count: ' + this.params.api.getSelectedRows().length);
        },
        setVisible(visible) {
            this.visible = visible;
        },
        isVisible() {
            return this.visible;
        },
    },
};

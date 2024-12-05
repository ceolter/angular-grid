import { defineComponent } from 'vue';

export default defineComponent({
    template: `
      <span>Field: {{ this.params.colDef.field }}, Value: {{ this.params.value }}</span>
    `,
    data: function () {
        return {};
    },
});

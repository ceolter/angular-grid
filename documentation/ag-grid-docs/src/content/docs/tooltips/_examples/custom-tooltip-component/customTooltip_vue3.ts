export default {
    template: `
      <div class="custom-tooltip" v-bind:style="{ backgroundColor: color }">
          <div><b>Custom Tooltip</b></div>
          <div>{{ value }}</div>
      </div>
    `,
    data: function () {
        return {
            color: null,
            athlete: null,
            country: null,
            total: null,
        };
    },
    beforeMount() {
        this.value = this.params.value;
        this.color = this.params.color || '#999';
    },
};

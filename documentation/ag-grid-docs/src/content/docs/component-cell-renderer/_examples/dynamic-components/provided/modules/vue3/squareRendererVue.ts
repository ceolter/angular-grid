import { defineComponent } from 'vue';

export default defineComponent({
    template: `
      <span>
            {{ this.value }}
        </span>
    `,
    data: function () {
        return {
            value: null,
        };
    },
    mounted() {
        this.value = this.valueSquared();
    },
    methods: {
        valueSquared() {
            return this.params.value * this.params.value;
        },
    },
});

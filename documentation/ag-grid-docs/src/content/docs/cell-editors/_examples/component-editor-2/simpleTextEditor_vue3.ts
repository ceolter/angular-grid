import { nextTick } from 'vue';

export default {
    template: `<input v-model="value" :ref="'input'" class="my-simple-editor" />`,
    data() {
        return {
            value: null,
        };
    },
    methods: {
        getValue() {
            return this.value;
        },

        getInitialValue() {
            let startValue = this.params.value;

            const eventKey = this.params.eventKey;
            const isBackspace = eventKey === 'Backspace';

            if (isBackspace) {
                startValue = '';
            } else if (eventKey && eventKey.length === 1) {
                startValue = eventKey;
            }

            if (startValue !== null && startValue !== undefined) {
                return startValue;
            }

            return '';
        },
    },
    created() {
        this.value = this.getInitialValue();
    },
    mounted() {
        nextTick(() => {
            this.$refs.input.focus();
        });
    },
};

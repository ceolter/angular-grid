import { defineComponent, nextTick } from 'vue';

// backspace starts the editor on Windows
const KEY_BACKSPACE = 'Backspace';

export default defineComponent({
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

        myCustomFunction() {
            return {
                rowIndex: this.params.rowIndex,
                colId: this.params.column.getId(),
            };
        },

        getInitialValue() {
            let startValue = this.params.value;

            const eventKey = this.params.eventKey;
            const isBackspace = eventKey === KEY_BACKSPACE;

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
});

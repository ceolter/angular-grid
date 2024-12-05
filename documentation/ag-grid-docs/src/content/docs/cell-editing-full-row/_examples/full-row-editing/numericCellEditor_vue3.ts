import { nextTick } from 'vue';

export default {
    template: `<input :ref="'input'" @keydown="onKeyDown($event)" v-model="value" class="ag-input-field-input" />`,
    data() {
        return {
            value: '',
            focusAfterAttached: false,
        };
    },
    methods: {
        getValue() {
            const value = this.value;
            return value === '' || value == null ? null : parseInt(value);
        },

        onKeyDown(event) {
            if (!event.key || event.key.length !== 1 || this.isNumericKey(event)) {
                return;
            }
            this.$refs.input.focus();

            if (event.preventDefault) event.preventDefault();
        },

        // when we tab into this editor, we want to focus the contents
        focusIn() {
            this.$refs.input.focus();
            this.$refs.input.select();
            console.log('NumericCellEditor.focusIn()');
        },

        // when we tab out of the editor, this gets called
        focusOut() {
            console.log('NumericCellEditor.focusOut()');
        },

        isCharNumeric(charStr) {
            return charStr != null && !!/^\d+$/.test(charStr);
        },

        isNumericKey(event) {
            const charStr = event.key;
            return this.isCharNumeric(charStr);
        },
    },

    created() {
        // we only want to highlight this cell if it started the edit; it's possible
        // another cell in this row started the edit
        this.focusAfterAttached = this.params.cellStartedEdit;

        this.value = this.isCharNumeric(this.params.eventKey) ? this.params.eventKey : this.params.value;
    },
    mounted() {
        nextTick(() => {
            if (this.$refs.input) {
                if (this.focusAfterAttached) {
                    this.$refs.input.focus();
                    this.$refs.input.select();
                }
            }
        });
    },
};

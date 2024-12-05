import { defineComponent, nextTick } from 'vue';

// backspace starts the editor on Windows
const KEY_BACKSPACE = 'Backspace';
const KEY_ENTER = 'Enter';
const KEY_TAB = 'Tab';

export default defineComponent({
    template: `<input :ref="'input'" class="simple-input-editor" @keydown="onKeyDown($event)" v-model="value"/>`,
    data() {
        return {
            value: '',
            cancelBeforeStart: true,
        };
    },
    methods: {
        getValue() {
            return this.value;
        },

        isCancelBeforeStart() {
            return this.cancelBeforeStart;
        },

        setInitialState(params) {
            let startValue;

            const eventKey = params.eventKey;
            if (eventKey === KEY_BACKSPACE) {
                // if backspace or delete pressed, we clear the cell
                startValue = '';
            } else if (eventKey && eventKey.length === 1) {
                // if a letter was pressed, we start with the letter
                startValue = eventKey;
            } else {
                // otherwise we start with the current value
                startValue = params.value;
            }

            this.value = startValue;
        },

        // will reject the number if it greater than 1,000,000
        // not very practical, but demonstrates the method.
        isCancelAfterEnd() {
            return this.value > 1000000;
        },

        onKeyDown(event) {
            if (event.key === 'Escape') {
                return;
            }
            if (this.isLeftOrRight(event) || this.isBackspace(event)) {
                event.stopPropagation();
                return;
            }

            if (!this.finishedEditingPressed(event) && !this.isNumericKey(event)) {
                if (event.preventDefault) event.preventDefault();
            }
        },

        isCharNumeric(charStr) {
            return /^\d+$/.test(charStr);
        },

        isNumericKey(event) {
            const charStr = event.key;
            return this.isCharNumeric(charStr);
        },

        finishedEditingPressed(event) {
            const key = event.key;
            return key === KEY_ENTER || key === KEY_TAB;
        },

        isBackspace(event) {
            return event.key === KEY_BACKSPACE;
        },

        isLeftOrRight(event) {
            return ['ArrowLeft', 'ArrowRight'].indexOf(event.key) > -1;
        },
    },

    created() {
        this.setInitialState(this.params);
        const eventKey = this.params.eventKey;

        // only start edit if key pressed is a number, not a letter
        this.cancelBeforeStart = eventKey && eventKey.length === 1 && '1234567890'.indexOf(eventKey) < 0;
    },
    mounted() {
        nextTick(() => {
            // need to check if the input reference is still valid - if the edit was cancelled before it started there
            // wont be an editor component anymore
            if (this.$refs.input) {
                this.$refs.input.focus();
            }
        });
    },
});

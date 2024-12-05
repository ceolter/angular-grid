import { nextTick } from 'vue';

export default {
    template: `
      <div :ref="'container'" class="mood" tabindex="0" @keydown="onKeyDown">
      <img src="https://www.ag-grid.com/example-assets/smileys/happy.png" @click="onClick(true)" :class="{ selected: happy, default: !happy }">
      <img src="https://www.ag-grid.com/example-assets/smileys/sad.png" @click="onClick(false)" :class="{ selected: !happy, default: happy }">
      </div>
    `,
    data() {
        return {
            happy: false,
            imgForMood: null,
        };
    },
    methods: {
        getValue() {
            return this.happy ? 'Happy' : 'Sad';
        },

        isPopup() {
            return true;
        },

        setHappy(happy) {
            this.happy = happy;
        },

        toggleMood() {
            this.setHappy(!this.happy);
        },

        onClick(happy) {
            this.setHappy(happy);
            this.params.stopEditing();
        },

        onKeyDown(event) {
            const key = event.key;
            if (
                key == 'ArrowLeft' || // left
                key == 'ArrowRight'
            ) {
                // right
                this.toggleMood();
                event.stopPropagation();
            }
        },
    },
    created() {
        this.setHappy(this.params.value === 'Happy');
    },
    mounted() {
        nextTick(() => {
            this.$refs.container.focus();
        });
    },
};

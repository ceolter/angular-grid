export default {
    template: `<div v-html="value"></div>`,
    data() {
        return {
            value: '',
        };
    },
    beforeMount() {
        if (!this.params.value) {
            this.value = this.params.isFilterRenderer ? '(Blanks)' : this.params.value;
        } else if (this.params.value === '(Select All)') {
            this.value = this.params.value;
        } else {
            const url = `https://flags.fmcdn.net/data/flags/mini/${this.params.context.COUNTRY_CODES[this.params.value]}.png`;
            const flagImage = `<img class="flag" border="0" width="15" height="10" src="${url}">`;

            this.value = `${flagImage} ${this.params.value}`;
        }
    },
};

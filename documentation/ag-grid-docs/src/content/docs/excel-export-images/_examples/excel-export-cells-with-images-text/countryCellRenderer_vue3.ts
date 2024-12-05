export default {
    template: `<div><img :alt="this.params.data.country" :src="this.params.context.base64flags[this.params.context.countryCodes[this.params.data.country]]" /> {{this.params.data.country}}</div>`,
};

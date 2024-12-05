export default {
    template: `<div v-html="this.params.value.replace('\\n', '<br/>')"></div>`,
};

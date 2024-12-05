export default {
    template: `
        <div v-if="params.value === '(Select All)'">{{params.value}}</div>
        <span v-else :style="{color: removeSpaces(params.valueFormatted)}">{{params.valueFormatted}}</span>
    `,
    methods: {
        removeSpaces(str) {
            return str ? str.replace(/\s/g, '') : str;
        },
    },
};

export default {
    template: `
        <div>        
            <button v-on:click="buttonClicked">Launch!</button>
        </div>
    `,
    methods: {
        buttonClicked() {
            alert('Software Launched');
        },
    },
};

export default {
    template: '<img style="width: 20px;" :src="imgForMood" />',
    data() {
        return {
            mood: 'Happy',
            imgForMood: null,
        };
    },
    methods: {
        refresh(params) {
            this.params = params;
            this.setMood(params);
        },

        setMood(params) {
            this.mood = params.value;
            this.imgForMood =
                'https://www.ag-grid.com/example-assets/smileys/' + (this.mood === 'Happy' ? 'happy.png' : 'sad.png');
        },
    },
    created() {
        this.setMood(this.params);
    },
};

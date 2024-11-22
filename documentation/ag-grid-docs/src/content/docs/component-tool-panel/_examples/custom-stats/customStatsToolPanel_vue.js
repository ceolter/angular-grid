export default {
    template: `
      <div style="text-align: center">
      <span>
           <h2><i class="fa fa-calculator"></i> {{ title }}</h2>
           <dl style="font-size: large; padding: 30px 40px 10px 30px">
             <dt style="padding-bottom: 15px">Total Medals: <b>{{ numGold + numSilver + numBronze }}</b></dt>
             <dt style="padding-bottom: 15px">Total Gold: <b>{{ numGold }}</b></dt>
             <dt style="padding-bottom: 15px">Total Silver: <b>{{ numSilver }}</b></dt>
             <dt style="padding-bottom: 15px">Total Bronze: <b>{{ numBronze }}</b></dt>
           </dl>
      </span>
      </div>
    `,
    data() {
        return {
            numGold: 0,
            numSilver: 0,
            numBronze: 0,
            title: undefined,
        };
    },
    methods: {
        renderStats() {
            let numGold = 0;
            let numSilver = 0;
            let numBronze = 0;
            this.title = this.params.title;
            this.params.api.forEachNode((rowNode) => {
                const data = rowNode.data;
                if (data.gold) numGold += data.gold;
                if (data.silver) numSilver += data.silver;
                if (data.bronze) numBronze += data.bronze;
            });
            this.numGold = numGold;
            this.numSilver = numSilver;
            this.numBronze = numBronze;
        },
    },
    created() {
        this.params.api.addEventListener('modelUpdated', this.renderStats.bind(this));
    },
};

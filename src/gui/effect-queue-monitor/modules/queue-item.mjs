const queueItem = {
    props: ["item"],
    data: function () {
        return {
            isExpanded: false
        };
    },
    computed: {
        triggerType() {
            return this.item?.runEffectsContext?.trigger?.type ?? "Unknown";
        },
        triggeredBy() {
            return this.item?.runEffectsContext?.trigger?.metadata?.username ?? "Unknown";
        },
        numberOfEffects() {
            return this.item?.runEffectsContext?.effects?.list?.length ?? 0;
        }
    },
    methods: {
        toggleExpand() {
            this.isExpanded = !this.isExpanded;
        }
    },
    template: `
    <div class="queue-item">
        <div class="queue-item-header" style="display:flex;">
            <div style="width: 22px; display: flex; align-items: center;">
                <div class="queue-status-badge running" style="padding: 1px 3px; height: 14px;" v-if="item.active">
                    <running-icon :width="10" :height="10" />
                </div>
            </div>
            <div class="queue-item-cell">{{ triggerType }}</div>
            <div class="queue-item-cell">{{ triggeredBy }}</div>
            <div class="queue-item-cell"> {{ numberOfEffects }}</div>
            <div style="width: 15px;"></div>
        </div>
    </div>
    `
};

export { queueItem };
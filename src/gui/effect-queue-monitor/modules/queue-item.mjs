const queueItem = {
    props: ["item"],
    data: function () {
        return {
            isExpanded: false
        };
    },
    computed: {
        triggerType() {
            const triggerData = this.item?.runEffectsContext?.trigger;
            const isManual = triggerData?.type === "manual";
            if (isManual) {
                const metadata = triggerData?.metadata ?? {};
                let manualTriggerType = undefined;
                if (metadata.command != null) {
                    manualTriggerType = `Command: ${metadata.command.trigger}`;
                } else if (metadata.event != null && metadata.eventSource) {
                    manualTriggerType = `Event: ${metadata.event.name} - ${metadata.eventSource.name}`;
                }
                return `Manual (${manualTriggerType})`;
            }
            return triggerData?.type?.replace(/_/, " ") ?? "Unknown";
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
    <div class="queue-item" @click="toggleExpand">
        <div class="queue-item-header">
            <div style="width: 22px; display: flex; align-items: center;">
                <div class="queue-status-badge running" style="padding: 1px 3px; height: 14px;" v-if="item.active">
                    <running-icon :width="10" :height="10" />
                </div>
            </div>
            <div class="queue-item-cell trigger-type" style="text-transform: capitalize">{{ triggerType }}</div>
            <div class="queue-item-cell triggered-by">{{ triggeredBy }}</div>
            <div class="queue-item-cell effects-count">{{ numberOfEffects }}</div>
            <div style="width: 15px;"></div>
        </div>
        <div class="queue-item-details" v-if="isExpanded">
            <pre style="margin: 0; padding: 0; font-size: 12px; line-height: 1.2em;">
                {{ JSON.stringify(item, undefined, 2) }}
            </pre>
        </div>
    </div>
    `
};

export { queueItem };
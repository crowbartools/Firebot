const queueHeader = {
    props: ["queue"],
    computed: {
        modeLabel() {
            if (this.queue.mode === "interval") {
                return "Interval";
            }
            if (this.queue.mode === "custom") {
                return "Custom";
            }
            if (this.queue.mode === "auto") {
                return "Sequential";
            }
            return "Unknown";
        },
        shouldShowInterval() {
            return ["interval", "auto"].includes(this.queue.mode);
        },
        intervalName() {
            if (this.queue.mode === "interval") {
                return "Interval:";
            }
            if (this.queue.mode === "auto") {
                return "Delay:";
            }
            return "";
        },
        intervalValue() {
            return `${this.queue.interval || "0"}s`;
        }
    },
    template: `
        <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center;">
                <h2 style="margin: 0; margin-right: 15px">{{ queue.name }}</h2>
                <queue-label
                    name="Mode:"
                    :value="modeLabel"
                />
                <queue-label
                    v-if="shouldShowInterval"
                    :name="intervalName"
                    :value="intervalValue"
                />
            </div>
            <queue-status-badge
                :status="queue.state.status"
            ></queue-status-badge>
        </div>
    `
};

export { queueHeader };
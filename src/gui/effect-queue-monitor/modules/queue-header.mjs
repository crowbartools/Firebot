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
        }
    },
    template: `
        <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center;">
                <h2 style="margin: 0; margin-right: 5px">{{ queue.name }}</h2>
                <div>
                    ({{ modeLabel }} - {{ queue.interval || "0" }}s)
                </div>
            </div>
            <queue-status-badge
                :status="queue.state.status"
            ></queue-status-badge>
        </div>
    `
};

export { queueHeader };
const queueItemList = {
    props: ["listName", "noItemsText", "items"],
    computed: {},
    template: `
        <div>
            <h3>{{ listName }} </h3>
            <div
                style="
                    display: flex;
                    color: rgba(255, 255, 255, 0.75);
                    padding: 10px;
                    font-size: 13px;
                "
            >
                <div style="width: 22px;"></div>
                <div style="flex: 1">Trigger</div>
                <div style="flex: 1">Triggered By</div>
                <div style="flex: 1">Effects</div>
                <div style="width: 15px"></div>
            </div>
            <div>
                <queue-item
                    v-for="queueItem in items"
                    :item="queueItem"
                ></queue-item>
                <div v-if="items.length === 0" style="opacity: 0.7;">
                    {{ noItemsText }}
                </div>
            </div
        </div>
    `
};

export { queueItemList };
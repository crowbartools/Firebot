"use strict";

const mixerage = {
    definition: {
        id: "firebot:mixerage",
        name: "Mixer Age (Deprecated)",
        active: false,
        trigger: "!mixerage",
        hidden: true,
        description: "Deprecated.",
        autoDeleteTrigger: false,
        scanWholeMessage: false,
        cooldown: {
            user: 0,
            global: 0
        }
    },
    /**
   * When the command is triggered
   */
    onTriggerEvent: async event => {}
};

module.exports = mixerage;

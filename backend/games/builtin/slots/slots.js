"use strict";

const model = {
    id: "firebot-slots",
    name: "Slots",
    description: "Spin and win!",
    icon: "fa-dice",
    settingCategories: {
        main: {
            title: "Settings",
            description: "test",
            settings: {
                successChances: {
                    type: "role-percentages",
                    title: "Success Chances",
                    description: "The success chance percentages.",
                    tip: "The success chance for the first role a viewer has in this list is used, so ordering is important!"
                }
            }
        }
    },
    initializeTrigger: null, // "immediate" | "chat"
    onLoad: settings => {},
    onInitialize: settings => {},
    onTerminate: settings => {},
    onSettingsUpdate: settings => {

    }
};
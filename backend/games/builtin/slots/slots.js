"use strict";

const model = {
    id: "firebot-slots",
    name: "Slots",
    description: "Spin to win!",
    icon: "fa-dice-three",
    settingCategories: {
        main: {
            title: "Settings",
            settings: {
                currencyId: {
                    type: "currency-select",
                    title: "Currency",
                    description: "Select which currency to use"
                },
                successChances: {
                    type: "role-percentages",
                    title: "Roll Success Chances",
                    description: "The chances each roll will be successful (There are 3 rolls per spin)",
                    tip: "The success chance for the first user role a viewer has in this list is used, so ordering is important!"
                },
                multiplier: {
                    type: "number",
                    title: "Winnings Multiplier",
                    description: "The winnings multiplier for each successful roll",
                    default: 2
                }
            }
        }
    },
    initializeTrigger: null, // "immediate" | "chat"
    onLoad: settings => {},
    onInitialize: settings => {},
    onTerminate: settings => {},
    onSettingsUpdate: settings => {}
};

module.exports = model;
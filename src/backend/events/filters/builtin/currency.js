"use strict";

module.exports = {
    id: "firebot:currency",
    name: "Currency",
    description: "Filter to a Currency",
    events: [
        { eventSourceId: "firebot", eventId: "currency-update" }
    ],
    comparisonTypes: ["is", "is not"],
    valueType: "preset",
    presetValues: currencyService => {
        return currencyService
            .getCurrencies().map(c => ({value: c.id, display: c.name}));
    },
    valueIsStillValid: (filterSettings, currencyService) => {
        return new Promise(resolve => {
            resolve(currencyService.getCurrencies().some(c => c.id === filterSettings.value));
        });
    },
    getSelectedValueDisplay: (filterSettings, currencyService) => {
        return new Promise(resolve => {
            resolve(currencyService.getCurrencies().find(c => c.id === filterSettings.value)?.name ?? "Unknown Currency");
        });
    },
    predicate: (filterSettings, eventData) => {

        const { comparisonType, value } = filterSettings;
        const { eventMeta } = eventData;

        const actual = eventMeta.currencyId;
        const expected = value;

        switch (comparisonType) {
            case "is":
                return actual === expected;
            case "is not":
                return actual !== expected;
            default:
                return false;
        }
    }
};
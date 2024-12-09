import { createPresetFilter } from "../../filter-factory";

const filter = createPresetFilter({
    id: "firebot:currency",
    name: "Currency",
    description: "Filter to a Currency",
    events: [
        { eventSourceId: "firebot", eventId: "currency-update" }
    ],
    eventMetaKey: "currencyId",
    allowIsNot: true,
    presetValues: async (currencyService: any) => {
        return currencyService.getCurrencies().map(c => ({value: c.id, display: c.name}));
    },
    valueIsStillValid: async (filterSettings, currencyService: any) => {
        return currencyService.getCurrencies().some(c => c.id === filterSettings.value);
    }
});

export default filter;
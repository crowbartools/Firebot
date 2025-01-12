import { createPresetFilter } from "../../../../events/filters/filter-factory";

const filter = createPresetFilter({
    id: "streamloots:card-rarity",
    name: "Card Rarity",
    description: "Filter by the rarity of redeemed Streamloots Cards",
    events: [
        { eventSourceId: "streamloots", eventId: "redemption" }
    ],
    eventMetaKey: "cardRarity",
    allowIsNot: true,
    presetValues: async () => {
        return [
            {
                value: "common",
                display: "Common"
            },
            {
                value: "rare",
                display: "Rare"
            },
            {
                value: "epic",
                display: "Epic"
            },
            {
                value: "legendary",
                display: "Legendary"
            }
        ];
    }
});

module.exports = filter;
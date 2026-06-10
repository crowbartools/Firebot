import type { EffectType } from "../../../types";

import { ControlDeckManager } from "../../control-deck/control-deck-manager";
import { SettingsManager } from "../../common/settings-manager";

const effect: EffectType<{
    deckId: string;
}> = {
    definition: {
        id: "firebot:set-default-control-deck",
        name: "Set Default Control Deck",
        description: "Set the default control deck when new devices connect",
        icon: "fad fa-star",
        categories: ["common", "firebot control"]
    },
    optionsTemplate: `
        <eos-container header="Deck">
            <firebot-searchable-select
                ng-model="effect.deckId"
                placeholder="Select or search for a deck..."
                items="controlDecks"
            />
        </eos-container>
    `,
    optionsController: ($scope, controlDeckService) => {
        $scope.controlDecks = controlDeckService.decks;
    },
    getDefaultLabel: (effect, controlDeckService) => {
        const deck = controlDeckService.decks.find(deck => deck.id === effect.deckId);
        const deckName = deck?.name ?? "Unknown Deck";
        return deckName;
    },
    optionsValidator: (effect) => {
        const errors: string[] = [];
        if (!effect.deckId) {
            errors.push("A control deck must be selected.");
        }
        return errors;
    },
    onTriggerEvent: ({ effect }) => {
        const decks = ControlDeckManager.getAllItems();
        const deck = decks.find(d => d.id === effect.deckId);
        if (!deck) {
            return true;
        }
        SettingsManager.saveSetting("ControlDeckDefaultDeckId", effect.deckId);
        return true;
    }
};

export = effect;
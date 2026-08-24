import type { EffectType } from "../../../types";

import { HttpServerManager } from "../../../server/http-server-manager";
import { ControlDeckManager } from "../../control-deck/control-deck-manager";

const effect: EffectType<{
    deckId: string;
    pageId?: string;
}> = {
    definition: {
        id: "firebot:set-active-control-deck",
        name: "Set Active Control Deck",
        description: "Set the active control deck and page on connected devices",
        icon: "fad fa-grip-horizontal",
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

        <eos-container header="Page" pad-top="true">
            <firebot-searchable-select
                ng-model="effect.pageId"
                placeholder="Select or search for a page..."
                items="deckPages"
            />
        </eos-container>
    `,
    optionsController: ($scope, controlDeckService) => {
        $scope.controlDecks = controlDeckService.decks;

        $scope.deckPages = [];

        $scope.$watch("effect.deckId", (newVal) => {
            const selectedDeck = controlDeckService.decks.find(deck => deck.id === newVal);
            $scope.deckPages = [
                {
                    id: undefined,
                    name: "Default (First) Page"
                },
                ...(selectedDeck?.pages || [])
            ];
        });

    },
    getDefaultLabel: (effect, controlDeckService) => {
        const deck = controlDeckService.decks.find(deck => deck.id === effect.deckId);
        const deckName = deck?.name ?? "Unknown Deck";
        const pageName = deck?.pages?.find(page => page.id === effect.pageId)?.name ?? "Default Page";
        return `${deckName} - ${pageName}`;
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
        const pageId = effect.pageId ? deck.pages.find(p => p.id === effect.pageId)?.id : undefined;
        HttpServerManager.sendToControlDecks("control-deck:set-active-deck", {
            deckId: effect.deckId,
            pageId
        });
        return true;
    }
};

export = effect;
"use strict";

(function() {
    angular
        .module("firebotApp")
        .factory("controlDeckService", function(backendCommunicator, modalService, modalFactory) {
            const service = {};

            service.decks = [];

            service.controlTypes = [];

            service.loadDecks = () => {
                service.decks = backendCommunicator.fireEventSync("control-deck:get-decks") || [];
            };

            service.loadControlTypes = () => {
                service.controlTypes = backendCommunicator.fireEventSync("control-deck:get-control-types") || [];
            };

            service.getControlType = (typeId) => {
                return service.controlTypes.find(t => t.id === typeId) || null;
            };

            service.getDeck = (deckId) => {
                return service.decks.find(d => d.id === deckId);
            };

            service.saveDeck = (deck) => {
                if (deck == null) {
                    return false;
                }
                const saved = backendCommunicator.fireEventSync("control-deck:save-deck", deck);
                if (saved) {
                    const index = service.decks.findIndex(d => d.id === saved.id);
                    if (index > -1) {
                        service.decks[index] = saved;
                    } else {
                        service.decks.push(saved);
                    }
                    return saved;
                }
                return false;
            };

            service.deleteDeck = (deckId) => {
                service.decks = service.decks.filter(d => d.id !== deckId);
                backendCommunicator.send("control-deck:delete-deck", deckId);
            };

            service.showAddEditDeckModal = (deck) => {
                modalService.showModal({
                    breadcrumbName: deck ? "Edit Deck" : "Add Deck",
                    component: "addOrEditControlDeckModal",
                    size: "lg",
                    resolveObj: {
                        deck: () => deck
                    }
                });
            };

            service.showSettingsModal = () => {
                modalService.showModal({
                    component: "controlDeckSettingsModal",
                    size: "md"
                });
            };

            service.showQRCodeModal = () => {
                modalService.showModal({
                    component: "controlDeckQrCodeModal",
                    backdrop: true,
                    keyboard: true,
                    size: "sm"
                });
            };

            service.confirmDeleteDeck = (deck) => {
                modalFactory
                    .showConfirmationModal({
                        title: "Delete Control Deck",
                        question: `Are you sure you want to delete the Control Deck "${deck.name}"?`,
                        confirmLabel: "Delete",
                        confirmBtnType: "btn-danger"
                    })
                    .then((confirmed) => {
                        if (confirmed) {
                            service.deleteDeck(deck.id);
                        }
                    });
            };

            backendCommunicator.on("control-deck:decks-updated", (decks) => {
                if (decks != null) {
                    service.decks = decks;
                }
            });

            return service;
        });
}());

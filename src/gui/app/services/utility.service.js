"use strict";
(function() {

    angular
        .module("firebotApp")
        .factory("utilityService", function(
            $timeout,
            ngToast,
            modalService,
            modalFactory,
            backendCommunicator
        ) {
            const service = {};

            backendCommunicator.on("showToast", (messageOrOptions) => {
                ngToast.create(messageOrOptions);
            });

            // This is used by effects that make use of lists of checkboxes. Returns and array of selected boxes.
            service.getNewArrayWithToggledElement = function(array, element) {
                let itemArray = [],
                    itemIndex = -1;
                if (array != null) {
                    itemArray = array;
                }
                try {
                    itemIndex = itemArray.indexOf(element);
                } catch (err) {} //eslint-disable-line no-empty

                if (itemIndex !== -1) {
                    // Item exists, so we're unchecking it.
                    itemArray.splice(itemIndex, 1);
                } else {
                    // Item doesn't exist! Add it in.
                    itemArray.push(element);
                }

                // Set new scope var.
                return itemArray;
            };

            // This is used to check for an item in a saved array and returns true if it exists.
            service.arrayContainsElement = function(array, element) {
                if (array != null) {
                    return array.indexOf(element) !== -1;
                }
                return false;
            };

            service.capitalize = function([first, ...rest]) {
                return first.toUpperCase() + rest.join("").toLowerCase();
            };

            service.generateUuid = function() {
                // RFC4122 version 4 compliant
                return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
                    (
                        c ^
            (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))
                    ).toString(16)
                );
            };

            service.debounce = function(func, wait, immediate = false) {
                let timeout;

                return function executedFunction() {
                    const context = this;
                    const args = arguments;

                    const later = function() {
                        timeout = null;
                        if (!immediate) {
                            func.apply(context, args);
                        }
                    };

                    const callNow = immediate && !timeout;

                    $timeout.cancel(timeout);

                    timeout = $timeout(later, wait);

                    if (callNow) {
                        func.apply(context, args);
                    }
                };
            };

            service.noop = function() {};

            // deprecated pass-throughs to modalService for backwards compatibility
            service.showModal = modalService.showModal;
            service.closeToModalId = modalService.dismissToModalId;
            service.saveAllSlidingModals = modalService.saveAllOpenModals;
            service.getSlidingModalNamesAndIds = modalService.getOpenModals;
            service.updateNameForSlidingModal = modalService.updateNameForOpenModal;
            service.addSlidingModal = service.noop;
            service.removeSlidingModal = service.noop;

            // deprecated pass-throughs to modalFactory for backwards compatibility
            service.openGetIdEntyModal = modalFactory.openGetIdEntryModal;
            service.showSetupWizard = modalFactory.showSetupWizard;
            service.openGetInputModal = modalFactory.openGetInputModal;
            service.openDateModal = modalFactory.openDateModal;
            service.openSelectModal = modalFactory.openSelectModal;
            service.openViewerSearchModal = modalFactory.openViewerSearchModal;
            service.showOverlayInfoModal = modalFactory.showOverlayInfoModal;
            service.showOverlayEventsModal = modalFactory.showOverlayEventsModal;
            service.showUpdatedModal = modalFactory.showUpdatedModal;
            service.showErrorModal = modalFactory.showErrorModal;
            service.showErrorDetailModal = modalFactory.showErrorDetailModal;
            service.showDownloadModal = modalFactory.showDownloadModal;
            service.showInfoModal = modalFactory.showInfoModal;
            service.showEditEffectModal = modalFactory.showEditEffectModal;
            service.showConfirmationModal = modalFactory.showConfirmationModal;

            return service;
        });
}());

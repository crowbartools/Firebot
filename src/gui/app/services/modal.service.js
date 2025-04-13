"use strict";
(function() {

    const { v4: uuid } = require("uuid");

    const MODAL_SHIFT_AMOUNT = 125;

    angular
        .module("firebotApp")
        .factory("modalService", function(
            $uibModal,
            logger
        ) {
            const service = {};

            const openModals = [];

            function addModal(promise) {
                // update previous values
                openModals.forEach((em) => {
                    const newAmount = em.transform + MODAL_SHIFT_AMOUNT;
                    em.transform = newAmount;
                    em.element.css("transform", `translate(-${newAmount}px, 0)`);
                });

                promise.then((data) => {
                    data.transform = 0;
                    openModals.push(data);
                });
            }

            function removeModal() {
                openModals.pop();

                // update previous values
                openModals.forEach((em) => {
                    const newAmount = em.transform - MODAL_SHIFT_AMOUNT;
                    em.transform = newAmount;
                    em.element.css("transform", `translate(-${newAmount}px, 0)`);
                });
            }

            service.dismissToModalId = function(modalId) {
                const minId = modalId.replace("modal", "");

                const closeList = [];
                openModals.forEach((m) => {
                    const nextId = m.id.replace("modal", "");
                    if (minId < nextId && minId !== nextId) {
                        closeList.push(m);
                    }
                });

                closeList.forEach((m) => {
                    m.instance.dismiss();
                });
            };

            service.saveAllOpenModals = function() {
                const lastEditModalId = openModals[0].id;

                const saveList = [];
                openModals.forEach((m) => {
                    if (m.id !== lastEditModalId) {
                        saveList.push(m);
                    }
                });

                saveList.reverse().forEach((m) => {
                    console.log(m);
                    m.onSaveAll();
                });
            };

            service.getOpenModals = function() {
                return openModals.map((sm) => {
                    return { name: sm.name, id: sm.id };
                });
            };

            service.updateNameForOpenModal = function(newName, modalId) {
                openModals
                    .filter(m => m.id === modalId)
                    .forEach(m => (m.name = newName));
            };

            service.showModal = function(showModalContext) {
                // We don't want to do anything if there's no context
                if (showModalContext == null) {
                    logger.warn("showModal() was called but no context was provided!");
                    return;
                }

                // Pull values out of the context
                const component = showModalContext.component;
                const templateUrl = showModalContext.templateUrl;
                const controllerFunc = showModalContext.controllerFunc;
                const resolveObj = showModalContext.resolveObj || {};
                let closeCallback = showModalContext.closeCallback;
                let dismissCallback = showModalContext.dismissCallback;
                const windowClass = showModalContext.windowClass ? showModalContext.windowClass : "";

                const modalId = `modal-${uuid()}`;
                resolveObj.modalId = () => {
                    return modalId;
                };

                const modal = {
                    ariaLabelledBy: "modal-title",
                    ariaDescribedBy: "modal-body",
                    resolve: resolveObj,
                    size: showModalContext.size,
                    keyboard: showModalContext.keyboard ? showModalContext.keyboard : true,
                    backdrop: showModalContext.backdrop ? showModalContext.backdrop : 'static',
                    windowClass: `${windowClass} ${modalId} animated fadeIn fastest fb-transition draggablemodal`,
                    animation: true
                };

                if (component != null && component.length !== 0) {
                    modal.component = component;
                } else {
                    modal.templateUrl = templateUrl;
                    modal.controller = controllerFunc;
                }

                // Show the modal
                const modalInstance = $uibModal.open(modal);

                // If no callbacks were defined, create blank ones. This avoids a console error
                if (typeof closeCallback !== "function") {
                    closeCallback = () => {};
                }
                if (typeof dismissCallback !== "function") {
                    dismissCallback = () => {};
                }

                const renderedPromise = modalInstance.rendered.then(() => {
                    const modalNode = $(`.${modalId}`);
                    modalNode.removeClass("animated fadeIn fastest");

                    const modalScope = angular.element(`.${modalId}`)?.scope();

                    if (showModalContext.autoSlide !== false) {
                        modalScope?.$on("modal.closing", function() {
                            removeModal();
                        });
                    }

                    return {
                        element: modalNode.children(),
                        name: showModalContext.breadcrumbName ?? "",
                        id: modalId,
                        instance: modalInstance,
                        onSaveAll: () => {
                            if (modalScope?.save) {
                                modalScope.save();
                            }
                        }
                    };
                });

                if (showModalContext.autoSlide !== false) {
                    addModal(renderedPromise);
                }

                // Handle when the modal is exited
                modalInstance.result.then(closeCallback, dismissCallback);
            };

            return service;
        });
}());
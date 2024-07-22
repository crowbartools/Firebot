"use strict";

(function() {
    /** @typedef {import("../../../types/variable-macros").VariableMacro} VariableMacro */

    const VALID_MACRO_NAME_REGEX = /^[a-z][a-z0-9]*$/i;

    angular
        .module("firebotApp")
        .factory("variableMacroService", function(backendCommunicator, utilityService, objectCopyHelper, ngToast) {
            const service = {};

            /** @type {VariableMacro[]} */
            service.macros = [];

            /**
             * @memberof variableMacroService
             * @param {VariableMacro} macro
             * @returns {void}
             */
            const updateMacros = (macro) => {
                const index = service.macros.findIndex(m => m.id === macro.id);
                if (index > -1) {
                    service.macros[index] = macro;
                } else {
                    service.macros.push(macro);
                }
            };

            /**
             * @returns {Promise.<void>}
             */
            service.loadMacros = async () => {
                const macros = await backendCommunicator.fireEventAsync("macros:get-all");

                if (macros) {
                    service.macros = macros;
                }
            };

            backendCommunicator.on("macros:updated", () => {
                service.loadMacros();
            });

            /**
             * @param {string} macroId
             * @returns {VariableMacro}
             */
            service.getMacro = (macroId) => {
                return service.macros.find(m => m.id === macroId);
            };

            /**
             * @param {string} name
             * @returns {VariableMacro}
             */
            service.getMacroByName = (name) => {
                return service.macros.find(m => m.name === name);
            };

            /**
             * @param {string} name
             * @returns {VariableMacro}
             */
            service.isMacroNameValid = (name) => {
                return name.length >= 3 && VALID_MACRO_NAME_REGEX.test(name);
            };

            /**
             * @param {VariableMacro} macro
             * @returns {Promise.<void>}
             */
            service.saveMacro = async (macro) => {
                const savedMacro = await backendCommunicator.fireEventAsync("macros:save", JSON.parse(angular.toJson(macro)));

                if (savedMacro) {
                    updateMacros(savedMacro);
                    return true;
                }

                return false;
            };

            service.saveAllMacros = (macros) => {
                service.macros = macros;
                backendCommunicator.fireEvent(
                    "macros:save-all",
                    JSON.parse(angular.toJson(macros))
                );
            };

            /**
             * @param {string} macroId
             * @returns {void}
             */
            service.deleteMacro = (macroId) => {
                service.macros = service.macros.filter(m => m.id !== macroId);
                backendCommunicator.fireEvent("macros:delete", macroId);
            };

            service.duplicateMacro = (macroId) => {
                const macro = service.macros.find(pel => pel.id === macroId);
                if (macro == null) {
                    return;
                }
                const copiedMacro = objectCopyHelper.copyObject("variable_macro", macro);
                copiedMacro.id = null;

                while (service.getMacroByName(copiedMacro.name) != null) {
                    copiedMacro.name += "Copy";
                }

                service.saveMacro(copiedMacro).then((successful) => {
                    if (successful) {
                        ngToast.create({
                            className: 'success',
                            content: 'Successfully duplicated variable macro!'
                        });
                    } else {
                        ngToast.create("Unable to duplicate variable macro.");
                    }
                });
            };

            /**
             * @param {VariableMacro} [macro]
             * @returns {void}
             */
            service.showAddOrEditVariableMacroModal = (macro, closeCb) => {
                utilityService.showModal({
                    component: "addOrEditVariableMacroModal",
                    size: "md",
                    resolveObj: {
                        macro: () => macro
                    },
                    closeCallback: closeCb,
                    dismissCallback: closeCb
                });
            };

            return service;
        });
})();
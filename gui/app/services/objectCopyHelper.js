"use strict";

(function() {

    const uuid = require("uuid/v1");

    angular
        .module("firebotApp")
        .factory("objectCopyHelper", function(backendCommunicator) {
            let service = {};

            let copiedEffects = [];

            service.hasCopiedEffects = () => copiedEffects.length > 0;

            service.copiedEffectsCount = () => copiedEffects.length;

            service.copyEffects = function(effects) {
                let clonedEffects = [];
                for (let effect of effects) {
                    clonedEffects.push(JSON.parse(angular.toJson(effect)));
                }
                copiedEffects = clonedEffects;
            };

            service.getCopiedEffects = async function(triggerType, triggerMeta) {

                let effectDefs;
                if (triggerType) {
                    effectDefs = await backendCommunicator
                        .fireEventAsync("getEffectDefinitions", {
                            triggerType: triggerType,
                            triggerMeta: triggerMeta
                        });
                }

                return copiedEffects
                    .filter(e => !effectDefs || effectDefs.find(ed => ed.id === e.type))
                    .map(e => {
                        e.id = uuid();
                        return e;
                    });
            };

            return service;
        });
}());

"use strict";

(function() {

    const uuid = require("uuid/v1");

    angular
        .module("firebotApp")
        .factory("objectCopyHelper", function(listenerService) {
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

            service.getCopiedEffects = function(triggerType, triggerMeta) {

                let effectDefs;
                if (triggerType) {
                    effectDefs = listenerService
                        .fireEventSync("getEffectDefinitions", {
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

"use strict";

(function() {

    const { v4: uuid } = require("uuid");

    angular
        .module("firebotApp")
        .factory("objectCopyHelper", function(backendCommunicator) {
            const service = {};

            let copiedEffects = [];

            service.hasCopiedEffects = () => copiedEffects.length > 0;

            service.copiedEffectsCount = () => copiedEffects.length;

            service.copyEffects = function(effects) {
                const clonedEffects = [];
                for (const effect of effects) {
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

                return JSON.parse(angular.toJson(copiedEffects))
                    .filter(e => !effectDefs || effectDefs.find(ed => ed.id === e.type))
                    .map(e => {
                        e.id = uuid();
                        return e;
                    });
            };

            const copiedObjectsCache = {};

            service.copyAndReplaceIds = function(object) {
                const copiedObject = JSON.parse(angular.toJson(object));
                const keys = Object.keys(copiedObject);

                for (const key of keys) {
                    const value = copiedObject[key];

                    if (key === "id") {
                        copiedObject[key] = uuid();
                    } else if (value && typeof value === "object") {
                        copiedObject[key] = service.copyAndReplaceIds(value);
                    }
                }

                return copiedObject;
            };

            service.copyObject = (key, object) => {
                const copied = service.copyAndReplaceIds(object);
                copiedObjectsCache[key] = object;
                return copied;
            };

            service.hasObjectCopied = (key) => copiedObjectsCache[key] != null;

            service.getCopiedObject = (key) => {
                const object = copiedObjectsCache[key];
                if (!object) {
                    return null;
                }

                return service.copyAndReplaceIds(object);
            };

            return service;
        });
}());

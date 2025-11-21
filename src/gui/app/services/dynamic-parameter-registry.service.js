"use strict";
(function() {
    angular
        .module("firebotApp")
        .factory("dynamicParameterRegistry", function() {
            const types = new Map();
            return {
                register(type, def) {
                    const typeIsKebabCase = /^[a-z]+(-[a-z]+)*$/.test(type);
                    if (!type || !def || !def.tag || !typeIsKebabCase) {
                        throw new Error('dynamicParameterRegistry.register(type, { tag }) requires a kebab-cased tag');
                    }

                    const typeAlreadyRegistered = types.has(type);
                    if (typeAlreadyRegistered) {
                        throw new Error(`dynamicParameterRegistry.register(type, { tag }) type "${type}" already registered`);
                    }

                    types.set(type, { ...def });
                },
                get(type) {
                    return types.get(type);
                },
                has(type) {
                    return types.has(type);
                },
                list() {
                    return Array.from(types.keys());
                }
            };
        });
}());

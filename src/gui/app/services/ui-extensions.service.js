"use strict";

(function() {
    angular
        .module("firebotApp")
        .factory("uiExtensionsService", function(backendCommunicator) {
            const service = {};

            service.extensions = [];

            service.setAsReady = () => {
                backendCommunicator.send("ui-extensions-ready");
            };

            function parseRawExtension(extension) {
                return {
                    id: extension.id,
                    pages: extension.pages?.map(page => ({
                        id: page.id,
                        name: page.name,
                        icon: page.icon,
                        type: page.type,
                        template: page.template,
                        // eslint-disable-next-line no-eval
                        controller: page.controllerRaw ? eval(page.controllerRaw) : undefined
                    })),
                    providers: extension.providers
                        ? {
                            factories: extension.providers.factories?.map(factory => ({
                                name: factory.name,
                                // eslint-disable-next-line no-eval
                                function: factory.functionRaw ? eval(factory.functionRaw) : undefined
                            })),
                            components: extension.providers.components?.map(component => ({
                                name: component.name,
                                binding: component.binding,
                                template: component.template,
                                transclude: component.transclude,
                                // eslint-disable-next-line no-eval
                                controller: component.controllerRaw ? eval(component.controllerRaw) : undefined
                            })),
                            directives: extension.providers.directives?.map(directive => ({
                                name: directive.name,
                                // eslint-disable-next-line no-eval
                                function: directive.functionRaw ? eval(directive.functionRaw) : undefined
                            })),
                            filters: extension.providers.filters?.map(filter => ({
                                name: filter.name,
                                // eslint-disable-next-line no-eval
                                function: filter.functionRaw ? eval(filter.functionRaw) : undefined
                            }))
                        }
                        : undefined
                };
            }

            backendCommunicator.on("all-ui-extensions", (extensions) => {
                const parsedExtensions = extensions.map(parseRawExtension);
                service.extensions = [
                    ...service.extensions,
                    ...parsedExtensions
                ];
            });

            backendCommunicator.on("ui-extension-registered", (extension) => {
                const parsedExtension = parseRawExtension(extension);
                service.extensions = [
                    ...service.extensions,
                    parsedExtension
                ];
            });

            return service;
        });
}());

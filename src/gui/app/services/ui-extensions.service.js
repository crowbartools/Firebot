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

            service.getPage = (extensionId, pageId) => {
                const extension = service.extensions.find(e => e.id === extensionId);
                if (!extension) {
                    return null;
                }
                const page = extension.pages?.find(p => p.id === pageId);
                return page;
            };

            function parseRawExtension(extension) {
                const normalizedExtensionId = extension.id.toLowerCase().replace(/ /, "-");
                return {
                    id: normalizedExtensionId,
                    pages: extension.pages?.map((page) => {
                        const normalizedPageId = page.id.toLowerCase().replace(/ /, "-");
                        return {
                            id: normalizedPageId,
                            name: page.name,
                            href: `extension/${normalizedExtensionId}/${normalizedPageId}`,
                            icon: page.icon,
                            type: page.type,
                            fullPage: page.fullPage,
                            disableScroll: page.disableScroll,
                            template: page.template,
                            // eslint-disable-next-line no-eval
                            controller: page.controllerRaw ? eval(page.controllerRaw) : undefined
                        };
                    }),
                    providers: extension.providers
                        ? {
                            factories: extension.providers.factories?.map(factory => ({
                                name: factory.name,
                                // eslint-disable-next-line no-eval
                                function: factory.functionRaw ? eval(factory.functionRaw) : undefined
                            })),
                            components: extension.providers.components?.map(component => ({
                                name: component.name,
                                bindings: component.bindings,
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

            function installExtension(extension) {
                const parsedExtension = parseRawExtension(extension);
                service.extensions = [
                    ...service.extensions,
                    parsedExtension
                ];

                if (parsedExtension.providers) {
                    parsedExtension.providers.factories?.forEach((factory) => {
                        angular.module("firebotApp").factory(factory.name, factory.function);
                        // eslint-disable-next-line no-undef
                        ngProviders?.$provide.factory(factory.name, factory.function);
                    });
                    parsedExtension.providers.components?.forEach((component) => {
                        angular.module("firebotApp").component(component.name, {
                            bindings: component.bindings,
                            template: component.template,
                            transclude: component.transclude,
                            controller: component.controller
                        });
                        // eslint-disable-next-line no-undef
                        ngProviders?.$compileProvider.component(component.name, {
                            bindings: component.bindings,
                            template: component.template,
                            transclude: component.transclude,
                            controller: component.controller
                        });
                    });
                    parsedExtension.providers.directives?.forEach((directive) => {
                        angular.module("firebotApp").directive(directive.name, directive.function);
                        // eslint-disable-next-line no-undef
                        ngProviders?.$compileProvider.directive(directive.name, directive.function);
                    });
                    parsedExtension.providers.filters?.forEach((filter) => {
                        angular.module("firebotApp").filter(filter.name, filter.function);
                        // eslint-disable-next-line no-undef
                        ngProviders?.$filterProvider.register(filter.name, filter.function);
                    });
                }
            }

            backendCommunicator.on("all-ui-extensions", (extensions) => {
                for (const extension of extensions) {
                    installExtension(extension);
                }
            });

            backendCommunicator.on("ui-extension-registered", (extension) => {
                installExtension(extension);
            });

            return service;
        });
}());

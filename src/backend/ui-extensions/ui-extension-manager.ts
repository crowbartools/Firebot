import type { UIExtension } from "../../types";
import frontendCommunicator from "../common/frontend-communicator";
import { LoggerCache } from "../logger-cache";

type RegisteredUIExtension = UIExtension & {
    pluginId?: string;
};

class UIExtensionManager {
    private _logger = LoggerCache.getLogger("UI Extensions");
    private _extensions: RegisteredUIExtension[] = [];
    private _pendingRemovals: string[] = [];
    private _pendingRegistrations: RegisteredUIExtension[] = [];

    private uiReady = false;

    registerUIExtension(extension: UIExtension, pluginId?: string): boolean {
        const existingExtension = this._extensions.find(ext => ext.id === extension.id);
        if (existingExtension) {
            if (!!existingExtension.pluginId?.length && existingExtension.pluginId === pluginId) {
                if (this._pendingRemovals.some(e => e === extension.id)) {
                    this._pendingRegistrations.push({
                        ...extension,
                        pluginId
                    });

                    this._logger.info(`UI Extension ${extension.id} queued for reload after frontend reload`);
                    return true;
                }

                this._logger.warn(`Plugin ${pluginId} has already registered UI Extension with ID ${extension.id}`);
                return false;
            }

            throw new Error(`UI Extension with ID ${extension.id} already registered`);
        }

        this._extensions.push({
            ...extension,
            pluginId
        });

        if (this.uiReady) {
            frontendCommunicator.send("ui-extensions:ui-extension-registered", this.prepareExtensionForFrontend(extension));
        }

        return true;
    }

    queueUIExtensionRemoval(extensionId: string) {
        const existingPendingRemoval = this._pendingRemovals.find(e => e === extensionId);

        if (existingPendingRemoval != null) {
            this._logger.warn(`UI Extension ${extensionId} is already queued for removal`);
        } else {
            this._pendingRemovals.push(extensionId);

            this._logger.debug(`UI Extension ${extensionId} queued up for removal`);
        }

        // If we get here and this same extension is already pending re-registration,
        // then it might have been disabled again, so let's remove it from the
        // re-registration queue. If it really needs to be there (like a plugin reload),
        // `registerUIExtension` will just put it back in there.
        const pendingRegistrationIndex = this._pendingRegistrations.findIndex(e => e.id === extensionId);

        if (pendingRegistrationIndex > -1) {
            this._pendingRegistrations.splice(pendingRegistrationIndex, 1);
        }
    }

    setUIReadyForExtensions(): void {
        this.uiReady = true;

        // Remove any UI Extensions that are pending removal (updated, disabled, uninstalled, etc)
        while (this._pendingRemovals.length > 0) {
            const oldExtension = this._pendingRemovals.shift();

            if (!!oldExtension?.length) {
                this._extensions = this._extensions.filter(e => e.id !== oldExtension);
                this._logger.debug(`Unregistered UI Extension ${oldExtension}`);
            }
        }

        while (this._pendingRegistrations.length > 0) {
            const newExtension = this._pendingRegistrations.shift();

            if (newExtension != null) {
                const existingExtension = this._extensions.find(ext => ext.id === newExtension.id);

                if (existingExtension) {
                    if (!!existingExtension.pluginId?.length && existingExtension.pluginId === newExtension.pluginId) {
                        this._logger.warn(`Plugin ${newExtension.pluginId} has already registered UI Extension with ID ${newExtension.id}`);
                    }

                    this._logger.error(`UI Extension with ID ${newExtension.id} already registered`);
                } else {
                    this._extensions.push(newExtension);
                    this._logger.debug(`UI Extension ${newExtension.id} re-registered for plugin ${newExtension.pluginId}`);
                }
            }
        }

        frontendCommunicator.send("ui-extensions:all-ui-extensions", this._extensions.map(ext => this.prepareExtensionForFrontend(ext)));
    }

    private prepareExtensionForFrontend(extension: UIExtension) {
        return {
            id: extension.id,
            pages: extension.pages?.map(page => ({
                id: page.id,
                name: page.name,
                icon: page.icon,
                type: page.type,
                template: page.template,
                fullPage: page.fullPage,
                disableScroll: page.disableScroll,
                controllerRaw: this.prepareFunc(page.controller, "pageCtrl")
            })),
            providers: extension.providers
                ? {
                    factories: extension.providers.factories?.map(factory => ({
                        name: factory.name,
                        functionRaw: this.prepareFunc(factory.function, "factoryFunc")
                    })),
                    components: extension.providers.components?.map(component => ({
                        name: component.name,
                        bindings: component.bindings,
                        template: component.template,
                        transclude: component.transclude,
                        controllerRaw: this.prepareFunc(component.controller, "componentCtrl")
                    })),
                    directives: extension.providers.directives?.map(directive => ({
                        name: directive.name,
                        functionRaw: this.prepareFunc(directive.function, "directiveCtrl")
                    })),
                    filters: extension.providers.filters?.map(filter => ({
                        name: filter.name,
                        functionRaw: this.prepareFunc(filter.function, "filterFunc")
                    })),
                    parameters: extension.providers.parameters?.map(param => ({
                        parameterConfig: param.parameterConfig,
                        template: param.template,
                        controllerRaw: this.prepareFunc(param.controller, "paramCtrl")
                    }))
                }
                : undefined
        };
    }

    private prepareFunc(func: Function | undefined, name: string) {
        let rawFunc = func?.toString() ?? "() => {}";
        const namelessFunction = /^[\s]*function[\s]*\(/;
        if (namelessFunction.test(rawFunc)) {
            rawFunc = rawFunc.replace(namelessFunction, `function ${name}(`);
        }
        return rawFunc;
    }
}

const manager = new UIExtensionManager();

export { manager as UIExtensionManager };
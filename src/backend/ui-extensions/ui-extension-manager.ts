import frontendCommunicator from "../common/frontend-communicator";
import { UIExtension } from "./extension-types";

class UIExtensionManager {
    private _extensions: UIExtension[] = [];

    private uiReady = false;

    registerUIExtension(extension: UIExtension): void {
        if (this._extensions.find(ext => ext.id === extension.id)) {
            throw new Error(`Extension with id ${extension.id} already registered`);
        }

        this._extensions.push(extension);

        if (this.uiReady) {
            frontendCommunicator.send("ui-extension-registered", this.prepareExtensionForFrontend(extension));
        }
    }

    setUIReadyForExtensions(): void {
        if (this.uiReady) {
            return;
        }
        this.uiReady = true;
        frontendCommunicator.send("all-ui-extensions", this._extensions.map(ext => this.prepareExtensionForFrontend(ext)));
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
                controllerRaw: page.controller?.toString()
            })),
            providers: extension.providers
                ? {
                    factories: extension.providers.factories?.map(factory => ({
                        name: factory.name,
                        functionRaw: factory.function?.toString()
                    })),
                    components: extension.providers.components?.map(component => ({
                        name: component.name,
                        binding: component.binding,
                        template: component.template,
                        transclude: component.transclude,
                        controllerRaw: component.controller?.toString()
                    })),
                    directives: extension.providers.directives?.map(directive => ({
                        name: directive.name,
                        functionRaw: directive.function?.toString()
                    })),
                    filters: extension.providers.filters?.map(filter => ({
                        name: filter.name,
                        functionRaw: filter.function?.toString()
                    }))
                }
                : undefined
        };
    }
}

const manager = new UIExtensionManager();

frontendCommunicator.on("ui-extensions-ready", () => {
    manager.setUIReadyForExtensions();
});

export = manager;

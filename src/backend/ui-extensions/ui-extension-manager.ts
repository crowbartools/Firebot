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
                    }))
                }
                : undefined
        };
    }

    // eslint-disable-next-line @typescript-eslint/ban-types
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

frontendCommunicator.on("ui-extensions-ready", () => {
    manager.setUIReadyForExtensions();
});

export = manager;

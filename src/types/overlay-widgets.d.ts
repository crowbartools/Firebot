export type OverlayWidgetType = {
    id: string;
    name: string;
    description: string;
    /**
     * @default true
     */
    userConfigurablePosition?: boolean;
    options: unknown;
    overlayExtension: {
        dependencies: {
            css: string[];
            js: string[];
        };
        events: {
            onShow: (parentElementId: string, options: unknown, position: unknown) => void;
            onUpdate: (parentElementId: string, options: unknown) => void;
            onRemove: (parentElementId: string, options: unknown) => void;
        };
    };
};
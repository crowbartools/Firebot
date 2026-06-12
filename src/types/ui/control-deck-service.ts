export type ControlDeckService = {
    getControlType: (typeId: string) => {
        settingsSchema?: Array<{ name: string, type?: string }>;
    } | null;
};
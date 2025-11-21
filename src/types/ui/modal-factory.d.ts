import type { EffectInstance } from "../effects";

export type ModalFactory = {
    showEditEffectModal: (
        effectInstance: EffectInstance,
        effectIndex: number | null,
        trigger: TriggerType,
        closeCallback: (response: {
            action: "add" | "update" | "delete";
            effect: EffectInstance | null;
            index: number;
        }) => void,
        triggerMeta: unknown,
        isNewEffect: boolean
    ) => void;
    openGetInputModal: <T extends string | number>(options: {
        model: T;
        inputType?: "text" | "number" | "password";
        label: string;
        inputPlaceholder?: string;
        saveText?: string;
        useTextArea?: boolean;
        descriptionText?: string;
        validationFn?: (input: T) => Promise<boolean>;
        validationText?: string;
        trigger?: TriggerType;
        triggerMeta?: unknown;
    }, callback: (result: T) => void, dismissCallback?: () => void) => void;
};

import type { FirebotSettingsTypes } from "./settings";
import type { EffectInstance } from "./effects";

export type BindingsDefinition<Bindings> = {
    [K in keyof Bindings]: {} extends Pick<Bindings, K>
        ? Bindings[K] extends string
            ? "@?" | "<?" | "=?"
            : Bindings[K] extends boolean
                ? "<?" | "=?"
                : Bindings[K] extends number
                    ? "<?" | "=?"
                    : Bindings[K] extends (...args: any[]) => any
                        ? "&?"
                        : "<?" | "=?"
        : Bindings[K] extends string
            ? "@" | "<" | "="
            : Bindings[K] extends boolean
                ? "<" | "="
                : Bindings[K] extends number
                    ? "<" | "="
                    : Bindings[K] extends (...args: any[]) => any
                        ? "&"
                        : "<" | "=";
};

export type FirebotComponent<Bindings, ExtraControllerProps = {}> = angular.IComponentOptions & {
    bindings: BindingsDefinition<Bindings>;
    controller: (
        this: angular.IController & Bindings & ExtraControllerProps & { [key: string]: unknown },
        ...args: unknown[]
    ) => void;
};

export type EffectHelperService = {
    getAllEffectTypes: () => Promise<EffectType[]>;
};

export type SettingsService = {
    getSetting: <Key extends keyof FirebotSettingsTypes>(key: Key) => FirebotSettingsTypes[Key];
};

export type ModalService = {
    showModal: (options: {
        component?: string;
        resolveObj?: { [key: string]: unknown };
        dismissCallback?: () => void;
        closeCallback?: (data: unknown) => void;
        size?: "sm" | "md" | "mdlg" | "lg" | "xl";
        keyboard?: boolean;
        backdrop?: boolean | "static";
        controllerFunc?: angular.Injectable<angular.IControllerConstructor>;
        templateUrl?: string;
        windowClass?: string;
        breadcrumbName?: string;
        /**
         * @default true
         */
        autoSlide?: boolean;
    }) => void;
};

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

export type NgToast = {
    create: (options: { content: string, timeout?: number, className?: string }) => void;
};

export type FirebotRootScope = angular.IRootScopeService & {
    copyTextToClipboard: (text: string) => void;
};

export type ObjectCopyHelper = {
    copyEffects: (effects: EffectInstance[]) => void;
    getCopiedEffects: (trigger: TriggerType, triggerMeta: unknown) => Promise<EffectInstance[]>;
    hasCopiedEffects: () => boolean;
    cloneEffect: (effect: EffectInstance) => EffectInstance;
};

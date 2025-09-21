export type BaseParameter = {
    /**
     * The title of the parameter
     * Supports markdown
     */
    title: string;
    /**
     * The description of the parameter
     * Supports markdown
     */
    description?: string;
    /**
     * @deprecated use `title` and `description` instead
     */
    secondaryDescription?: string;
    /**
     * Shown under the parameter as muted text
     * Supports markdown
     */
    tip?: string;
    showBottomHr?: boolean;
    validation?: {
        required?: boolean;
        pattern?: string;
    };
    default?: unknown;
};

export type StringParameter = BaseParameter & {
    type: "string";
    useTextArea?: boolean;
    default: string;
};

export type PasswordParameter = BaseParameter & {
    type: "password";
    default: string;
};

export type BooleanParameter = BaseParameter & {
    type: "boolean";
    default: boolean;
};

export type NumberParameter = BaseParameter & {
    type: "number";
    placeholder?: string;
    default: number;
    validation?: {
        min?: number;
        max?: number;
    };
};

export type EnumParameter<G = string | number> = BaseParameter & {
    type: "enum";
    options: Array<G>;
    default: G | undefined;
    searchable?: boolean;
    /**
     * Only used if `searchable` is true
     */
    placeholder?: string;
};

export type FilepathParameter = BaseParameter & {
    type: "filepath";
    fileOptions?: {
        directoryOnly: boolean;
        filters: Array<{
            name: string;
            extensions: string[];
        }>;
        title: string;
        buttonLabel: string;
    };
};

export type EffectListParameter = BaseParameter & {
    type: "effectlist";
};

export type DiscordChannelWebhookParameter = BaseParameter & {
    type: "discord-channel-webhooks";
};

export type CurrencySelectParameter = BaseParameter & {
    type: "currency-select";
    default?: string;
};

export type ChatterSelectParameter = BaseParameter & {
    type: "chatter-select";
    default?: "Bot" | "Streamer";
};

export type EditableListParameter = BaseParameter & {
    type: "editable-list";
    default?: string[];
    settings: {
        useTextArea: boolean;
        sortable: boolean;
        addLabel: string;
        editLabel: string;
        noneAddedText: string;
    };
};

export type MultiselectParameter<
    T extends string | number = string | number
> = BaseParameter & {
    type: "multiselect";
    default?: T[];
    settings: {
        options: Array<{
            id: T;
            name: string;
        }>;
    };
};

export type RolePercentageParameterValue = {
    basePercent: number;
    roles: Array<{
        roleId: string;
        percent: number;
    }>;
};

export type RolePercentagesParameter = BaseParameter & {
    type: "role-percentages";
    default?: RolePercentageParameterValue;
};

export type RoleNumberParameterValue = {
    base: number;
    roles: Array<{
        roleId: string;
        value: number;
    }>;
};

export type RoleNumberParameter = BaseParameter & {
    type: "role-numbers";
    default?: RoleNumberParameterValue;
    settings: {
        defaultBase: number;
        defaultOther: number;
        min?: number;
        max?: number;
    };
};

export type ButtonParameter = BaseParameter & {
    type: "button";
    /**
     * The event name that will be sent to the backend when the button is clicked
     */
    backendEventName: string;
    buttonText: string;
    size?: "extraSmall" | "small" | "large";
    buttonType?:
    | "default"
    | "primary"
    | "success"
    | "info"
    | "warning"
    | "danger"
    | "link";
    tooltip?: string;
    tooltipPlacement?:
    | "top"
    | "top-left"
    | "top-right"
    | "bottom"
    | "bottom-left"
    | "bottom-right"
    | "left"
    | "left-top"
    | "left-bottom"
    | "right"
    | "right-top"
    | "right-bottom";
};

export type HexColorParameter = BaseParameter & {
    type: "hexcolor";
    /**
     * Default hex color value, e.g. #FF0000
     */
    default: string;
    allowAlpha?: boolean;
};

export type UnknownParameter = BaseParameter & {
    [key: string]: unknown;
};

type FirebotParameter =
    | StringParameter
    | PasswordParameter
    | BooleanParameter
    | NumberParameter
    | EnumParameter
    | EffectListParameter
    | DiscordChannelWebhookParameter
    | CurrencySelectParameter
    | ChatterSelectParameter
    | EditableListParameter
    | MultiselectParameter
    | RolePercentagesParameter
    | RoleNumberParameter
    | ButtonParameter
    | UnknownParameter
    | HexColorParameter;

export type ParametersConfig<P> = {
    [K in keyof P]: (P[K] extends string
        ?
        | StringParameter
        | PasswordParameter
        | FilepathParameter
        | ChatterSelectParameter
        | CurrencySelectParameter
        | EnumParameter<string>
        : P[K] extends number
            ? NumberParameter | EnumParameter<number>
            : P[K] extends boolean
                ? BooleanParameter | EnumParameter<boolean>
                : P[K] extends Array<string>
                    ? MultiselectParameter<string> | EditableListParameter
                    : P[K] extends Array<number>
                        ? MultiselectParameter<number>
                        : P[K] extends void | undefined | null
                            ? ButtonParameter
                            : P[K] extends RolePercentageParameterValue
                                ? RolePercentagesParameter
                                : P[K] extends RoleNumberParameterValue
                                    ? RoleNumberParameter
                                    : P[K] extends Firebot.EffectList
                                        ? EffectListParameter
                                        : FirebotParameter);
};

export type ParametersWithNameConfig<P> = {
    [K in keyof P]: (P[K] extends string
        ?
        | StringParameter
        | PasswordParameter
        | FilepathParameter
        | ChatterSelectParameter
        | CurrencySelectParameter
        | EnumParameter<string>
        | HexColorParameter
        : P[K] extends number
            ? NumberParameter | EnumParameter<number>
            : P[K] extends boolean
                ? BooleanParameter | EnumParameter<boolean>
                : P[K] extends Array<string>
                    ? MultiselectParameter<string> | EditableListParameter
                    : P[K] extends Array<number>
                        ? MultiselectParameter<number>
                        : P[K] extends void | undefined | null
                            ? ButtonParameter
                            : P[K] extends RolePercentageParameterValue
                                ? RolePercentagesParameter
                                : P[K] extends RoleNumberParameterValue
                                    ? RoleNumberParameter
                                    : P[K] extends Firebot.EffectList
                                        ? EffectListParameter
                                        : FirebotParameter) & { name: K };
};

type FirebotParamCategory<ParamConfig extends Record<string, unknown>> = {
    title: string;
    /**
     * Used to order categories in the UI.
     */
    sortRank?: number;
    settings: ParametersConfig<ParamConfig>;
};

export type FirebotParams = Record<string, Record<string, unknown>>;

export type FirebotParameterCategories<Config extends FirebotParams> = {
    [Category in keyof Config]: FirebotParamCategory<Config[Category]>;
};

export type FirebotParameterArray<Config extends Record<string, unknown>> = ParametersWithNameConfig<Config>[keyof Config][];


// export type WithValues<Categories extends FirebotParameterCategories> = {
//     [Category in keyof Categories]: Categories[Category] & {
//         settings: {
//             [Setting in keyof Categories[Category]["settings"]]: Categories[Category]["settings"][Setting] & {
//                 value?: Categories[Category]["settings"][Setting]["default"];
//             };
//         };
//     }
// };

// type ValidParamKeys<T> = {
//     [P in keyof T]: Exclude<T[P], undefined> extends void | undefined | null
//         ? never
//         : P;
// }[keyof T];

// export type ResolvedParameters<Config extends FirebotParams> = {
//     [K in keyof Config]: Pick<Config[K], ValidParamKeys<Config[K]>>;
// }
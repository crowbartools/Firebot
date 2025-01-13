export type RoleNumberParameterValue = {
    base: number;
    roles: Array<{
        roleId: string;
        value: number;
    }>;
};
export type RolePercentageParameterValue = {
    basePercent: number;
    roles: Array<{
        roleId: string;
        percent: number;
    }>;
};

type SettingType =
    | "string"
    | "number"
    | "boolean"
    | "enum"
    | "filepath"
    | "currency-select"
    | "chatter-select"
    | "editable-list"
    | "role-percentages"
    | "role-numbers"
    | "multiselect";

type BaseSettingDefinition = {
    /** The type of the game settings value. */
    type: SettingType;
    /** Text shown above the setting in bold text. */
    title?: string;
    /** A short sub-text describing the purpose of the setting. */
    description?: string;
    /** Display a line under the setting. */
    showBottomHr?: boolean;
    /** A rank to tell the UI how to order settings. */
    sortRank?: number;
    /** Human-readable tip, this is rendered below the field in smaller muted text. */
    tip?: string;
    validation?: {
        /** Whether or not the setting is required to be assigned. */
        required?: boolean;
    };
};
type StringSettingDefinition = BaseSettingDefinition & {
    type: "string";
    /** Text shown above the setting in bold text. */
    title: string;
    /** The default value for the setting. */
    default?: string;
    /** `true` to display a `<textarea>` element; otherwise, displays an `<input type="text">` element. */
    useTextArea?: boolean;
};
type NumberSettingDefinition = BaseSettingDefinition & {
    type: "number";
    /** Text shown above the setting in bold text. */
    title: string;
    /** The default value for the setting. */
    default?: number;
    /** Text shown inside of the input element when the value is nullish. */
    placeholder?: string;
    validation?: {
        /** Whether or not the setting is required to be assigned. */
        required?: boolean;
        /** The minimum acceptable value for the setting. Only needed if the `type` is `number`. */
        min?: number;
        /** The maximum acceptable value for the setting. Only needed if the `type` is `number`. */
        max?: number;
    }
};
type BooleanSettingDefinition = BaseSettingDefinition & {
    type: "boolean";
    /** Text shown above the setting in bold text. */
    title: string;
    /** The default value for the setting. */
    default?: boolean;
};
type EnumSettingDefinition<T extends boolean | string | number> = BaseSettingDefinition & {
    type: "enum";
    /** The default value for the setting. */
    default?: T;
    /** The options available to select from. */
    options: T[];
    /** Text shown inside of the input element when the value is nullish. */
    placeholder?: string;
    settings?: {
        searchable?: boolean;
    };
};
type FilePathSettingDefinition = BaseSettingDefinition & {
    type: "filepath";
    fileOptions?: {
        /** The button label to display in the file chooser dialog for accepting the selected file or folder. */
        buttonLabel: string;
        /** Whether or not to accept only directories. */
        directoryOnly?: boolean;
        /** Optional filters used to limit the file types viewable in the file chooser dialog.  */
        filters?: {
            /** A name for the file type(s) that the filter covers, such as "Text Files" */
            name: string;
            /** The file extensions to filter upon, such as `["txt", "md"]` */
            extensions: string[];
        }[];
        /** The window caption to display on the file chooser dialog. */
        title: string;
    };
};
type CurrencySelectSettingDefinition = BaseSettingDefinition & {
    type: "currency-select";
    /** Text shown above the setting in bold text. */
    title: string;
    /** The default value for the setting. */
    default?: string;
};
type ChatterSelectDefinition = BaseSettingDefinition & {
    type: "chatter-select";
    /** Text shown above the setting in bold text. */
    title: string;
    /** The default value for the setting. */
    default?: "Bot" | "Streamer";
};
type EditListSettingDefinition = BaseSettingDefinition & {
    type: "editable-list";
    /** Text shown above the setting in bold text. */
    title: string;
    /** The default value for the setting. */
    default?: string[];
    settings: {
        /** The tooltip text shown for the add item button. */
        addLabel: string;
        /** The caption displayed on the edit item modal. */
        editLabel: string;
        /** Text shown in the control when there are no elements in the collection. */
        noneAddedText: string;
        /** Whether items in the collection can be reordered. */
        sortable: boolean;
        /** `true` to display a `<textarea>` element for adding or editing list items; otherwise, displays an `<input type="text">` element. */
        useTextArea: boolean;
    };
};
type RolePercentSettingDefinition = BaseSettingDefinition & {
    type: "role-percentages";
    /** The default value for the setting. */
    default?: RolePercentageParameterValue;
};
type MultiselectSettingDefinition<T extends string | number> = BaseSettingDefinition & {
    type: "multiselect";
    /** Text shown above the setting in bold text. */
    title: string;
    /** The default value for the setting. */
    default?: T[];
    settings: {
        /** The options available for the user to chose from. */
        options: {
            /** A unique identifier for the item. */
            id: T;
            /** A human-readable name to display for the item. */
            name: string;
        }[];
    };
};
type RoleNumbersSettingDefinition<T extends RoleNumberParameterValue> = BaseSettingDefinition & {
    type: "role-numbers";
    /** The default value for the setting. */
    default?: T;
    settings: {
        /** A default number used when no selected roles match for a given user. */
        defaultBase: number;
        /** A default number used for a role when it gets added to the list. */
        defaultOther: number;
        /** The minimum value acceptable for the setting. */
        min?: number | null;
        /** The maximum value acceptable for the setting. */
        max?: number | null;
    };
};
type SettingValueType = string | number | boolean | Array<string> | Array<number> | RoleNumberParameterValue | RolePercentageParameterValue;
export type SettingDefinition<T extends SettingValueType = SettingValueType> =
    T extends string
        ? ChatterSelectDefinition | CurrencySelectSettingDefinition | EnumSettingDefinition<T> | FilePathSettingDefinition | StringSettingDefinition
        : T extends number
            ? NumberSettingDefinition | EnumSettingDefinition<T>
            : T extends boolean
                ? BooleanSettingDefinition | EnumSettingDefinition<T>
                : T extends Array<string>
                    ? EditListSettingDefinition | MultiselectSettingDefinition<string>
                    : T extends Array<number>
                        ? MultiselectSettingDefinition<number>
                        : T extends RoleNumberParameterValue
                            ? RoleNumbersSettingDefinition<T>
                            : T extends RolePercentageParameterValue
                                ? RolePercentSettingDefinition
                                : BaseSettingDefinition;

/**
 * A setting category which holds a dictionary of settings.
 */
export type SettingCategoryDefinition<Category extends Record<string, SettingValueType> = Record<string, SettingValueType>> = {
    /** Text shown in the settings category header. */
    title: string;
    /** The order in which to display the settings categories. */
    sortRank: number;
    /** Definitions for the settings that are included in the category. */
    settings: {
        [K in keyof Category]: SettingDefinition<Category[K]>;
    };
};

export type GameSettings<Settings extends Record<string, Record<string, SettingValueType>> = Record<string, Record<string, SettingValueType>>> = {
    /** Whether or not the game is currently active. */
    active: boolean;
    /**
     * Dictionary of dictionaries that contains game settings saved by the user.
     * Outer index: category; inner: setting in that category.
     */
    settings: Settings;
};

type GameFn<Settings extends Record<string, Record<string, SettingValueType>>> = (gameSettings: GameSettings<Settings>) => void;

type SettingCategories<Settings extends Record<string, Record<string, SettingValueType>>> = {
    [K in keyof Settings]: SettingCategoryDefinition<Settings[K]>;
};

export type FirebotGame<Settings extends Record<string, Record<string, SettingValueType>> = Record<string, Record<string, SettingValueType>>> = {
    /**
     * Must be unique among all games registered in the Firebot system.
     */
    id: string;
    /** The name displayed for the game, such as "Trivia" or "Heist". */
    name: string;
    /** A brief byline for the game, such as "Knowledge is power" for the Trivia game. */
    subtitle: string;
    /** A long-form description of the game, displayed when editing the game's settings. */
    description: string;
    /**
     * Font Awesome 5 icon to use for the game, ie `fa-dice-three`.
     */
    icon: string;
    /** The user-adjustable settings available for the game. */
    settingCategories: {
        [Category in keyof Settings]: SettingCategoryDefinition<Settings[Category]>;
    };
    /**
     * Called when the game is enabled, either on app load or if the user enables the game later.
     * You can register a system command here or set up any required game state.
     */
    onLoad: GameFn<Settings>;
    /**
     * Called when the game was previously active but has since been disabled.
     * You should unregister any system commands here and clear out any game state.
     */
    onUnload: GameFn<Settings>;
    /**
     * Called whenever the settings from `settingCategories` are updated by the user.
     */
    onSettingsUpdate: GameFn<Settings>;
};

export type GameManager<Settings extends Record<string, Record<string, SettingValueType>> = Record<string, Record<string, SettingValueType>>> = {
    /**
     * Registers a game in the Firebot system.
     *
     * Does not register the game if its `id` already exists in the Firebot system.
     * @param game that should be registered.
     */
    registerGame: (game: FirebotGame<Settings>) => void;
    /**
     * Unregister a game from Firebot, such as if it's provided by an external script that is being unloaded.
     * @param gameId The unique identifier of the game.
     */
    unregisterGame: (gameId: string) => void;
    getGameSettings: (gameId: string) => GameSettings<Settings>;
};

import { FirebotChatMessage } from "./chat";
import { EffectList } from "./effects";
import { RestrictionData } from "./restrictions";

export type CommandType = "system" | "custom";

type Cooldown = {
    /**
     * Global cooldown to use a command in seconds.
     */
    global: number | undefined;
    /**
     * Cooldown for each user to use a command in seconds.
     */
    user: number | undefined;
};

export type SubCommand = {
    arg: string;
    usage: string;
    active?: boolean;
    autoDeleteTrigger?: boolean | undefined;
    id?: string;
    description?: string;
    minArgs?: number;
    regex?: boolean;
    fallback?: boolean;
    restrictionData?: RestrictionData;
    cooldown?: Cooldown | undefined;
    inheritBaseCommandCooldown?: boolean;
    effects?: EffectList;
};

type CommandOptionBase = {
    type: "string" | "number" | "boolean" | "enum";
    title: string;
    default: unknown;
    description?: string;
    value?: unknown;
}

type CommandStringOption = CommandOptionBase & {
    type: "string";
    default: string;
    tip?: string;
    useTextArea?: boolean;
    value?: string;
};

type CommandNumberOption = CommandOptionBase & {
    type: "number";
    default: number;
    value?: number;
};

type CommandBooleanOption = CommandOptionBase & {
    type: "boolean";
    default: boolean;
    value?: boolean;
};

type CommandEnumOption = CommandOptionBase & {
    type: "enum";
    options: string[];
    default: string;
    value?: string;
};

type CommandOption = CommandStringOption | CommandNumberOption | CommandBooleanOption | CommandEnumOption;

export type CommandDefinition = {
    id?: string;
    name?: string;
    description?: string;
    type?: CommandType;
    createdBy?: string;
    createdAt?: Date | string;
    lastEditBy?: string | undefined;
    lastEditAt?: Date | string | undefined;
    /**
     * Describes how many times the command has been used in chat.
     */
    count?: number;
    active: boolean;
    trigger: string;
    triggerIsRegex?: boolean | undefined;
    scanWholeMessage?: boolean | undefined;
    aliases?: string[];
    usage?: string;
    /**
     * If the chat message that triggered the command should be deleted automatically.
     */
    autoDeleteTrigger?: boolean | undefined;
    /**
     * If the UI should show the edit page in simple or advanced mode.
     */
    simple?: boolean;
    /**
     * If the command should be hidden from the `!commands` list.
     */
    hidden?: boolean | undefined;
    ignoreStreamer?: boolean | undefined;
    ignoreBot?: boolean | undefined;
    ignoreWhispers?: boolean | undefined;
    /**
     * If a chat message should be sent when the command is tried to be used but
     * the cooldown is not yet over.
     */
    sendCooldownMessage?: boolean;
    useCustomCooldownMessage?: boolean;
    cooldownMessage?: string;
    baseCommandDescription?: string | undefined;
    sortTags?: string[];
    cooldown?: Cooldown | undefined;
    effects?: EffectList;
    restrictionData?: RestrictionData;
    subCommands?: SubCommand[] | undefined;
    fallbackSubcommand?: SubCommand | undefined;
    treatQuotedTextAsSingleArg?: boolean | undefined;
    minArgs?: number;
    options?: Record<keyof OptionsModel, CommandOption>;
    /**
     * Only set for currency system commands.
     */
    currency?: {
        name: string;
        id: string;
    };
    allowTriggerBySharedChat?: boolean | "inherit" | undefined;
};

type UserCommand = {
    trigger: string;
    args: string[];
    triggeredSubcmd?: SubCommand;
    isInvalidSubcommandTrigger?: boolean;
    triggeredArg?: string;
    subcommandId?: string;
    commandSender: string;
    senderRoles: string[];
};

type BasicCommandDefinition = Omit<
CommandDefinition,
| "type"
| "createdBy"
| "createdAt"
| "lastEditBy"
| "lastEditAt"
| "count"
| "simple"
>;

type SystemSubcommand = SubCommand & {
    hideCooldowns?: boolean;
};

export type SystemCommandDefinition = Omit<CommandDefinition, "subCommands"> & {
    hideCooldowns?: boolean;
    subCommands?: SystemSubcommand[];
};

export type SystemCommand<OptionsModel = unknown> = {
    definition: SystemCommandDefinition;
    onTriggerEvent: (
        event: {
            command: SystemCommand<OptionsModel>['definition'];
            userCommand: UserCommand;
            chatMessage: FirebotChatMessage;
            commandOptions?: {
                [x in keyof OptionsModel]: OptionsModel[x]
            };
        }
    ) => PromiseLike<boolean> | boolean | PromiseLike<void> | void;
};
import { FirebotChatMessage } from "./chat";
import { EffectList } from "./effects";

type CommandType = "system" | "custom";

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

type RestrictionData = {
    /**
     * Sets the command to only trigger when all/any/none of the restrictions pass.
     */
    mode?: "all" | "any" | "none";
    /**
     * If a chat message should be sent when the restrictions are not met.
     */
    sendFailMessage?: boolean;
    failMessage?: string;
    restrictions: unknown[]; // TODO: change when restriction-manager and companion types are added
};

export type SubCommand = {
    arg: string;
    usage: string;
    id?: string;
    description?: string;
    minArgs?: number;
    regex?: boolean;
    fallback?: boolean;
    restrictionData?: RestrictionData;
};

export type CommandDefinition = {
    id: string;
    name: string;
    description: string;
    type?: CommandType;
    createdBy?: string;
    createdAt?: Date;
    lastEditBy?: string | undefined;
    lastEditAt?: Date | undefined;
    /**
     * Describes how many times the command has been used in chat.
     */
    count?: number;
    active: boolean;
    trigger: string;
    triggerIsRegex?: boolean | undefined;
    scanWholeMessage?: boolean | undefined;
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
    ignoreWhisper?: boolean | undefined;
    /**
     * If a chat message should be sent when the command is tried to be used but
     * the cooldown is not yet over.
     */
    sendCooldownMessage?: boolean;
    baseCommandDescription?: string | undefined;
    sortTags?: string[];
    cooldown?: Cooldown | undefined;
    effects?: EffectList;
    restrictionData?: RestrictionData;
    subCommands?: SubCommand[] | undefined;
    fallbackSubcommand?: SubCommand | undefined;
};

type SystemCommandOptionBase = {
    type: "string" | "number" | "boolean" | "enum";
    title: string;
    default: unknown;
    description?: string;
}

type SystemCommandStringOption = SystemCommandOptionBase & {
    type: "string";
    default: string;
    tip?: string;
    useTextArea?: boolean;
};

type SystemCommandNumberOption = SystemCommandOptionBase & {
    type: "number";
    default: number;
};

type SystemCommandBooleanOption = SystemCommandOptionBase & {
    type: "boolean";
    default: boolean;
};

type SystemCommandEnumOption = SystemCommandOptionBase & {
    type: "enum";
    options: string[];
    default: string;
};

type SystemCommandOption = SystemCommandStringOption | SystemCommandNumberOption | SystemCommandBooleanOption | SystemCommandEnumOption;

type UserCommand = {
    trigger: string;
    args: string[];
    triggeredSubcmd?: CommandDefinition;
    isInvalidSubcommandTrigger: boolean;
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

export type SystemCommand<OptionsModel = unknown> = {
    definition: CommandDefinition & {
        minArgs?: number;
        options?: Record<keyof OptionsModel, SystemCommandOption>;
        hideCooldowns?: boolean;
    };
    onTriggerEvent: (
        event: {
            command: SystemCommand<OptionsModel>['definition'];
            userCommand: UserCommand;
            chatMessage: FirebotChatMessage;
            commandOptions?: {
                [x in keyof OptionsModel]: OptionsModel[x]
            };
        }
    ) => PromiseLike<void> | void;
};
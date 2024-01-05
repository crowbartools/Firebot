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
    minArgs?: number;
    regex?: boolean;
    fallback?: boolean;
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
    options?: Record<string, unknown> | undefined;
    subCommands?: SubCommand[] | undefined;
    fallbackSubcommand?: SubCommand | undefined;
};

type SystemCommandDefinition = CommandDefinition & {
    hideCooldowns?: boolean;
};

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

type SystemCommandTriggerEvent = {
    command: CommandDefinition;
    commandOptions: Record<string, any>;
    userCommand: UserCommand;
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

export type SystemCommand = {
    definition: SystemCommandDefinition;
    onTriggerEvent: (
        event: SystemCommandTriggerEvent
    ) => PromiseLike<void> | void;
};
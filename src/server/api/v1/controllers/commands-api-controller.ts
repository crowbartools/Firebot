import type { Request, Response } from "express";
import type { Trigger } from "../../../../types/triggers";
import { CommandManager } from "../../../../backend/chat/commands/command-manager";
import commandRunner from "../../../../backend/chat/commands/command-runner";

function getCommandTriggerAndArgs(req: Request): {
    trigger: Trigger;
    args: string;
} {
    const body = (req.body ?? {}) as {
        args?: string;
        username?: string;
        metadata?: Record<string, unknown> & { username: string };
    };
    const query = req.query ?? {};
    let args: string,
        username: string,
        metadata: Record<string, unknown> & { username: string };

    // GET
    if (req.method === "GET") {
        args = query.args as string;
        username = query.username as string;

    // POST
    } else if (req.method === "POST") {
        args = body.args;
        username = body.username;
        metadata = body.metadata;
    }

    username = username ?? "API User";

    const trigger: Trigger = {
        type: "api",
        metadata: metadata ?? { username: username }
    };

    trigger.metadata.username = trigger.metadata.username ?? username;

    return { trigger, args };
}

export function getSystemCommands(req: Request, res: Response): void {
    const sysCommands = CommandManager.getAllSystemCommandDefinitions();

    if (sysCommands == null) {
        res.status(500).send({
            status: "error",
            message: "Unknown error getting system commands"
        });
    }

    const formattedSysCommands = sysCommands.map((command) => {
        return {
            id: command.id,
            trigger: command.trigger,
            name: command.name
        };
    });

    res.json(formattedSysCommands);
};

export function getSystemCommand(req: Request, res: Response): void {
    const sysCommandId = req.params.sysCommandId;

    if (!(sysCommandId?.length > 0)) {
        res.status(400).send({
            status: "error",
            message: "No sysCommandId provided"
        });
    }

    const sysCommand = CommandManager.getSystemCommandById(sysCommandId);

    if (sysCommand == null) {
        res.status(404).send({
            status: "error",
            message: `System command '${sysCommandId}' not found`
        });
    }

    res.json(sysCommand.definition);
};

export function runSystemCommand(req: Request, res: Response): void {
    const sysCommandId = req.params.sysCommandId;

    if (!(sysCommandId?.length > 0)) {
        res.status(400).send({
            status: "error",
            message: "No sysCommandId provided"
        });
    }

    const sysCommand = CommandManager.getSystemCommandById(sysCommandId);

    if (sysCommand == null) {
        res.status(404).send({
            status: "error",
            message: `System command '${sysCommandId}' not found`
        });
    }

    const { trigger, args } = getCommandTriggerAndArgs(req);

    try {
        commandRunner.runSystemCommandFromEffect(sysCommandId, trigger, args);
    } catch (e) {
        res.status(500).send({
            status: "error",
            message: `Error executing system command '${sysCommandId}': ${e}`
        });
    }

    res.status(200).send({
        status: "success",
        message: `System command '${sysCommandId}' executed successfully`
    });
};

export function getCustomCommands(req: Request, res: Response): void {
    const customCommands = CommandManager.getAllCustomCommands();

    if (customCommands == null) {
        res.status(500).send({
            status: "error",
            message: "Unknown error getting custom commands"
        });
    }

    const formattedCustomCommands = customCommands.map((command) => {
        return {
            id: command.id,
            trigger: command.trigger,
            description: command.description
        };
    });

    res.json(formattedCustomCommands);
};

export function getCustomCommand(req: Request, res: Response): void {
    const customCommandId = req.params.customCommandId;

    if (!(customCommandId?.length > 0)) {
        res.status(400).send({
            status: "error",
            message: "No customCommandId provided"
        });
    }

    const customCommand = CommandManager.getCustomCommandById(customCommandId);

    if (customCommand == null) {
        res.status(404).send({
            status: "error",
            message: `Custom command '${customCommandId}' not found`
        });
    }

    res.json(customCommand);
};

export function runCustomCommand(req: Request, res: Response): void {
    const customCommandId = req.params.customCommandId;

    if (!(customCommandId?.length > 0)) {
        res.status(400).send({
            status: "error",
            message: "No customCommandId provided"
        });
    }

    const customCommand = CommandManager.getCustomCommandById(customCommandId);

    if (customCommand == null) {
        res.status(404).send({
            status: "error",
            message: `Custom command '${customCommandId}' not found`
        });
    }

    const { trigger, args } = getCommandTriggerAndArgs(req);

    try {
        commandRunner.runCustomCommandFromEffect(customCommandId, trigger, args);
    } catch (e) {
        res.status(500).send({
            status: "error",
            message: `Error executing custom command '${customCommandId}': ${e}`
        });
    }

    res.status(200).send({
        status: "success",
        message: `Custom command '${customCommandId}' executed successfully`
    });
};
import { Trigger } from "../../../../types/triggers";
import commandManager from "../../../../backend/chat/commands/command-manager";
import commandRunner from "../../../../backend/chat/commands/command-runner";
import { Request, Response } from "express";

function getCommandTriggerAndArgs(req: Request) {
    const body = req.body || {};
    const query = req.query || {};
    let args: string[],
        username: string,
        metadata: Trigger["metadata"];

    // GET
    if (req.method === "GET") {
        args = query.args as string[];
        username = query.username as string;

    // POST
    } else if (req.method === "POST") {
        args = body.args as string[];
        username = body.username as string;
        metadata = body.metadata;
    }

    username = username ?? "API User";

    const trigger:Trigger = {
        type: "api",
        metadata: metadata || { username }
    };

    trigger.metadata.username = trigger.metadata.username ?? username;

    return { trigger, args };
}

export async function getSystemCommands(req: Request, res: Response): Promise<Response> {
    const sysCommands = commandManager.getAllSystemCommandDefinitions();

    if (sysCommands == null) {
        return res.status(500).send({
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

    return res.json(formattedSysCommands);
}

export async function getSystemCommand(req: Request, res: Response): Promise<Response> {
    const sysCommandId = req.params.sysCommandId;

    if (!(sysCommandId?.length > 0)) {
        return res.status(400).send({
            status: "error",
            message: "No sysCommandId provided"
        });
    }

    const sysCommand = commandManager.getSystemCommandById(sysCommandId);

    if (sysCommand == null) {
        return res.status(404).send({
            status: "error",
            message: `System command '${sysCommandId}' not found`
        });
    }

    return res.json(sysCommand.definition);
}

export async function runSystemCommand(req: Request, res: Response): Promise<Response> {
    const sysCommandId = req.params.sysCommandId;

    if (!(sysCommandId?.length > 0)) {
        return res.status(400).send({
            status: "error",
            message: "No sysCommandId provided"
        });
    }

    const sysCommand = commandManager.getSystemCommandById(sysCommandId);

    if (sysCommand == null) {
        return res.status(404).send({
            status: "error",
            message: `System command '${sysCommandId}' not found`
        });
    }

    const { trigger, args } = getCommandTriggerAndArgs(req);

    try {
        commandRunner.runSystemCommandFromEffect(sysCommandId, trigger, args);
    } catch (e) {
        return res.status(500).send({
            status: "error",
            message: `Error executing system command '${sysCommandId}': ${e}`
        });
    }

    return res.status(200).send({
        status: "success",
        message: `System command '${sysCommandId}' executed successfully`
    });
}

export async function getCustomCommands(req: Request, res: Response): Promise<Response> {
    const customCommands = commandManager.getAllCustomCommands();

    if (customCommands == null) {
        return res.status(500).send({
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

    return res.json(formattedCustomCommands);
}

export async function getCustomCommand(req: Request, res: Response): Promise<Response> {
    const customCommandId = req.params.customCommandId;

    if (!(customCommandId?.length > 0)) {
        return res.status(400).send({
            status: "error",
            message: "No customCommandId provided"
        });
    }

    const customCommand = commandManager.getCustomCommandById(customCommandId);

    if (customCommand == null) {
        return res.status(404).send({
            status: "error",
            message: `Custom command '${customCommandId}' not found`
        });
    }

    return res.json(customCommand);
}

export async function runCustomCommand(req: Request, res: Response): Promise<Response> {
    const customCommandId = req.params.customCommandId;

    if (!(customCommandId?.length > 0)) {
        return res.status(400).send({
            status: "error",
            message: "No customCommandId provided"
        });
    }

    const customCommand = commandManager.getCustomCommandById(customCommandId);

    if (customCommand == null) {
        return res.status(404).send({
            status: "error",
            message: `Custom command '${customCommandId}' not found`
        });
    }

    const { trigger, args } = getCommandTriggerAndArgs(req);

    try {
        commandRunner.runCustomCommandFromEffect(customCommandId, trigger, args);
    } catch (e) {
        return res.status(500).send({
            status: "error",
            message: `Error executing custom command '${customCommandId}': ${e}`
        });
    }

    return res.status(200).send({
        status: "success",
        message: `Custom command '${customCommandId}' executed successfully`
    });
}
const manager = require("../../../../backend//variables/replace-variable-manager");
import { Request, Response } from "express";

export async function getReplaceVariables(req: Request, res: Response): Promise<Response> {
    const sortedVariables = [...manager.getReplaceVariables()]
        .sort((a, b) => a.definition.handle.localeCompare(b.definition.handle));

    return res.json(sortedVariables);
}
import { Request, Response } from "express";
import manager from "../../../../backend//variables/replace-variable-manager";

export function getReplaceVariables(req: Request, res: Response): void {
    const sortedVariables = [...manager.getReplaceVariables()]
        .sort((a, b) => a.definition.handle.localeCompare(b.definition.handle));

    res.json(sortedVariables);
};
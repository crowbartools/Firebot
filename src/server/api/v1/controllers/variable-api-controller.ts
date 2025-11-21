import { Request, Response } from "express";
import { ReplaceVariableManager } from "../../../../backend/variables/replace-variable-manager";

export function getReplaceVariables(req: Request, res: Response): void {
    const sortedVariables = [...ReplaceVariableManager.getReplaceVariables()]
        .sort((a, b) => a.definition.handle.localeCompare(b.definition.handle));

    res.json(sortedVariables);
};
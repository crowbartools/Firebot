import { Request, Response } from "express";
import { CustomVariableManager } from "../../../../backend/common/custom-variable-manager";

export function getCustomVariables(req: Request, res: Response): void {
    res.json(CustomVariableManager.getAllVariables());
};

export function getCustomVariable(req: Request, res: Response): void {
    const variableName = req.params.variableName;
    res.json(CustomVariableManager.getCustomVariable(variableName));
};

export function setCustomVariable(
    req: Request<{
        variableName: string;
    }, undefined, {
        data: unknown;
        ttl: number;
    }>,
    res: Response
): void {
    const name = req.params.variableName;
    const data = req.body?.data;
    const ttl = req.body?.ttl ?? 0;
    CustomVariableManager.addCustomVariable(name, data, ttl);
    res.status(201).send();
};
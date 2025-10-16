import { Request, Response } from "express";
import customVariableManager from "../../../../backend/common/custom-variable-manager";

export function getCustomVariables(req: Request, res: Response): void {
    res.json(customVariableManager.getAllVariables());
};

export function getCustomVariable(req: Request, res: Response): void {
    const variableName = req.params.variableName;
    res.json(customVariableManager.getCustomVariable(variableName));
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
    customVariableManager.addCustomVariable(name, data, ttl);
    res.status(201).send();
};
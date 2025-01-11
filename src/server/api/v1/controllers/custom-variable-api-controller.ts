import customVariableManager from "../../../../backend/common/custom-variable-manager";
import { Request, Response } from "express";

export function getCustomVariables(req: Request, res: Response) {
    res.json(customVariableManager.getAllVariables());
}

export function getCustomVariable(req: Request, res: Response) {
    const variableName = req.params.variableName;
    res.json(customVariableManager.getCustomVariable(variableName));
}

export function setCustomVariable(req: Request, res: Response) {
    const name = req.params.variableName;
    const data = req.body && req.body.data;
    const ttl = req.body && req.body.ttl || 0;
    customVariableManager.addCustomVariable(name, data, ttl);
    res.status(201).send();
}
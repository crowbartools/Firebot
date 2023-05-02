import counterManager from "../../../../backend/counters/counter-manager";
import { Request, Response } from "express";

export async function getCounters(req: Request, res: Response): Promise<Response> {
    const counters = counterManager.getAllItems()
        .map((c: any) => {
            return {
                id: c.id,
                name: c.name,
                value: c.value
            };
        });
    
    return res.json(counters);
};

export async function getCounterById(req: Request, res: Response): Promise<Response> {
    const counterId: string = req.params.counterId;

    if (!(counterId.length > 0)) {
        return res.status(400).send({
            status: "error",
            message: "No counterId provided"
        });
    }

    const counter = counterManager.getItem(counterId);

    if (counter == null) {
        return res.status(404).send({
            status: "error",
            message: `Counter '${counterId}' not found`
        });
    }

    return res.json(counter);
};

export async function patchCounter(req: Request, res: Response): Promise<Response> {
    const counterId: string = req.params.counterId;
    const change: number = req.body.value;
    const override: boolean = req.body.override ?? false;

    if (!(counterId.length > 0)) {
        return res.status(400).send({
            status: "error",
            message: "No counterId provided"
        });
    }

    if (change == null) {
        return res.status(400).send({
            status: "error",
            message: "value not present."
        });
    }

    if (typeof change !== "number") {
        return res.status(400).send({
            status: "error",
            message: "value must be a number."
        });
    }

    if (typeof override !== "boolean") {
        return res.status(400).send({
            status: "error",
            message: "override must be a boolean."
        });
    }

    const counter = counterManager.getItem(counterId);

    if (counter == null) {
        return res.status(404).send({
            status: "error",
            message: `Counter '${counterId}' not found`
        });
    }

    // @ts-ignore
    await counterManager.updateCounterValue(counter.id, change, override);
    return res.status(204).send();
};
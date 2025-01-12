import { CounterManager } from "../../../../backend/counters/counter-manager";
import { Request, Response } from "express";

export async function getCounters(req: Request, res: Response): Promise<Response> {
    const counters = CounterManager.getAllItems()
        .map((c) => {
            return {
                id: c.id,
                name: c.name,
                value: c.value
            };
        });

    return res.json(counters);
}

export async function getCounterById(req: Request, res: Response): Promise<Response> {
    const counterId: string = req.params.counterId;

    if (!(counterId.length > 0)) {
        return res.status(400).send({
            status: "error",
            message: "No counterId provided"
        });
    }

    const counter = CounterManager.getItem(counterId);

    if (counter == null) {
        return res.status(404).send({
            status: "error",
            message: `Counter '${counterId}' not found`
        });
    }

    return res.json(counter);
}

export async function updateCounter(req: Request, res: Response): Promise<Response> {
    const counterId: string = req.params.counterId;
    const value: number = req.body.value;
    const override: boolean = req.body.override ?? false;

    if (!(counterId.length > 0)) {
        return res.status(400).send({
            status: "error",
            message: "No counterId provided"
        });
    }

    if (value == null) {
        return res.status(400).send({
            status: "error",
            message: "value not present."
        });
    }

    if (typeof value !== "number") {
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

    const counter = CounterManager.getItem(counterId);

    if (counter == null) {
        return res.status(404).send({
            status: "error",
            message: `Counter '${counterId}' not found`
        });
    }

    const response = {
        oldValue: counter.value,
        newValue: 0
    };

    await CounterManager.updateCounterValue(counter.id, value, override);
    response.newValue = CounterManager.getItem(counterId).value;
    return res.json(response);
}
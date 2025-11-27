import { Request, Response } from "express";
import { CounterManager } from "../../../../backend/counters/counter-manager";

export function getCounters(req: Request, res: Response): void {
    const counters = CounterManager.getAllItems()
        .map((c) => {
            return {
                id: c.id,
                name: c.name,
                value: c.value
            };
        });

    res.json(counters);
}

export function getCounterById(req: Request, res: Response): void {
    const counterId: string = req.params.counterId;

    if (!(counterId.length > 0)) {
        res.status(400).send({
            status: "error",
            message: "No counterId provided"
        });
    }

    const counter = CounterManager.getItem(counterId);

    if (counter == null) {
        res.status(404).send({
            status: "error",
            message: `Counter '${counterId}' not found`
        });
    }

    res.json(counter);
}

export async function updateCounter(
    req: Request<{
        counterId: string;
    }, unknown, {
        value: number;
        override?: boolean;
    }>,
    res: Response
): Promise<void> {
    const counterId = req.params.counterId;
    const value = req.body.value;
    const override = req.body.override ?? false;

    if (!(counterId.length > 0)) {
        res.status(400).send({
            status: "error",
            message: "No counterId provided"
        });
    }

    if (value == null) {
        res.status(400).send({
            status: "error",
            message: "value not present."
        });
    }

    if (typeof value !== "number") {
        res.status(400).send({
            status: "error",
            message: "value must be a number."
        });
    }

    if (typeof override !== "boolean") {
        res.status(400).send({
            status: "error",
            message: "override must be a boolean."
        });
    }

    const counter = CounterManager.getItem(counterId);

    if (counter == null) {
        res.status(404).send({
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
    res.json(response);
}
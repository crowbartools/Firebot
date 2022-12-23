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
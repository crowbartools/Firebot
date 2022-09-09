import { Request, Response } from "express";
const counterManager = require("../../../../backend/counters/counter-manager");

exports.getCounters = async function(req: Request, res: Response) {
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

exports.getCounterById = async function(req: Request, res: Response) {
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
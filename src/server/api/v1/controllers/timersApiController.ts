import { Request, Response } from "express";
const timersManager = require("../../../../backend/timers/timer-manager");

exports.getTimers = async function(req: Request, res: Response) {
    const timers = timersManager.getAllItems()
        .map((c: any) => {
            return {
                id: c.id,
                name: c.name,
                active: c.active
            };
        });
    
    return res.json(timers);
};

exports.getTimerById = async function(req: Request, res: Response) {
    const timerId: string = req.params.timerId;

    if (!(timerId.length > 0)) {
        return res.status(400).send({
            status: "error",
            message: "No timerId provided"
        });
    }

    const timer = timersManager.getItem(timerId);

    if (timer == null) {
        return res.status(404).send({
            status: "error",
            message: `Timer '${timerId}' not found`
        });
    }

    return res.json(timer);
};
import timersManager from "../../../../backend/timers/timer-manager";
import { Request, Response } from "express";

export async function getTimers(req: Request, res: Response): Promise<Response> {
    const timers = timersManager.getAllItems()
        .map((c) => {
            return {
                id: c.id,
                name: c.name,
                active: c.active
            };
        });

    return res.json(timers);
}

export async function getTimerById(req: Request, res: Response): Promise<Response> {
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
}
import timersManager from "../../../../backend/timers/timer-manager";
import { Request, Response } from "express";
import { Timer } from "../../../../types/timers";

function findTimer(req: Request, res: Response): Timer | undefined {
    const timerId: string = req.params.timerId;

    if (!(timerId.length > 0)) {
        res.status(400).send({
            status: "error",
            message: "No timerId provided"
        });
        return undefined;
    }

    const timer = timersManager.getItem(timerId);

    if (timer == null) {
        res.status(404).send({
            status: "error",
            message: `Timer '${timerId}' not found`
        });
        return undefined;
    }

    return timer;
}

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
    const timer = findTimer(req, res);
    if (!timer) {
        return;
    }

    return res.json(timer);
}

export async function updateTimerById(req: Request, res: Response): Promise<Response> {
    const timer = findTimer(req, res);
    if (!timer) {
        return;
    }

    const action: string = req.params.action;

    if (
        action !== "enable" &&
        action !== "disable" &&
        action !== "toggle" &&
        action !== "clear"
    ) {
        return res.status(400).send({
            status: "error",
            message: "invalid action provided"
        });
    }

    if (action === "clear") {
        timersManager.updateIntervalForTimer(timer);
        return res.status(201).send();
    }

    const isActive = action === "toggle" ? !timer.active : action === "enable";
    timersManager.updateTimerActiveStatus(timer.id, isActive);
    return res.status(201).send();
}

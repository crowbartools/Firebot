import { Request, Response } from "express";
import { Timer } from "../../../../types/timers";
import { TimerManager } from "../../../../backend/timers/timer-manager";

function findTimer(req: Request, res: Response): Timer {
    const timerId: string = req.params.timerId;

    if (!(timerId.length > 0)) {
        res.status(400).send({
            status: "error",
            message: "No timerId provided"
        });
        return undefined;
    }

    const timer = TimerManager.getItem(timerId);

    if (timer == null) {
        res.status(404).send({
            status: "error",
            message: `Timer '${timerId}' not found`
        });
        return undefined;
    }

    return timer;
}

export function getTimers(req: Request, res: Response): void {
    const timers = TimerManager.getAllItems()
        .map((c) => {
            return {
                id: c.id,
                name: c.name,
                active: c.active
            };
        });

    res.json(timers);
}

export function getTimerById(req: Request, res: Response): void {
    const timer = findTimer(req, res);
    if (!timer) {
        return;
    }

    res.json(timer);
}

export function updateTimerById(req: Request, res: Response): void {
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
        res.status(400).send({
            status: "error",
            message: "invalid action provided"
        });
    }

    if (action === "clear") {
        TimerManager.updateIntervalForTimer(timer);
        res.status(200).send();
    }

    const isActive = action === "toggle" ? !timer.active : action === "enable";
    TimerManager.updateTimerActiveStatus(timer.id, isActive);
    res.status(200).send();
}
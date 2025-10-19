import { Request, Response } from "express";
import { EffectQueueConfigManager } from "../../../../backend/effects/queues/effect-queue-config-manager";
import effectQueueRunner from "../../../../backend/effects/queues/effect-queue-runner";

function checkQueue(req: Request, res: Response): boolean {
    const queueId: string = req.params.queueId;
    if (!(queueId.length > 0)) {
        res.status(400).send({
            status: "error",
            message: "No queueId provided"
        });
        return false;
    }
    const queue = EffectQueueConfigManager.getItem(queueId);
    if (queue == null) {
        res.status(404).send({
            status: "error",
            message: `Queue '${queueId}' not found.`
        });
        return false;
    }
    return true;
}

export function getQueues(req: Request, res: Response): void {
    res.json(EffectQueueConfigManager.getAllItems());
}

export function getQueueById(req: Request, res: Response): void {
    if (!checkQueue(req, res)) {
        return;
    }

    res.json(EffectQueueConfigManager.getItem(req.params.queueId));
}

export function pauseQueue(req: Request, res: Response): void {
    if (!checkQueue(req, res)) {
        return;
    }

    const queueId = req.params.queueId;

    EffectQueueConfigManager.pauseQueue(queueId);

    res.json(EffectQueueConfigManager.getItem(queueId));
}

export function resumeQueue(req: Request, res: Response): void {
    if (!checkQueue(req, res)) {
        return;
    }

    const queueId = req.params.queueId;

    EffectQueueConfigManager.resumeQueue(queueId);

    res.json(EffectQueueConfigManager.getItem(queueId));
}

export function toggleQueue(req: Request, res: Response): void {
    if (!checkQueue(req, res)) {
        return;
    }

    const queueId = req.params.queueId;

    EffectQueueConfigManager.toggleQueue(queueId);

    res.json(EffectQueueConfigManager.getItem(queueId));
}

export function clearQueue(req: Request, res: Response): void {
    if (!checkQueue(req, res)) {
        return;
    }

    const queueId = req.params.queueId;

    effectQueueRunner.removeQueue(queueId);

    res.json(EffectQueueConfigManager.getItem(queueId));
}
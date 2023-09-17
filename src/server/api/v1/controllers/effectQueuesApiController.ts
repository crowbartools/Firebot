import effectQueueManager from "../../../../backend/effects/queues/effect-queue-manager";
import effectQueueRunner from "../../../../backend/effects/queues/effect-queue-runner";
import { Request, Response } from "express";

function checkQueue(req: Request, res: Response): boolean {
    const queueId: string = req.params.queueId;
    if (!(queueId.length > 0)) {
        res.status(400).send({
            status: "error",
            message: "No queueId provided"
        });
        return false;
    }
    const queue = effectQueueManager.getItem(queueId);
    if (queue == null) {
        res.status(404).send({
            status: "error",
            message: `Queue '${queueId}' not found.`
        });
        return false;
    }
    return true;
}

export async function getQueues(req: Request, res: Response): Promise<Response> {
    return res.json(effectQueueManager.getAllItems());
}

export async function getQueueById(req: Request, res: Response): Promise<Response> {
    if (!checkQueue(req, res)) {
        return res;
    }

    return res.json(effectQueueManager.getItem(req.params.queueId));
}

export async function pauseQueue(req: Request, res: Response): Promise<Response> {
    if (!checkQueue(req, res)) {
        return res;
    }

    const queueId = req.params.queueId;

    effectQueueManager.pauseQueue(queueId);

    return res.json(effectQueueManager.getItem(queueId));
}

export async function resumeQueue(req: Request, res: Response): Promise<Response> {
    if (!checkQueue(req, res)) {
        return res;
    }

    const queueId = req.params.queueId;

    effectQueueManager.resumeQueue(queueId);

    return res.json(effectQueueManager.getItem(queueId));
}

export async function toggleQueue(req: Request, res: Response): Promise<Response> {
    if (!checkQueue(req, res)) {
        return res;
    }

    const queueId = req.params.queueId;

    effectQueueManager.toggleQueue(queueId);

    return res.json(effectQueueManager.getItem(queueId));
}

export async function clearQueue(req: Request, res: Response): Promise<Response> {
    if (!checkQueue(req, res)) {
        return res;
    }

    const queueId = req.params.queueId;

    effectQueueRunner.removeQueue(queueId);

    return res.json(effectQueueManager.getItem(queueId));
}

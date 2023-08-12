import effectQueueManager from "../../../../backend/effects/queues/effect-queue-manager";
import { Request, Response } from "express";

export async function getQueues(req: Request, res: Response): Promise<Response> {
    return res.json(effectQueueManager.getAllItems());
}

import chat from "../../../../backend/chat/twitch-chat";
import { Request, Response } from "express";

export function getStatus(req: Request, res: Response) {
    const status = {
        connections: {
            chat: chat.chatIsConnected
        }
    };
    res.json(status);
}

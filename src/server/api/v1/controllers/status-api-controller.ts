import { Request, Response } from "express";
import chat from "../../../../backend/chat/twitch-chat";

export function getStatus(req: Request, res: Response): void {
    const status = {
        connections: {
            chat: chat.chatIsConnected
        }
    };
    res.json(status);
};
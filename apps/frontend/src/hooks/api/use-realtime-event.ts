"use client";

import { useEffect } from "react";
import { useRealTimeWs } from "./use-realtime-ws";

export const useRealTimeEvent = <Data = unknown>(
  eventName: string,
  callback: (data: Data) => void
) => {
  const ws = useRealTimeWs();

  useEffect(() => {
    const listener = (event: MessageEvent) => {
      const message = JSON.parse(event.data);
      if (message.event === eventName) {
        callback(message.data);
      }
    };
    ws.addEventListener("message", listener);
    return () => {
      ws.removeEventListener("message", listener);
    };
  }, [ws, eventName, callback]);
};

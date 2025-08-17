"use client";

import { createContext, useRef } from "react";
import ReconnectingWebSocket from "reconnecting-websocket";

const realTimeWs =
  typeof window === "undefined"
    ? undefined
    : new ReconnectingWebSocket("ws://localhost:3001/api/v1/realtime", [], {
        WebSocket: WebSocket,
      });

type RealTimeWsContextProps = {
  ws: ReconnectingWebSocket;
};

export const RealTimeWsContext = createContext<RealTimeWsContextProps>({
  ws: realTimeWs!,
});

export const RealTimeWsProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const wsRef = useRef(realTimeWs);

  return (
    <RealTimeWsContext.Provider
      value={{
        ws: wsRef.current!,
      }}
    >
      {children}
    </RealTimeWsContext.Provider>
  );
};

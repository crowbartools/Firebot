import { RealTimeWsContext } from "@/realtime/realtime-websocket";
import { useContext } from "react";

export const useRealTimeWs = () => {
  const wsContext = useContext(RealTimeWsContext);
  if (wsContext == null) {
    throw new Error(
      "FbApiContext was null, ensure you're within a <FbApiProvider />"
    );
  }
  return wsContext.ws;
};

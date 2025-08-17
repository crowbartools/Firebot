"use client";

import { useConnectables } from "@/hooks/api/use-connectables";
import { useRealTimeEvent } from "@/hooks/api/use-realtime-event";
import { useToggleAllConnections } from "@/hooks/api/use-toggle-all-connections";
import { ArrowPathIcon, PowerIcon } from "@heroicons/react/16/solid";
import clsx from "clsx";
import { ConnectionType } from "firebot-types";
import { useState } from "react";
import { Button } from "../ui/button";

export const ConnectionButton = () => {
  const { mutate: toggleConnection, isPending: isConnecting } =
    useToggleAllConnections();
  const { data: allConnectables } = useConnectables();

  const [connectedConnectables, setConnectedConnectables] = useState<
    Record<ConnectionType, Record<string, boolean>>
  >({
    "streaming-platform": {},
    integration: {},
    overlay: {},
  });

  useRealTimeEvent<{ type: ConnectionType; id: string; connected: boolean }>(
    "connection:update",
    (data) => {
      setConnectedConnectables((prev) => ({
        ...prev,
        [data.type]: {
          ...prev[data.type],
          [data.id]: data.connected,
        },
      }));
    }
  );

  const totalCount = Object.entries(allConnectables ?? {}).reduce(
    (acc, [, connectables]) => acc + connectables.length,
    0
  );

  const connectedCount = Object.entries(connectedConnectables).reduce(
    (acc, [, connectables]) => {
      return (
        acc +
        Object.values(connectables).reduce(
          (acc, connected) => acc + (connected ? 1 : 0),
          0
        )
      );
    },
    0
  );

  const allConnected = connectedCount > 0 && totalCount === connectedCount;
  const someConnected = connectedCount > 0;

  return (
    <Button
      variant="outline"
      className="flex justify-start items-center pl-2"
      size="lg"
      onClick={() => toggleConnection(someConnected ? false : true)}
    >
      <div className="flex items-center justify-center rounded-full text-sm h-6 w-6">
        {isConnecting ? (
          <ArrowPathIcon className="h-3 w-3 text-gray-200 animate-spin" />
        ) : (
          <PowerIcon
            className={clsx("h-3 w-3", {
              "text-green-400": allConnected,
              "text-amber-400": someConnected,
              "text-red-500": !someConnected && !allConnected,
            })}
          />
        )}
      </div>
      <span>
        {isConnecting
          ? someConnected
            ? "Disconnecting"
            : "Connecting"
          : someConnected
            ? "Connected"
            : "Disconnected"}
      </span>
    </Button>
  );
};

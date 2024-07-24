import { useToggleAllConnections } from "@/hooks/api/use-toggle-all-connections";
import { useConnectables } from "@/hooks/api/use-connectables";
import { useRealTimeEvent } from "@/hooks/api/use-realtime-event";
import { ArrowPathIcon, PowerIcon } from "@heroicons/react/16/solid";
import clsx from "clsx";
import { ConnectionType } from "firebot-types";
import { useState } from "react";

export const AppFooter: React.FC = () => {
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

  const allConnected = totalCount === connectedCount;
  const someConnected = connectedCount > 0;

  return (
    <div className="h-10 bg-secondary-bg z-50 flex items-center px-2">
      <button
        className="flex items-center justify-center bg-tertiary-bg rounded-lg text-sm px-2 py-px hover:bg-tertiary-bg"
        onClick={() => toggleConnection(someConnected ? false : true)}
        disabled={isConnecting}
      >
        {isConnecting ? (
          <ArrowPathIcon className="h-3 w-3 mr-1 text-gray-200 animate-spin" />
        ) : (
          <PowerIcon
            className={clsx("h-3 w-3 mr-1", {
              "text-green-400": allConnected,
              "text-amber-400": someConnected,
              "text-red-500": !allConnected,
            })}
          />
        )}
        {isConnecting
          ? someConnected
            ? "Disconnecting"
            : "Connecting"
          : someConnected
            ? "Disconnect"
            : "Connect"}
      </button>
    </div>
  );
};

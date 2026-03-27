import { useTriggers } from "@/hooks/api/use-triggers";

function TriggerRow({
  name,
  sourceId,
  eventId,
  active,
}: {
  name?: string;
  sourceId: string;
  eventId: string;
  active: boolean;
}) {
  return (
    <div className="p-2 border rounded mb-2">
      <div className="font-medium">{name || "Unnamed Trigger"}</div>
      <div className="text-sm opacity-80">
        {sourceId} / {eventId}
      </div>
      <div className="text-xs mt-1">{active ? "Active" : "Inactive"}</div>
    </div>
  );
}

export function TriggersPage() {
  const { data, isLoading } = useTriggers();

  if (isLoading) {
    return <div className="p-4">Loading triggers...</div>;
  }

  const mainTriggers = data?.mainTriggers ?? [];
  const groups = data?.groups ?? [];

  return (
    <div className="p-4 space-y-6">
      <div>
        <div className="text-lg font-semibold mb-3">Main Triggers</div>
        {mainTriggers.length === 0 ? (
          <div className="text-sm opacity-70">
            No main triggers configured yet.
          </div>
        ) : (
          mainTriggers.map((trigger) => (
            <TriggerRow
              key={trigger.id}
              name={trigger.name}
              sourceId={trigger.sourceId}
              eventId={trigger.eventId}
              active={trigger.active}
            />
          ))
        )}
      </div>

      <div>
        <div className="text-lg font-semibold mb-3">Trigger Sets</div>
        {groups.length === 0 ? (
          <div className="text-sm opacity-70">No trigger sets configured yet.</div>
        ) : (
          groups.map((group) => (
            <div key={group.id} className="border rounded p-3 mb-3">
              <div className="font-medium">
                {group.name} {group.active ? "(Active)" : "(Inactive)"}
              </div>
              <div className="mt-2">
                {group.triggers.length === 0 ? (
                  <div className="text-sm opacity-70">
                    No triggers in this set.
                  </div>
                ) : (
                  group.triggers.map((trigger) => (
                    <TriggerRow
                      key={trigger.id}
                      name={trigger.name}
                      sourceId={trigger.sourceId}
                      eventId={trigger.eventId}
                      active={trigger.active}
                    />
                  ))
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default TriggersPage;
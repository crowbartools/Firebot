import { useEvents } from "@/hooks/api/use-events";

function EventRow({
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
      <div className="font-medium">{name || "Unnamed Event"}</div>
      <div className="text-sm opacity-80">
        {sourceId} / {eventId}
      </div>
      <div className="text-xs mt-1">{active ? "Active" : "Inactive"}</div>
    </div>
  );
}

export function EventsPage() {
  const { data, isLoading } = useEvents();

  if (isLoading) {
    return <div className="p-4">Loading events...</div>;
  }

  const mainEvents = data?.mainEvents ?? [];
  const groups = data?.groups ?? [];

  return (
    <div className="p-4 space-y-6">
      <div>
        <div className="text-lg font-semibold mb-3">Main Events</div>
        {mainEvents.length === 0 ? (
          <div className="text-sm opacity-70">No main events configured yet.</div>
        ) : (
          mainEvents.map((event) => (
            <EventRow
              key={event.id}
              name={event.name}
              sourceId={event.sourceId}
              eventId={event.eventId}
              active={event.active}
            />
          ))
        )}
      </div>

      <div>
        <div className="text-lg font-semibold mb-3">Event Sets</div>
        {groups.length === 0 ? (
          <div className="text-sm opacity-70">No event sets configured yet.</div>
        ) : (
          groups.map((group) => (
            <div key={group.id} className="border rounded p-3 mb-3">
              <div className="font-medium">
                {group.name} {group.active ? "(Active)" : "(Inactive)"}
              </div>
              <div className="mt-2">
                {group.events.length === 0 ? (
                  <div className="text-sm opacity-70">No events in this set.</div>
                ) : (
                  group.events.map((event) => (
                    <EventRow
                      key={event.id}
                      name={event.name}
                      sourceId={event.sourceId}
                      eventId={event.eventId}
                      active={event.active}
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

export default EventsPage;

import { useSetTrailingBreadcrumb } from "@/hooks/use-set-trailing-breadcrumb";
import { v4 as uuid } from "uuid";
import AddOrEditCommand from "@/components/commands/AddOrEditCommand";

export function NewCommandPage() {
  useSetTrailingBreadcrumb("New Command");

  return (
    <AddOrEditCommand
      isNew
      config={{
        type: "command",
        actionWorkflow: {
          id: uuid(),
          nodes: [
            {
              id: uuid(),
              type: "trigger",
              position: { x: 0, y: 0 },
              schema: {
                outcomes: [{ slug: "triggered" }],
              },
            },
          ],
          edges: [],
        },
      }}
    />
  );
}

export default NewCommandPage;

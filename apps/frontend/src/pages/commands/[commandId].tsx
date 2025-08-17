import AddOrEditCommand from "@/components/commands/AddOrEditCommand";
import { useCommand } from "@/hooks/api/commands/useCommand";
import { useSetTrailingBreadcrumb } from "@/hooks/use-set-trailing-breadcrumb";
import { useRouter } from "next/router";

export default function EditCommand() {
  useSetTrailingBreadcrumb("Edit Command");

  const router = useRouter();

  const { commandId } = router.query;

  const { data: command } = useCommand(commandId as string);

  if (!command) {
    return <div>Loading...</div>;
  }

  return <AddOrEditCommand config={command} isNew={false} />;
}

import { SearchBar } from "@/components/controls/SearchBar";
import { Button } from "@/components/ui/button";
import { useCommands } from "@/hooks/api/commands/useCommands";
import { PlusIcon } from "@heroicons/react/16/solid";
import { CommandConfig } from "firebot-types";
import Link from "next/link";

export function CommandsPage() {
  const { data: commands } = useCommands();

  return (
    <div>
      <div className="flex items-center justify-end gap-3 px-3 h-13 border-b">
        <SearchBar className="h-8" />
        <Button asChild variant="default" size="sm">
          <Link href="/commands/new-command">
            <PlusIcon />
            Create Command
          </Link>
        </Button>
      </div>
      <div className="p-3">
        {commands?.map((command) => (
          <CommandRow key={command.id} command={command} />
        ))}
      </div>
    </div>
  );
}

function CommandRow({ command }: { command: CommandConfig }) {
  return (
    <Link
      href={`/commands/${command.id}`}
      className="p-2 border mb-3 rounded block"
    >
      {command.data?.trigger ?? "Trigger not set"}
    </Link>
  );
}

export default CommandsPage;

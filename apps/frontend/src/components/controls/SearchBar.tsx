import { Search } from "lucide-react";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";

export function SearchBar(inputProps: React.ComponentProps<typeof Input>) {
  return (
    <div className="relative">
      <Input
        placeholder="Search&hellip;"
        aria-label="Search"
        {...inputProps}
        className={cn("pl-8", inputProps.className)}
      />
      <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none" />
    </div>
  );
}

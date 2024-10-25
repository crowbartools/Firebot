import { MagnifyingGlassIcon } from "@heroicons/react/16/solid";
import { Input, InputGroup } from "../ui/input";

export const SearchBar: React.FC<React.ComponentProps<typeof Input>> = (inputProps) => {
  return (
    <InputGroup>
      <MagnifyingGlassIcon />
      <Input placeholder="Search&hellip;" aria-label="Search" {...inputProps} />
    </InputGroup>
  );
};

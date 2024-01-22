import { ProfileDropdown } from "@/components/header/ProfileDropdown";

export const AppHeader: React.FC = () => {
  return (
    <div className="h-16 flex flex-row px-4 pl-[85px] items-center justify-end">
      {/* Separator */}
      <div className="h-6 w-px bg-gray-100/25" aria-hidden="true" />
      <ProfileDropdown />
    </div>
  );
};

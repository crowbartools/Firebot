import { useActiveUserProfile } from "@/hooks/api/use-active-user-profile";

export const AppHeader: React.FC = () => {
  const { data: activeProfile } = useActiveUserProfile();
  return (
    <div className="h-16 flex flex-row px-4 pl-[85px] items-center justify-end">
      {activeProfile?.name}
    </div>
  );
};

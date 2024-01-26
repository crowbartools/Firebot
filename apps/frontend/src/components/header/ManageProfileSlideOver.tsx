import { SlideOver } from "@/components/controls/SlideOver";
import { ManageLoginDropdown } from "@/components/header/ManageLoginDropdown";
import { useActiveProfile } from "@/hooks/api/use-active-profile";
import { useCreateLogin } from "@/hooks/api/use-create-login";
import { useLogins } from "@/hooks/api/use-logins";
import { useStreamingPlatforms } from "@/hooks/api/use-streaming-platforms";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PlusCircleIcon } from "@heroicons/react/20/solid";

export const ManageProfileSlideOver: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const { data: streamingPlatforms } = useStreamingPlatforms();
  const { data: activeProfile } = useActiveProfile();
  const { data: loginData } = useLogins();
  const { mutate: createLogin, isPending: isCreatingLogin } = useCreateLogin();

  return (
    <SlideOver title={activeProfile?.name} open={open} onClose={onClose}>
      <div>
        <h3 className="text-lg font-bold text-primary-text">Platforms</h3>
        <div>
          {streamingPlatforms.map((platform) => {
            const loginsForPlatform = loginData?.[platform.id];
            const activeLogin = loginsForPlatform?.loginConfigs?.find(
              (login) => login.id === loginsForPlatform?.activeLoginConfigId
            );
            return (
              <div className="" key={platform.id}>
                <div className="flex items-center justify-between p-4 rounded-lg bg-secondary-bg/50 rounded-b-none">
                  <div className="flex items-center">
                    {platform.icon && (
                      <FontAwesomeIcon
                        className="text-xl mr-2 text-white"
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        icon={["fab", platform.icon as any]}
                      />
                    )}
                    <span className="text-xl text-primary-text font-bold">
                      {platform.name}
                    </span>
                  </div>
                  {!!loginsForPlatform?.loginConfigs?.length && (
                    <ManageLoginDropdown platformId={platform.id} />
                  )}
                </div>
                <div className="p-4 rounded-b-lg bg-secondary-bg/75">
                  {activeLogin && (
                    <div key={activeLogin.id} className="grid grid-cols-2">
                      <div>
                        <div className="text-lg text-primary-text font-bold">
                          Streamer
                        </div>
                        <div>
                          <button className="text-primary-text bg-primary-bg/25 py-1 px-2 rounded-lg flex items-center">
                            <PlusCircleIcon className="w-4 h-4 mr-1" />
                            Connect account
                          </button>
                        </div>
                      </div>
                      <div>
                        <div className="text-lg text-primary-text font-bold">
                          Bot
                        </div>
                        <div>
                          <button className="text-primary-text bg-primary-bg/25 py-1 px-2 rounded-lg flex items-center">
                            <PlusCircleIcon className="w-4 h-4 mr-1" />
                            Connect account
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  {!loginsForPlatform?.loginConfigs?.length && (
                    <button
                      className="text-gray-50 flex items-center gap-2 rounded-lg"
                      onClick={() => {
                        createLogin({ platformId: platform.id });
                      }}
                      disabled={isCreatingLogin}
                    >
                      <PlusCircleIcon className="w-5 h-5" /> Create new login
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </SlideOver>
  );
};

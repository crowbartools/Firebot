import type { StreamingPlatformIdName } from "@/api/resources/streaming-platform";
import { SlideOver } from "@/components/controls/SlideOver";
import { ManageLoginDropdown } from "@/components/header/ManageLoginDropdown";
import { useActiveProfile } from "@/hooks/api/use-active-profile";
import { useCreateLogin } from "@/hooks/api/use-create-login";
import { useFbApi } from "@/hooks/api/use-fb-api";
import { useLogins } from "@/hooks/api/use-logins";
import { useStreamingPlatforms } from "@/hooks/api/use-streaming-platforms";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PlusCircleIcon } from "@heroicons/react/20/solid";
import type {
  Account,
  FirebotAccountType,
  PlatformLoginSetting,
} from "firebot-types";
import { AnimatePresence, motion } from "framer-motion";

export const ManageProfileSlideOver: React.FC<{
  open: boolean;
  onClose: () => void;
}> = ({ open, onClose }) => {
  const { data: streamingPlatforms } = useStreamingPlatforms();
  const { data: activeProfile } = useActiveProfile();
  const { data: loginData } = useLogins();

  return (
    <SlideOver title={activeProfile?.name} open={open} onClose={onClose}>
      <div>
        <h3 className="text-lg font-bold text-primary-text">Platforms</h3>
        <div>
          {streamingPlatforms.map((platform) => {
            const loginsForPlatform = loginData?.[platform.id];
            return (
              <StreamingPlatformConfig
                key={platform.id}
                platform={platform}
                loginSettings={loginsForPlatform}
              />
            );
          })}
        </div>
      </div>
    </SlideOver>
  );
};

const StreamingPlatformConfig: React.FC<{
  platform: StreamingPlatformIdName;
  loginSettings?: PlatformLoginSetting;
}> = ({ platform, loginSettings }) => {
  const { mutate: createLogin, isPending: isCreatingLogin } = useCreateLogin();

  const { api } = useFbApi();

  const connectAccount = async (
    streamingPlatform: StreamingPlatformIdName,
    loginConfigId: string,
    type: FirebotAccountType
  ) => {
    if (streamingPlatform.auth.type === "device") {
      const response = await api.authProvider.startDeviceFlow(
        streamingPlatform.id,
        loginConfigId,
        type
      );
      console.log(response);
    } else {
      // TODO not implemented
    }
  };

  const activeLogin = loginSettings?.loginConfigs?.find(
    (login) => login.id === loginSettings?.activeLoginConfigId
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
        {!!loginSettings?.loginConfigs?.length && (
          <ManageLoginDropdown platformId={platform.id} />
        )}
      </div>
      <div className="p-4 rounded-b-lg bg-secondary-bg/75">
        <AnimatePresence mode="popLayout" initial={false}>
          {activeLogin && (
            <motion.div
              key={activeLogin.id}
              className="grid grid-cols-2"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1.0, scale: 1.0 }}
            >
              <Account
                type="streamer"
                account={activeLogin.streamer}
                onConnectClick={() =>
                  connectAccount(platform, activeLogin.id, "streamer")
                }
                onDisconnectClick={() => {}}
              />
              <Account
                type="bot"
                account={activeLogin.bot}
                onConnectClick={() => {}}
                onDisconnectClick={() => {}}
              />
            </motion.div>
          )}
          {!loginSettings?.loginConfigs?.length && (
            <motion.button
              className="text-gray-50 flex items-center gap-2 rounded-lg"
              onClick={() => {
                createLogin({ platformId: platform.id });
              }}
              disabled={isCreatingLogin}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1.0, scale: 1.0 }}
            >
              <PlusCircleIcon className="w-5 h-5" /> Create new login
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const Account: React.FC<{
  type: FirebotAccountType;
  account?: Account;
  onConnectClick: () => void;
  onDisconnectClick: () => void;
}> = ({ type, account, onConnectClick, onDisconnectClick }) => (
  <div>
    <div className="text-lg text-primary-text font-bold">
      {type === "streamer" ? "Streamer" : "Bot"}
    </div>
    <div>
      {!account && (
        <button
          className="text-primary-text bg-primary-bg/25 py-1 px-2 rounded-lg flex items-center"
          onClick={onConnectClick}
        >
          <PlusCircleIcon className="w-4 h-4 mr-1" />
          Connect account
        </button>
      )}
    </div>
  </div>
);

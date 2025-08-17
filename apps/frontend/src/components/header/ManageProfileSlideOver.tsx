import type { StreamingPlatformIdName } from "@/lib/api/resources/streaming-platform";
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
import { AnimatePresence, motion } from "motion/react";
import {
  FbSlideOverContent,
  useShowSlideOverBuilder,
} from "../slideover/FbSlideOverContext";
import { useDcfInfoSlideOver } from "./DcfInfoSlideOver";
import { useDeleteAccountForLogin } from "@/hooks/api/use-delete-account-for-login";

export const useManageProfileSlideOver = () => {
  const { data: activeProfile } = useActiveProfile();

  return useShowSlideOverBuilder({
    content: ManageProfileSlideOverContent,
    title: activeProfile?.name || "Manage Profile",
    showDismissButton: true,
  });
};

const ManageProfileSlideOverContent: FbSlideOverContent = () => {
  const { data: streamingPlatforms } = useStreamingPlatforms();
  const { data: loginData } = useLogins();

  return (
    <div>
      <h3 className="text-lg font-bold text-primary-foreground">Platforms</h3>
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
  );
};

const StreamingPlatformConfig: React.FC<{
  platform: StreamingPlatformIdName;
  loginSettings?: PlatformLoginSetting;
}> = ({ platform, loginSettings }) => {
  const { mutate: createLogin, isPending: isCreatingLogin } = useCreateLogin();

  const { mutate: deleteAccountForLogin, isPending: isDeletingAccount } =
    useDeleteAccountForLogin();

  const { api } = useFbApi();

  const dcfInfoSlideOver = useDcfInfoSlideOver();

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
      if (response) {
        console.log("response", response);
        dcfInfoSlideOver.show({
          params: {
            dcfCodeDetails: response,
            accountType: type,
            streamingPlatformName: streamingPlatform.name,
            providerId: streamingPlatform.id,
          },
        });
      }
    } else {
      // TODO not implemented
    }
  };

  const activeLogin = loginSettings?.loginConfigs?.find(
    (login) => login.id === loginSettings?.activeLoginConfigId
  );
  return (
    <div className="" key={platform.id}>
      <div className="flex items-center justify-between p-4 rounded-lg bg-background/75 rounded-b-none">
        <div className="flex items-center">
          {platform.icon && (
            <FontAwesomeIcon
              className="text-xl mr-2 text-white"
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              icon={["fab", platform.icon as any]}
            />
          )}
          <span className="text-xl text-card-foreground font-bold">
            {platform.name}
          </span>
        </div>
        {!!loginSettings?.loginConfigs?.length && (
          <ManageLoginDropdown platformId={platform.id} />
        )}
      </div>
      <div className="p-4 rounded-b-lg bg-card">
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
                onDisconnectClick={() => {
                  if (isDeletingAccount) return;
                  deleteAccountForLogin({
                    platformId: platform.id,
                    loginConfigId: activeLogin.id,
                    accountType: "streamer",
                  });
                }}
              />
              <Account
                type="bot"
                account={activeLogin.bot}
                onConnectClick={() =>
                  connectAccount(platform, activeLogin.id, "bot")
                }
                onDisconnectClick={() => {
                  if (isDeletingAccount) return;
                  deleteAccountForLogin({
                    platformId: platform.id,
                    loginConfigId: activeLogin.id,
                    accountType: "bot",
                  });
                }}
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
    <div className="text-lg text-foreground font-bold">
      {type === "streamer" ? "Streamer" : "Bot"}
    </div>
    <div>
      {!account ? (
        <button
          className="text-foreground bg-black/25 py-1 px-2 rounded-lg flex items-center"
          onClick={onConnectClick}
        >
          <PlusCircleIcon className="w-4 h-4 mr-1" />
          Connect account
        </button>
      ) : (
        <div className="flex items-center justify-between text-foreground pr-5">
          <div className="flex items-center gap-x-2">
            {account.avatarUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="w-8 h-8 object-cover rounded-full border-2 border-gray-500/50"
                src={account.avatarUrl}
                alt="Profile picture"
              />
            )}
            <div>{account.displayName}</div>
          </div>
          <button onClick={onDisconnectClick}>
            <FontAwesomeIcon icon="trash-alt" color="red" />
          </button>
        </div>
      )}
    </div>
  </div>
);

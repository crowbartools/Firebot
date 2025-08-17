import { Menu } from "@headlessui/react";
import { ChevronDownIcon, TrashIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { PlusCircleIcon } from "@heroicons/react/16/solid";
import { useCreateLogin } from "@/hooks/api/use-create-login";
import { useLogins } from "@/hooks/api/use-logins";
import { useDeleteLogin } from "@/hooks/api/use-delete-login";
import { useSetActiveLogin } from "@/hooks/api/use-set-active-login";

export const ManageLoginDropdown: React.FC<{ platformId: string }> = ({
  platformId,
}) => {
  const { data: loginData } = useLogins();
  const { mutate: createLogin, isPending: isCreatingLogin } = useCreateLogin();
  const { mutate: deleteLogin, isPending: isDeletingLogin } = useDeleteLogin();
  const { mutate: setActiveLogin, isPending: isSettingActiveLogin } =
    useSetActiveLogin();

  const loginForPlatform = loginData?.[platformId];

  const activeLogin = loginForPlatform?.loginConfigs?.find(
    (login) => login.id === loginForPlatform?.activeLoginConfigId
  );

  return (
    <>
      <Menu as="div" className="relative">
        {({ open }) => (
          <>
            <Menu.Button className="-m-1.5 flex items-center p-1.5">
              <span className="sr-only">Open login menu</span>
              <span className="flex items-center">
                <span
                  className="ml-4 text-sm font-semibold leading-6 text-gray-100"
                  aria-hidden="true"
                >
                  Manage Logins
                </span>
                <ChevronDownIcon
                  className="ml-2 h-5 w-5 text-gray-400"
                  aria-hidden="true"
                />
              </span>
            </Menu.Button>
            <AnimatePresence>
              {open && (
                <Menu.Items
                  static
                  className="absolute right-0 z-10 mt-2.5 w-48 origin-top-right rounded-md divide-y divide-secondary/50 bg-accent shadow-lg ring-1 ring-gray-900/5 focus:outline-hidden"
                  as={motion.div}
                  initial={{ opacity: 0, scale: 1.0, y: "-50%" }}
                  animate={{
                    opacity: 1,
                    scale: 1.0,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    scale: 1.0,
                    y: "-10%",
                    transition: {
                      duration: 0.1,
                    },
                  }}
                >
                  <div className="p-1">
                    <MenuItem
                      label="Delete this login"
                      Icon={TrashIcon}
                      onClick={() => {
                        if (!activeLogin || isDeletingLogin) return;
                        deleteLogin({
                          platformId,
                          loginConfigId: activeLogin.id,
                        });
                      }}
                    />
                  </div>
                  <div className="p-1">
                    <MenuItem
                      label="Create new login"
                      Icon={PlusCircleIcon}
                      onClick={() => {
                        if (isCreatingLogin) return;
                        createLogin({ platformId });
                      }}
                    />
                  </div>
                  {(loginForPlatform?.loginConfigs?.length ?? 0) > 1 && (
                    <div className="p-1">
                      <div className="text-foreground ml-3 mt-1 text-sm font-bold flex items-center">
                        Switch to:
                      </div>
                      {loginForPlatform?.loginConfigs
                        ?.filter(
                          (lc) => lc.id !== loginForPlatform.activeLoginConfigId
                        )
                        .map((loginConfig) => {
                          const streamerLabel = loginConfig.streamer
                            ? loginConfig.streamer.username
                            : "No streamer";
                          const botLabel = loginConfig.bot
                            ? loginConfig.bot.username
                            : "No bot";
                          return (
                            <MenuItem
                              key={loginConfig.id}
                              label={`${streamerLabel} / ${botLabel}`}
                              disabled={isSettingActiveLogin}
                              onClick={() => {
                                setActiveLogin({
                                  platformId,
                                  loginConfigId: loginConfig.id,
                                });
                              }}
                            />
                          );
                        })}
                    </div>
                  )}
                </Menu.Items>
              )}
            </AnimatePresence>
          </>
        )}
      </Menu>
    </>
  );
};

const MenuItem: React.FC<{
  label: string;
  Icon?: React.ForwardRefExoticComponent<
    Omit<React.SVGProps<SVGSVGElement>, "ref"> & {
      title?: string | undefined;
      titleId?: string | undefined;
    } & React.RefAttributes<SVGSVGElement>
  >;
  onClick: () => void;
  disabled?: boolean;
}> = ({ label, Icon, onClick, disabled }) => {
  return (
    <Menu.Item key={label} disabled={disabled}>
      {({ active, disabled }) => (
        <button
          className={clsx(
            active && !disabled ? "bg-secondary/25" : "",
            "flex rounded-md w-full items-center px-3 py-1 text-sm leading-6",
            disabled ? "text-gray-400 cursor-not-allowed" : "text-gray-100"
          )}
          onClick={onClick}
        >
          {Icon && <Icon className="mr-2 h-4 w-4" aria-hidden="true" />}
          {label}
        </button>
      )}
    </Menu.Item>
  );
};

import { useManageProfileSlideOver } from "@/components/header/ManageProfileSlideOver";
import { useActiveProfile } from "@/hooks/api/use-active-profile";
import { Menu } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import {
  PencilIcon,
  ArrowsRightLeftIcon,
  UsersIcon,
} from "@heroicons/react/16/solid";

export const ProfileDropdown: React.FC = () => {
  const { data: activeProfile } = useActiveProfile();

  const manageProfileSlideOver = useManageProfileSlideOver();

  return (
    <>
      <Menu as="div" className="relative">
        {({ open }) => (
          <>
            <Menu.Button className="-m-1.5 flex items-center p-1.5">
              <span className="sr-only">Open user menu</span>
              <span className="flex items-center">
                <span
                  className="ml-4 text-sm font-semibold leading-6 text-gray-100"
                  aria-hidden="true"
                >
                  {activeProfile?.name}
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
                  className="absolute right-0 z-10 mt-2.5 w-48 origin-top-right rounded-md divide-y divide-secondary-bg/50 bg-tertiary-bg shadow-lg ring-1 ring-gray-900/5 focus:outline-none"
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
                      label="Edit profile"
                      Icon={PencilIcon}
                      onClick={() => {
                        manageProfileSlideOver.show({
                          params: {},
                        });
                      }}
                    />
                  </div>
                  <div className="p-1">
                    <MenuItem
                      label="Switch profile"
                      Icon={ArrowsRightLeftIcon}
                      disabled
                      onClick={() => {}}
                    />
                    <MenuItem
                      label="Manage profiles"
                      Icon={UsersIcon}
                      disabled
                      onClick={() => {}}
                    />
                  </div>
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
            active && !disabled ? "bg-secondary-bg/25" : "",
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

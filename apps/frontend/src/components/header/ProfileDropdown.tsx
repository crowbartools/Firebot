import { ManageProfileSlideOver } from "@/components/header/ManageProfileSlideOver";
import { useActiveProfile } from "@/hooks/api/use-active-profile";
import { Menu } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

export const ProfileDropdown: React.FC = () => {
  const { data: activeProfile } = useActiveProfile();

  const [loginsOpen, setLoginsOpen] = useState(false);

  return (
    <>
      <Menu as="div" className="relative">
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
          <Menu.Items
            className="absolute right-0 z-10 mt-2.5 w-32 origin-top-right rounded-md bg-tertiary-bg py-2 shadow-lg ring-1 ring-gray-900/5 focus:outline-none"
            as={motion.div}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1.0 }}
            exit={{ opacity: 1, scale: 0.95 }}
          >
            <MenuItem
              label="Manage profile"
              onClick={() => setLoginsOpen(true)}
            />
          </Menu.Items>
        </AnimatePresence>
      </Menu>
      <ManageProfileSlideOver
        open={loginsOpen}
        onClose={() => setLoginsOpen(false)}
      />
    </>
  );
};

const MenuItem: React.FC<{ label: string; onClick: () => void }> = ({
  label,
  onClick,
}) => {
  return (
    <Menu.Item key={label}>
      {({ active }) => (
        <span
          className={clsx(
            active ? "bg-secondary-bg/25" : "",
            "block px-3 py-1 text-sm leading-6 text-gray-100"
          )}
          onClick={onClick}
        >
          {label}
        </span>
      )}
    </Menu.Item>
  );
};

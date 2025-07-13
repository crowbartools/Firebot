import { Dialog } from "@headlessui/react";
import { motion } from "motion/react";

export const Modal: React.FC<{
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  initialFocusRef?: React.MutableRefObject<HTMLElement | null>;
}> = ({ open, onClose, children, initialFocusRef }) => {
  return (
    <Dialog
      as="div"
      className="relative z-99999"
      onClose={onClose}
      open={open}
      initialFocus={initialFocusRef}
    >
      <motion.div
        className="fixed inset-0 bg-primary-bg/75"
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: 1,
        }}
        exit={{
          opacity: 0,
        }}
      />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <Dialog.Panel
            as={motion.div}
            className="relative transform overflow-hidden rounded-lg bg-tertiary-bg px-4 pb-4 pt-5 text-left shadow-xl sm:my-8 sm:w-full sm:max-w-lg sm:p-6"
            initial={{
              opacity: 0,
              scale: 0.95,
            }}
            animate={{
              opacity: 1,
              scale: 1.0,
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
            }}
          >
            {children}
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
};

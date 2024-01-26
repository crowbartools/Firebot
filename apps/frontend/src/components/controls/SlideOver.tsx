import { Dialog } from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { AnimatePresence, motion } from "framer-motion";

export const SlideOver: React.FC<{
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}> = ({ open, onClose, children, title }) => {
  return (
    <AnimatePresence>
      {open && (
        <Dialog
          as="div"
          className="relative z-[9999999999]"
          onClose={onClose}
          open={open}
        >
          <motion.div
            className="fixed inset-0 bg-primary-bg bg-opacity-75"
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

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <motion.div
                    initial={{
                      x: "100%",
                    }}
                    animate={{
                      x: "0%",
                    }}
                    exit={{
                      x: "100%",
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 32,
                    }}
                    className="flex h-full flex-col overflow-y-scroll bg-tertiary-bg py-6 shadow-xl"
                  >
                    <div className="px-4 sm:px-6">
                      <div className="flex items-start justify-between">
                        <Dialog.Title className="text-base font-semibold leading-6 text-gray-100">
                          {title}
                        </Dialog.Title>
                        <div className="ml-3 flex h-7 items-center">
                          <button
                            type="button"
                            className="relative rounded-md bg-tertiary-bg text-gray-300 hover:text-gray-400 border-none outline-none focus:text-white"
                            onClick={onClose}
                          >
                            <span className="absolute -inset-2.5" />
                            <span className="sr-only">Close panel</span>
                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="relative mt-6 flex-1 px-4 sm:px-6">
                      {children}
                    </div>
                  </motion.div>
                </Dialog.Panel>
              </div>
            </div>
          </div>
        </Dialog>
      )}
    </AnimatePresence>
  );
};

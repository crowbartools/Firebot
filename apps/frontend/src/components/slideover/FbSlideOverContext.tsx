/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnimatePresence, Variants, motion } from "framer-motion";
import { createContext, useCallback, useContext, useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { createPortal } from "react-dom";
import { ChevronLeftIcon } from "@heroicons/react/20/solid";

export type FbSlideOverContent<
  Params extends Record<string, unknown> | undefined = any,
  ReturnData extends Record<string, unknown> | undefined = any,
> = React.FC<{
  params: Params;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onClose: (data?: ReturnData) => void;
  onDismiss: () => void;
}>;

type FbSlideOverConfig<
  Params extends Record<string, unknown> | undefined = any,
  ReturnData extends Record<string, unknown> | undefined = any,
> = {
  title?: string;
  showDismissButton?: boolean;
  params: Params;
  disableClickAway?: boolean;
  content: FbSlideOverContent<Params, ReturnData>;
  willDismiss?: () => PromiseLike<boolean | void> | boolean | void;
  onClose?: (data?: ReturnData) => void;
  onDismiss?: () => void;
};

type FbSlideOverContextProps = {
  showSlideOver: <
    Params extends Record<string, unknown> | undefined = any,
    ReturnData extends Record<string, unknown> | undefined = any,
  >(
    config: FbSlideOverConfig<Params, ReturnData>
  ) => void;
  onSlideOverDismissed: (id: string) => void;
  onSlideOverClosed: (id: string, data: unknown) => void;
};

const FbSlideOverContext = createContext<FbSlideOverContextProps>({
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  showSlideOver: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onSlideOverDismissed: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onSlideOverClosed: () => {},
});

type AnimationDirection = "forward" | "back";

const variants: Variants = {
  enter: (direction: AnimationDirection) => {
    return {
      x: direction === "forward" ? 1000 : -1000,
      opacity: 0,
    };
  },
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
  },
  exit: (direction: AnimationDirection) => {
    return {
      zIndex: 0,
      x: direction === "back" ? 1000 : -1000,
      opacity: 0,
    };
  },
};

export const FbSlideOverProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [slideOverConfigs, setSlideOverConfigs] = useState<
    Array<{ id: string; config: FbSlideOverConfig }>
  >([]);

  const [direction, setDirection] = useState<AnimationDirection>("forward");

  const showSlideOver = useCallback(
    (config: FbSlideOverConfig) => {
      const id = Math.random().toString();
      setSlideOverConfigs((prev) => [{ id, config }, ...prev]);
      setDirection("forward");
    },
    [setSlideOverConfigs]
  );

  const goBack = useCallback(() => {
    setSlideOverConfigs((prev) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, ...rest] = prev;
      return rest;
    });
    setDirection("back");
  }, [setSlideOverConfigs]);

  const currentSlideOver = slideOverConfigs[0];

  const hasSlideOvers = slideOverConfigs.length > 0;

  const onDismiss = useCallback(
    (id: string) => {
      if (id !== currentSlideOver.id) {
        return;
      }
      currentSlideOver?.config?.onDismiss?.();
      goBack();
    },
    [goBack, currentSlideOver]
  );

  const onClose = useCallback(
    (id: string, returnData: unknown) => {
      if (id !== currentSlideOver.id) {
        return;
      }
      currentSlideOver?.config?.onClose?.(returnData);
      goBack();
    },
    [goBack, currentSlideOver]
  );

  const dismissEverything = useCallback(async () => {
    for (const config of slideOverConfigs) {
      if (config.config.willDismiss) {
        const shouldCancel = await config.config.willDismiss();
        if (shouldCancel) return;
      }
    }
    setSlideOverConfigs([]);
  }, [slideOverConfigs, setSlideOverConfigs]);

  return (
    <FbSlideOverContext.Provider
      value={{
        showSlideOver: showSlideOver,
        onSlideOverDismissed: onDismiss,
        onSlideOverClosed: onClose,
      }}
    >
      {children}
      {createPortal(
        <AnimatePresence>
          {hasSlideOvers && (
            <div className="relative z-[9999999999]">
              <motion.div
                id="slideover-bg"
                key="slideover-bg"
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
                    <div className="pointer-events-auto w-screen max-w-md">
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
                            <h2 className="text-base font-semibold leading-6 text-gray-100 flex items-center h-7">
                              {slideOverConfigs.length > 1 && (
                                <button
                                  type="button"
                                  className="relative rounded-md bg-tertiary-bg text-gray-300 hover:text-gray-400 border-none outline-none focus:text-white"
                                  onClick={() => onDismiss(currentSlideOver.id)}
                                >
                                  <span className="sr-only">Go back</span>
                                  <ChevronLeftIcon
                                    className="h-7 w-7"
                                    aria-hidden="true"
                                  />
                                </button>
                              )}
                              {currentSlideOver.config.title}
                            </h2>
                            {currentSlideOver.config.showDismissButton !==
                              false && (
                              <div className="ml-3 flex h-7 items-center">
                                <button
                                  type="button"
                                  className="relative rounded-md bg-tertiary-bg text-gray-300 hover:text-gray-400 border-none outline-none focus:text-white"
                                  onClick={dismissEverything}
                                >
                                  <span className="absolute -inset-2.5" />
                                  <span className="sr-only">Close panel</span>
                                  <XMarkIcon
                                    className="h-6 w-6"
                                    aria-hidden="true"
                                  />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="relative mt-6 flex-1 px-4 sm:px-6">
                          <AnimatePresence
                            initial={false}
                            custom={direction}
                            mode="popLayout"
                          >
                            <motion.div
                              key={currentSlideOver.id}
                              id={currentSlideOver.id}
                              custom={direction}
                              variants={variants}
                              initial="enter"
                              animate="center"
                              exit="exit"
                              transition={{
                                x: {
                                  type: "spring",
                                  stiffness: 300,
                                  damping: 30,
                                },
                                opacity: { duration: 0.2 },
                              }}
                            >
                              <currentSlideOver.config.content
                                onClose={(data) =>
                                  onClose(currentSlideOver.id, data)
                                }
                                params={currentSlideOver.config.params}
                                onDismiss={() => onDismiss(currentSlideOver.id)}
                              />
                            </motion.div>
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>,
        document.body,
        "fb-slide-over"
      )}
    </FbSlideOverContext.Provider>
  );
};

export const useFbSlideOver = () => {
  const fbSlideOverContext = useContext(FbSlideOverContext);
  if (fbSlideOverContext == null) {
    throw new Error(
      "FbSlideOverContext was null, ensure you're within a <FbSlideOverProvider />"
    );
  }
  return {
    showSlideOver: fbSlideOverContext.showSlideOver,
  };
};

export const useShowSlideOverBuilder = <
  Params extends Record<string, unknown> | undefined = any,
  ReturnData extends Record<string, unknown> | undefined = any,
>(
  initialConfig: Pick<
    FbSlideOverConfig<Params, ReturnData>,
    "showDismissButton" | "content" | "disableClickAway"
  > & { title?: string }
) => {
  const { showSlideOver } = useFbSlideOver();
  const show = (
    paramsAndCallback: Pick<
      FbSlideOverConfig<Params, ReturnData>,
      "params" | "onClose" | "onDismiss"
    > & {
      title?: string;
    }
  ) => {
    showSlideOver({
      title: "",
      ...initialConfig,
      ...paramsAndCallback,
    });
  };
  return { show };
};

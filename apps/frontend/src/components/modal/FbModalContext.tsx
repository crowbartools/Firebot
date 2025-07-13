/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnimatePresence } from "motion/react";
import { createContext, useCallback, useContext, useState } from "react";
import { Modal } from "./Modal";

type FbModalContent<
  Params extends Record<string, unknown> | undefined = any,
  ReturnData extends Record<string, unknown> | undefined = any,
> = React.FC<{
  params: Params;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onClose: (data?: ReturnData) => void;
  onDismiss: () => void;
}>;

type FbModalConfig<
  Params extends Record<string, unknown> | undefined = any,
  ReturnData extends Record<string, unknown> | undefined = any,
> = {
  title?: string;
  showDismissButton?: boolean;
  params: Params;
  disableClickAway?: boolean;
  content: FbModalContent<Params, ReturnData>;
  willDismiss?: () => PromiseLike<boolean | void> | boolean | void;
  onClose?: (data?: ReturnData) => void;
  onDismiss?: () => void;
};

type FbModalContextProps = {
  showModal: <
    Params extends Record<string, unknown> | undefined = any,
    ReturnData extends Record<string, unknown> | undefined = any,
  >(
    config: FbModalConfig<Params, ReturnData>
  ) => void;
  onModalDismissed: (id: string) => void;
  onModalClosed: (id: string, data: unknown) => void;
};

const FbModalContext = createContext<FbModalContextProps>({
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  showModal: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onModalDismissed: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onModalClosed: () => {},
});

// type ModalDirection = "forward" | "back";

export const FbModalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [modalConfigs, setModalConfigs] = useState<
    Array<{ id: string; config: FbModalConfig }>
  >([]);

  // const [direction, setDirection] = useState<ModalDirection>("forward");

  const showModal = useCallback(
    (config: FbModalConfig) => {
      const id = Math.random().toString();
      setModalConfigs((prev) => [{ id, config }, ...prev]);
      // setDirection("forward");
    },
    [setModalConfigs]
  );

  const goBack = useCallback(() => {
    setModalConfigs((prev) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, ...rest] = prev;
      return rest;
    });
    // setDirection("back");
  }, [setModalConfigs]);

  const currentModal = modalConfigs[0];

  const onDismiss = useCallback(
    (id: string) => {
      if (id !== currentModal.id) {
        return;
      }
      currentModal?.config?.onDismiss?.();
      goBack();
    },
    [goBack, currentModal]
  );

  const onClose = useCallback(
    (id: string, returnData: unknown) => {
      if (id !== currentModal.id) {
        return;
      }
      currentModal?.config?.onClose?.(returnData);
      goBack();
    },
    [goBack, currentModal]
  );

  return (
    <FbModalContext.Provider
      value={{
        showModal: showModal,
        onModalDismissed: onDismiss,
        onModalClosed: onClose,
      }}
    >
      {children}
      <AnimatePresence
        initial={false}
        /*custom={direction}*/
      >
        {[...modalConfigs].reverse().map(({ id, config }) => {
          return (
            <Modal
              key={id}
              open
              onClose={async () => {
                if (config.disableClickAway) return;
                if (config.willDismiss) {
                  const shouldCancel = await config.willDismiss();
                  if (shouldCancel) return;
                }
                onDismiss(id);
              }}
            >
              <config.content
                onClose={(data) => onClose(id, data)}
                params={config.params}
                onDismiss={() => onDismiss(id)}
              />
            </Modal>
          );
        })}
      </AnimatePresence>
    </FbModalContext.Provider>
  );
};

export const useFbModal = () => {
  const fbModalContext = useContext(FbModalContext);
  if (fbModalContext == null) {
    throw new Error(
      "FbModalContext was null, ensure you're within a <FbModalProvider />"
    );
  }
  return {
    showModal: fbModalContext.showModal,
  };
};

export const useShowModalBuilder = <
  Params extends Record<string, unknown> | undefined = any,
  ReturnData extends Record<string, unknown> | undefined = any,
>(
  initialConfig: Pick<
    FbModalConfig<Params, ReturnData>,
    "showDismissButton" | "content" | "disableClickAway"
  > & { title?: string }
) => {
  const { showModal } = useFbModal();
  const show = (
    paramsAndCallback: Pick<
      FbModalConfig<Params, ReturnData>,
      "params" | "onClose" | "onDismiss"
    > & {
      title?: string;
    }
  ) => {
    showModal({
      title: "",
      ...initialConfig,
      ...paramsAndCallback,
    });
  };
  return { show };
};

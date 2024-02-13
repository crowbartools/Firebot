/* eslint-disable @typescript-eslint/no-explicit-any */
import { AnimatePresence } from "framer-motion";
import { createContext, useCallback, useContext, useState } from "react";

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
  content: FbModalContent<Params, ReturnData>;
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
  getModalConfig: (id: string) => FbModalConfig | undefined;
  onModalDismissed: (id: string) => void;
  onModalClosed: (id: string, data: unknown) => void;
};

const FbModalContext = createContext<FbModalContextProps>({
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  showModal: () => {},
  getModalConfig: () => undefined,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onModalDismissed: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onModalClosed: () => {},
});

type ModalDirection = "forward" | "back";

export const FbModalProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [modalConfigs, setModalConfigs] = useState<
    Array<{ id: string; config: FbModalConfig }>
  >([]);

  const [direction, setDirection] = useState<ModalDirection>("forward");

  const showModal = useCallback(
    (config: FbModalConfig) => {
      const id = Math.random().toString();
      setModalConfigs((prev) => [{ id, config }, ...prev]);
      setDirection("forward");
    },
    [setModalConfigs]
  );

  const currentModal = modalConfigs[0];

  const goBack = useCallback(() => {
    setModalConfigs((prev) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, ...rest] = prev;
      return rest;
    });
    setDirection("back");
  }, [setModalConfigs]);

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
      <AnimatePresence initial={false} custom={direction}></AnimatePresence>
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
    "showBackButton" | "content" | "hideHeader"
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

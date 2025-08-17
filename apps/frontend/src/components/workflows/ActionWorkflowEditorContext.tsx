import { FirebotActionWorkflow } from "firebot-types";
import { createContext, useContext, useState } from "react";

type CursorMode = "drag" | "pointer";

type ActionWorkflowEditorContextProps = {
  cursorMode: CursorMode;
  setCursorMode: (mode: CursorMode) => void;
  workflow: FirebotActionWorkflow;
};

const ActionWorkflowEditorContext =
  createContext<ActionWorkflowEditorContextProps>({
    cursorMode: "drag",
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    setCursorMode: () => {},
    workflow: {
      id: "",
      nodes: [],
      edges: [],
    },
  });

export function ActionWorkflowEditorProvider({
  workflow,
  children,
}: {
  workflow: FirebotActionWorkflow;
  children: React.ReactNode;
}) {
  const [cursorMode, setCursorMode] = useState<CursorMode>("drag");

  return (
    <ActionWorkflowEditorContext.Provider
      value={{ cursorMode, setCursorMode, workflow }}
    >
      {children}
    </ActionWorkflowEditorContext.Provider>
  );
}

export const useActionWorkflowEditor = () => {
  const context = useContext(ActionWorkflowEditorContext);
  if (context == null) {
    throw new Error(
      "ActionWorkflowEditorContext was null, ensure you're within a <ActionWorkflowEditorProvider />"
    );
  }
  return context;
};

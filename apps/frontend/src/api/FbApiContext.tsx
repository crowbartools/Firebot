import { FbApi } from "@/api/fb-api";
import { createContext, useRef } from "react";

const apiInstance = new FbApi();

type FbApiContextProps = {
  api: FbApi;
};

export const FbApiContext = createContext<FbApiContextProps>({
  api: apiInstance,
});

export const FbApiProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const api = useRef(apiInstance);
  return (
    <FbApiContext.Provider
      value={{
        api: api.current,
      }}
    >
      {children}
    </FbApiContext.Provider>
  );
};

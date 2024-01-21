import { FbApiContext } from "@/api/FbApiContext";
import { useContext } from "react";

export const useFbApi = () => {
  const apiContext = useContext(FbApiContext);
  if (apiContext == null) {
    throw new Error(
      "FbApiContext was null, ensure you're within a <FbApiProvider />"
    );
  }
  return apiContext;
};

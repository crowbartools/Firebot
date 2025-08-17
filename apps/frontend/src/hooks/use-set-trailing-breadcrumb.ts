import useAppStore from "@/stores/app-store";
import { useEffect } from "react";

export function useSetTrailingBreadcrumb(pageName: string) {
  const setTrailingBreadcrumb = useAppStore(
    (state) => state.setTrailingBreadcrumb
  );

  useEffect(() => {
    setTrailingBreadcrumb(pageName);
    return () => setTrailingBreadcrumb(undefined);
  }, [pageName, setTrailingBreadcrumb]);
}

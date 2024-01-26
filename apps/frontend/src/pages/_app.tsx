import type { AppProps } from "next/app";
import { initialStore, Provider as StoreProvider } from "../stores";
import "@/styles/globals.css";
import { SideNav } from "@/components/side-nav/SideNav";
import NoSSRWrapper from "@/components/NoSSRWrapper";
import { AppHeader } from "@/components/AppHeader";
import { FbApiProvider } from "@/api/FbApiContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";
import { fab } from "@fortawesome/free-brands-svg-icons";

export default function App({ Component, pageProps }: AppProps) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: 2 } },
  });

  library.add(fas, far, fab);

  return (
    <NoSSRWrapper>
      <FbApiProvider>
        <QueryClientProvider client={queryClient}>
          <StoreProvider value={initialStore}>
            <div className="bp3-dark w-full h-full bg-primary-bg text-white">
              <SideNav />
              <AppHeader />
              <div
                style={{
                  paddingLeft: "85px",
                }}
                className="h-full w-full"
              >
                <Component {...pageProps} />
              </div>
            </div>
          </StoreProvider>
        </QueryClientProvider>
      </FbApiProvider>
    </NoSSRWrapper>
  );
}

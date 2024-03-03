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
import { FbModalProvider } from "@/components/modal/FbModalContext";
import { FbSlideOverProvider } from "@/components/slideover/FbSlideOverContext";
import { RealTimeWsProvider } from "@/realtime/realtime-websocket";

export default function App({ Component, pageProps }: AppProps) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: 2 } },
  });

  library.add(fas, far, fab);

  return (
    <NoSSRWrapper>
      <RealTimeWsProvider>
        <FbApiProvider>
          <QueryClientProvider client={queryClient}>
            <StoreProvider value={initialStore}>
              <FbModalProvider>
                <FbSlideOverProvider>
                  <div className="bp3-dark flex flex-col w-full h-full bg-primary-bg text-white">
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
                    <div className="h-9 bg-secondary-bg z-50"></div>
                  </div>
                </FbSlideOverProvider>
              </FbModalProvider>
            </StoreProvider>
          </QueryClientProvider>
        </FbApiProvider>
      </RealTimeWsProvider>
    </NoSSRWrapper>
  );
}

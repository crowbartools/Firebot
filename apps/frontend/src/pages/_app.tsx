import type { AppProps } from "next/app";
import { initialStore, Provider as StoreProvider } from "../stores";
import "@/styles/globals.css";
import NoSSRWrapper from "@/components/NoSSRWrapper";
import { FbApiProvider } from "@/api/FbApiContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";
import { fab } from "@fortawesome/free-brands-svg-icons";
import { FbModalProvider } from "@/components/modal/FbModalContext";
import { FbSlideOverProvider } from "@/components/slideover/FbSlideOverContext";
import { RealTimeWsProvider } from "@/realtime/realtime-websocket";
import { SidebarLayout } from "@/components/ui/sidebar-layout";
import { Navbar } from "@/components/ui/navbar";
import { NewSideNav } from "@/components/side-nav/NewSideNav";

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
                  <SidebarLayout
                    sidebar={<NewSideNav />}
                    navbar={<Navbar>{/* Your navbar content */}</Navbar>}
                  >
                      <Component {...pageProps} />
                  </SidebarLayout>
                </FbSlideOverProvider>
              </FbModalProvider>
            </StoreProvider>
          </QueryClientProvider>
        </FbApiProvider>
      </RealTimeWsProvider>
    </NoSSRWrapper>
  );
}

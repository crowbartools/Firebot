import type { AppProps } from "next/app";
import "@/styles/globals.css";
import "@xyflow/react/dist/style.css";
import NoSSRWrapper from "@/components/NoSSRWrapper";
import { FbApiProvider } from "@/lib/api/FbApiContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";
import { fab } from "@fortawesome/free-brands-svg-icons";
import { FbModalProvider } from "@/components/modal/FbModalContext";
import { FbSlideOverProvider } from "@/components/slideover/FbSlideOverContext";
import { RealTimeWsProvider } from "@/realtime/realtime-websocket";
import { NewSidebarLayout } from "@/components/sidebar-layout";
import { NavigationGuardProvider } from "next-navigation-guard";
// import { SidebarLayout } from "@/components/catalyst/sidebar-layout";
// import { NewSideNav } from "@/components/side-nav/NewSideNav";
// import { Navbar } from "@/components/catalyst/navbar";
// import { Button } from "@/components/catalyst/button";

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
            <NavigationGuardProvider>
              <FbModalProvider>
                <FbSlideOverProvider>
                  <NewSidebarLayout>
                    <Component {...pageProps} />
                  </NewSidebarLayout>

                  {/* <SidebarLayout sidebar={<NewSideNav />}>
                  <Component {...pageProps} />
                </SidebarLayout> */}
                </FbSlideOverProvider>
              </FbModalProvider>
            </NavigationGuardProvider>
          </QueryClientProvider>
        </FbApiProvider>
      </RealTimeWsProvider>
    </NoSSRWrapper>
  );
}

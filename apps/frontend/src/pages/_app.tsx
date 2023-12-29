import type { AppProps } from "next/app";
import { initialStore, Provider as StoreProvider } from "../stores";
import "@/styles/globals.css";
import { SideNav } from "@/components/side-nav/SideNav";
import NoSSRWrapper from "@/components/NoSSRWrapper";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <NoSSRWrapper>
      <StoreProvider value={initialStore}>
        <div className="bp3-dark w-full h-full bg-primary-bg text-white">
          <SideNav />
          <div
            style={{
              paddingLeft: "85px",
              paddingTop: "64px",
            }}
            className="h-full w-full"
          >
            <Component {...pageProps} />
          </div>
        </div>
      </StoreProvider>
    </NoSSRWrapper>
  );
}

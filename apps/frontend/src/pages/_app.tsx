import type { AppProps } from "next/app";
import { initialStore, Provider as StoreProvider } from "../stores";
import "@/styles/globals.css";
import { SideNav } from "@/components/SideNav";

export default function App({ Component, pageProps }: AppProps) {
  return <StoreProvider value={initialStore}>
    <div className="bp3-dark w-full h-full bg-slab-900 text-white">
      <SideNav />
      <div
          style={{
              paddingLeft: "85px",
              paddingTop: "64px",
          }}
          className="h-full w-full"
      >
          <div className="w-full h-full pb-5 pr-5">
          <div
            className="bg-slab-700 flex h-full rounded-xl rounded-l-none p-4"
        >
              <Component {...pageProps} />
          </div>
          </div>
      </div>
    </div>
  </StoreProvider>;
}

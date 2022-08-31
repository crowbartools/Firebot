import { createContext, useContext } from "react";

import { profilesStore } from "./profiles-store";
import { settingsStore } from "./settings-store";
import { navbarStore } from "./nav-bar-store";

export const initialStore = {
    profilesStore,
    settingsStore,
    navbarStore,
};

const RootStoreContext = createContext(initialStore);

export const { Provider } = RootStoreContext;

export const useStores = () => {
    const store = useContext(RootStoreContext);
    if (store === null) {
        throw new Error("Store was null, ensure you're within a <Provider />");
    }
    return store;
};

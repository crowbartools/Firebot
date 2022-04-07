import * as React from "react";
import * as ReactDOM from "react-dom";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";
import { initialStore, Provider as StoreProvider } from "./stores";
import "./styles/index.css";

import App from "./app";

library.add(far, fas);

// Render app
ReactDOM.render(
    <StoreProvider value={initialStore}>
        <App />
    </StoreProvider>,
    document.getElementById("root")
);

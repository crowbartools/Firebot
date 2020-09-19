import * as React from "react";
import * as ReactDOM from "react-dom";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";
import { AppContainer } from "react-hot-loader";
import "./styles/index.css";

import App from "./app";
import { logger } from "./utils";

library.add(far, fas);

logger.info("testing");

// Render app
ReactDOM.render(
    <AppContainer>
        <App />
    </AppContainer>,
    document.getElementById("root")
);

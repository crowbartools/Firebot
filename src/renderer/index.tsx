import * as React from "react";
import * as ReactDOM from "react-dom";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { far } from "@fortawesome/free-regular-svg-icons";
import { AppContainer } from "react-hot-loader";
import "./styles/index.css";

import App from "./App";

library.add(far, fas);

// Render app
ReactDOM.render(
    <AppContainer>
        <App />
    </AppContainer>,
    document.getElementById("root")
);

setTimeout(() => {
    window.fbComm.invoke('testMethod', { foo: "testing"}).then(({ bar }) => {
        console.log("TEST RESPONSE: " + bar); 
    })
}, 1000);
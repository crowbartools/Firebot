import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { SideNav } from "./components";
import { appRoutes } from "./constants";
import { Commands, Settings } from "./pages";

const App = () => (
    <>
        <div className="bp3-dark w-full h-full bg-gray-700 text-white">
            <Router>
                <SideNav />
                <div
                    style={{
                        paddingLeft: "65px",
                    }}
                    className="h-full w-full"
                >
                    <Switch>
                        <Route exact path={appRoutes.COMMANDS}>
                            <Commands />
                        </Route>
                        <Route path={appRoutes.CHAT_FEED}>
                            <div className="h-full w-full flex justify-center items-center">
                                Chat Feed!
                            </div>
                        </Route>
                        <Route path={appRoutes.SETTINGS}>
                            <Settings />
                        </Route>
                    </Switch>
                </div>
            </Router>
        </div>
    </>
);

export default App;

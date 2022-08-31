import { observer } from "mobx-react";
import React, { useEffect, useRef } from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { useWindowSize } from "react-use";
import { menu } from "routes";
import { useStores } from "stores";
import { SideNav } from "./components";

const AppContent: React.FC = observer(() => {
    const { navbarStore } = useStores();

    const wrapperRef = useRef<HTMLDivElement>(null);

    if (wrapperRef.current) {
        const { x, y, width, height } =
            wrapperRef.current.getBoundingClientRect();
        navbarStore.setAppContentArea({
            x,
            y,
            width,
            height,
        });
    }

    //const { width, height } = useWindowSize();

    return (
        <div
            ref={wrapperRef}
            className="bg-slab-700 flex h-full rounded-xl rounded-l-none p-4 pl-0"
        >
            <Switch>
                {Object.values(menu)
                    .flat()
                    .map((item, index) => (
                        <Route exact={index === 0} path={item.route}>
                            {item.pageComponent}
                        </Route>
                    ))}
            </Switch>
        </div>
    );
});

const App = () => (
    <>
        <div className="bp3-dark w-full h-full bg-slab-900 text-white">
            <Router>
                <SideNav />
                <div
                    style={{
                        paddingLeft: "85px",
                        paddingTop: "64px",
                    }}
                    className="h-full w-full"
                >
                    <div className="w-full h-full pb-5 pr-5">
                        <AppContent />
                    </div>
                </div>
            </Router>
        </div>
    </>
);

export default App;

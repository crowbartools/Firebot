import React from "react";
import { useObserver } from "mobx-react-lite";

export function Commands() {
    return useObserver(() => (
        <div className="w-full h-full pb-5 pr-5">
            <div className="bg-slab-700 flex h-full rounded-xl p-4 pl-0 rounded-tl-none">
                <div className="w-20 flex-shrink-0 flex flex-col items-center">
                    <span className="text-xs font-extralight uppercase text-center">
                        Quick
                        <br />
                        Actions
                    </span>
                </div>
                <div className="bg-slab-900 w-52 rounded-xl flex-shrink-0 py-1 px-4">
                    <span className="text-xs font-extralight uppercase">
                        Chat Users
                    </span>
                </div>
                <div className="w-full flex-shrink px-3"></div>
                <div className="bg-slab-900 w-52 rounded-xl flex-shrink-0 py-1 px-4">
                    <span className="text-xs font-extralight uppercase">
                        Activity Feed
                    </span>
                </div>
            </div>
        </div>
    ));
}

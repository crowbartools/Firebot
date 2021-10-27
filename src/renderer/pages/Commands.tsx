import React, { useState } from "react";
import { useObserver } from "mobx-react-lite";
import { useStores } from "../stores";
import { SubWindow } from "../components";

export function Commands() {
    const [showWindow, setShowWindow] = useState(true);
    return useObserver(() => (
        <div className="w-full h-full">
            <div className="w-80 bg-gray-600 flex flex-col h-full">
                <h3 className="text-lg leading-6 font-medium p-5">Commands</h3>
                <div className="px-5 py-3">
                    <div className="mt-1 relative rounded-md shadow-sm">
                        <div
                            className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"
                            aria-hidden="true"
                        >
                            <svg
                                className="mr-3 h-4 w-4 text-gray-400"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                aria-hidden="true"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </div>
                        <input
                            type="text"
                            name="search"
                            id="search"
                            className="focus:ring-blue-500 block w-full pl-9 bg-gray-800 border-none rounded-md text-sm"
                            placeholder="Search"
                        />
                    </div>
                </div>
            </div>
            {showWindow && (
                <SubWindow
                    windowName="Some Name"
                    height={1000}
                    width={300}
                    onClose={() => setShowWindow(false)}

                >
                    <div className="bg-gray-600">Some content</div>
                </SubWindow>
            )}

        </div>
    ));
}

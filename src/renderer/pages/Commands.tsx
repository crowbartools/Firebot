import React from "react";
import { useObserver } from "mobx-react-lite";
import { useStores } from "../stores";

export function Commands() {
    const { profilesStore } = useStores();
    return useObserver(() => (
        <div>
            {profilesStore.profiles.map((p) => (
                <div key={p.id}>{p.name}</div>
            ))}
        </div>
    ));
}

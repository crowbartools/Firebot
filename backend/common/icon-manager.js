"use strict";

const axios = require("axios").default;
const frontendCommunicator = require("./frontend-communicator");

let icons = [];

const loadFontAwesomeIcons = async () => {
    const fontAwesomeIcons = (await axios.get("https://raw.githubusercontent.com/FortAwesome/Font-Awesome/master/metadata/icons.json")).data;

    for (const iconName in fontAwesomeIcons) {
        if (fontAwesomeIcons[iconName].private) {
            delete fontAwesomeIcons[iconName];
        }
    }

    const mappedIcons = Object.entries(fontAwesomeIcons).map(([name, data]) => {
        if (data.free.includes("brands")) {
            return {
                name: `${name.replace("-", " ")}`,
                className: `fab fa-${name}`,
                style: "Brands",
                searchTerms: data.search.terms
            };
        }

        const styles = ['Solid', 'Regular', 'Light', 'Duotone'];
        const versions = styles.map(s => {
            return {
                name: `${name.replace("-", " ")}`,
                className: `fa${s.charAt(0).toLowerCase()} fa-${name}`,
                style: s,
                searchTerms: data.search.terms
            };
        });

        return versions;
    });

    icons = mappedIcons.reduce((flat, next) => flat.concat(next), []);
};

frontendCommunicator.on("all-font-awesome-icons", () => icons);

exports.loadFontAwesomeIcons = loadFontAwesomeIcons;
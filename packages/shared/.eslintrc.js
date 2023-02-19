module.exports = {
    extends: ["custom"],
    env: {
      node: true,
      jest: true,
    },
    rules: {
        "@typescript-eslint/ban-types": "off"
    }
};

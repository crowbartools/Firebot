let host = "";

if (
    module != null &&
    typeof module.exports === 'object' &&
    process.env.NODE_MODE === 'development'
) {
    host = `://${process.env.FIREBOT_BACKEND_ADDRESS}:${process.env.FIREBOT_BACKEND_PORT}`

} else if (typeof window !== "undefined") {
    host = "http://localhost:3001";
    // host = `${window.location.protocol}://${window.location.host}:${window.location.port}`
}

export default (() : string => {
    return host;
});

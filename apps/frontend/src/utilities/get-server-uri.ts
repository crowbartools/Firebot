let host = "";

if (
    module != null &&
    typeof module.exports === 'object' &&
    process.env.NEXT_PUBLIC_NODE_ENV === 'development'
) {
    host = `http://${process.env.NEXT_PUBLIC_FIREBOT_BACKEND_ADDRESS}:${process.env.NEXT_PUBLIC_FIREBOT_BACKEND_PORT}`
} else if (typeof window !== "undefined") {
    host = `${window.location.protocol}://${window.location.host}:${window.location.port}`
}

export default (() : string => {
    return host;
});

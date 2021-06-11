const { withLayer0 } = require("@layer0/next/config");

module.exports = withLayer0({
    serverRuntimeConfig: {
        PROJECT_ROOT: __dirname
    },
    env: {
        PREVIEW_LAYER0_DEVTOOLS_ENABLED: "false"
    }
});

// Only the standalone preview loads this fixture. Quasar provides its own authenticated SDK.
window.quasarSdk = {
    async request(pluginId, operation) {
        if (pluginId === "template-plugin" && operation === "version.read") return "preview";
        throw new Error(`Unknown preview operation: ${pluginId}/${operation}`);
    }
};

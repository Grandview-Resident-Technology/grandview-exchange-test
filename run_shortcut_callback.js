module.exports = async (params) => {
    // 1. Check for Advanced URI plugin
    const advancedUriPlugin = app.plugins.plugins["obsidian-advanced-uri"];
    if (!advancedUriPlugin) {
        new Notice("Advanced URI plugin is not enabled!");
        return;
    }

    // 2. Specify your Apple Shortcut name
    const shortcutName = "YOUR_SHORTCUT_NAME"; 

    // 3. Get active file info
    const targetFile = app.workspace.getActiveFile();
    if (!targetFile) {
        new Notice("No active file open!");
        return;
    }
    
    const noteTitle = targetFile.basename;
    const advancedUri = advancedUriPlugin.generateAdvancedUri(targetFile);

    // 4. Package title and URI into a JSON payload
    const payload = JSON.stringify({
        title: noteTitle,
        uri: advancedUri
    });

    // 5. Construct the encoded x-callback-url
    const encodedShortcut = encodeURIComponent(shortcutName);
    const encodedPayload = encodeURIComponent(payload);
    const encodedSuccess = encodeURIComponent("obsidian://open");

    const callbackUrl = `shortcuts://x-callback-url/run-shortcut?name=${encodedShortcut}&input=text&text=${encodedPayload}&x-success=${encodedSuccess}`;

    // 6. Launch the URL scheme
    window.open(callbackUrl);
};

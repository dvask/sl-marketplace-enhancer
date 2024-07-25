/*!
 * SL Marketplace Enhancer
 * Copyright (c) 2024 tjaysworld.com
 * Licensed under the MIT License (https://opensource.org/licenses/MIT)
 */

document.addEventListener('DOMContentLoaded', function () {
    const checkboxIds = [
      'hideFeaturedItemsCategory',
      'enableProductTimestamp',
      'enableProductTags',
      'enableSearchTimestamp',
      'enableStoreTimestamp'
    ];
    const togglePluginButton = document.getElementById('togglePlugin');
    const storage = chrome.storage || (browser && browser.storage);

    function showStatusMessage(message, isError = false) {
        const statusMessage = document.getElementById('statusMessage');
        if (statusMessage) {
            statusMessage.textContent = message;
            statusMessage.style.color = isError ? 'red' : 'green';
            statusMessage.style.display = 'block';
            setTimeout(() => {
                statusMessage.style.display = 'none';
            }, 3000);
        }
    }

    function loadSettings() {
        return new Promise((resolve, reject) => {
            storage.sync.get([...checkboxIds, 'pluginEnabled'], function(result) {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                    return;
                }

                // Set default values if they're not already set
                const defaultSettings = {
                    pluginEnabled: true,
                    hideFeaturedItemsCategory: false,
                    enableProductTimestamp: true,
                    enableProductTags: true,
                    enableSearchTimestamp: true,
                    enableStoreTimestamp: true
                };

                let settingsChanged = false;

                for (const [key, defaultValue] of Object.entries(defaultSettings)) {
                    if (result[key] === undefined) {
                        result[key] = defaultValue;
                        settingsChanged = true;
                    }
                }

                // If any default settings were applied, save them
                if (settingsChanged) {
                    storage.sync.set(result, function() {
                        if (chrome.runtime.lastError) {
                            console.error('Error saving default settings:', chrome.runtime.lastError);
                        }
                    });
                }

                // Update checkboxes and toggle button
                checkboxIds.forEach(id => {
                    const checkbox = document.getElementById(id);
                    if (checkbox) checkbox.checked = result[id];
                });
                
                if (togglePluginButton) {
                    const isEnabled = result.pluginEnabled;
                    togglePluginButton.textContent = isEnabled ? 'Disable Plugin' : 'Enable Plugin';
                    togglePluginButton.className = isEnabled ? 'enabled' : 'disabled';
                }

                resolve();
            });
        });
    }

    function saveSetting(key, value) {
        storage.sync.set({ [key]: value }, function() {
            if (chrome.runtime.lastError) {
                showStatusMessage('Error saving setting', true);
            } else {
                showStatusMessage('Setting saved successfully!');
            }
        });
    }

    function togglePlugin() {
        storage.sync.get('pluginEnabled', function(result) {
            if (chrome.runtime.lastError) {
                showStatusMessage('Error toggling plugin', true);
                return;
            }

            const newState = !(result.pluginEnabled === undefined || result.pluginEnabled);
            storage.sync.set({ pluginEnabled: newState }, function() {
                if (chrome.runtime.lastError) {
                    showStatusMessage('Error toggling plugin', true);
                } else {
                    togglePluginButton.textContent = newState ? 'Disable Plugin' : 'Enable Plugin';
                    togglePluginButton.className = newState ? 'enabled' : 'disabled';
                    showStatusMessage(`Plugin ${newState ? 'enabled' : 'disabled'} successfully!`);
                }
            });
        });
    }

    // Load settings and add event listeners
    loadSettings().then(() => {
        checkboxIds.forEach(id => {
            const checkbox = document.getElementById(id);
            if (checkbox) checkbox.addEventListener('change', () => saveSetting(id, checkbox.checked));
        });

        if (togglePluginButton) togglePluginButton.addEventListener('click', togglePlugin);
    }).catch(error => {
        showStatusMessage('Error loading settings', true);
        console.error(error);
    });
});
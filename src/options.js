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
      'enableStoreTimestamp' // New setting for store timestamps
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
        storage.sync.get([...checkboxIds, 'pluginEnabled'], function(result) {
            if (chrome.runtime.lastError) {
                showStatusMessage('Error loading settings', true);
                return;
            }
  
            if (typeof result.hideFeaturedItemsCategory === 'undefined') {
              storage.sync.set({ hideFeaturedItemsCategory: false });
            }
  
            checkboxIds.forEach(id => {
                const checkbox = document.getElementById(id);
                if (checkbox) checkbox.checked = result[id] !== false;
            });
            if (togglePluginButton) {
                const isEnabled = result.pluginEnabled !== false;
                togglePluginButton.textContent = isEnabled ? 'Disable Plugin' : 'Enable Plugin';
                togglePluginButton.className = isEnabled ? 'enabled' : 'disabled';
            }
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
  
    // Load settings
    loadSettings();
  
    // Add event listeners
    checkboxIds.forEach(id => {
        const checkbox = document.getElementById(id);
        if (checkbox) checkbox.addEventListener('change', () => saveSetting(id, checkbox.checked));
    });
  
    if (togglePluginButton) togglePluginButton.addEventListener('click', togglePlugin);
  });
  
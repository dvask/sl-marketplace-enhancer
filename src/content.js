/*!
 * SL Marketplace Enhancer
 * Copyright (c) 2024 tjaysworld.com
 * Licensed under the MIT License (https://opensource.org/licenses/MIT)
 */

// Variables
let timestampsAdded = false;
let tagsAdded = false;
let lastUrl = '';

// Utility functions
function parseTimestamp(url) {
    const match = url.match(/\?(\d+)$/);
    return match ? parseInt(match[1], 10) : null;
}

function formatDate(timestamp) {
    return new Date(timestamp * 1000).toLocaleDateString(navigator.language, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function addElementToContainer(container, elementType, textContent, className) {
    const element = document.createElement(elementType);
    element.textContent = textContent;
    if (className) element.className = className;
    container.appendChild(element);
}

// Main functions
function addPostTimestamp() {
    if (timestampsAdded) return;
    const ogImageMetaTag = document.querySelector('meta[property="og:image"]');
    if (!ogImageMetaTag) {
        console.log('og:image meta tag not found');
        return;
    }

    const timestamp = parseTimestamp(ogImageMetaTag.content);
    if (!timestamp) {
        console.log('Failed to parse timestamp from og:image URL');
        return;
    }

    const humanReadableDate = formatDate(timestamp);
    const ul = document.querySelector('div#product-details ul');
    if (ul) {
        addElementToContainer(ul, 'li', `Posted on: ${humanReadableDate}`);
        timestampsAdded = true;
    } else {
        console.log('Product details ul not found');
    }
}

function addProductTags() {
    if (tagsAdded) return;
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
        console.log('Keywords meta tag not found');
        return;
    }

    const tags = metaKeywords.content.split(',').map(tag => tag.trim());
    const ul = document.querySelector('div#product-details ul');
    if (ul) {
        addElementToContainer(ul, 'li', `Tags: ${tags.join(', ')}`);
        tagsAdded = true;
    } else {
        console.log('Product details ul not found');
    }
}

function addSearchResultsTimestamps() {
    if (timestampsAdded) return;
    const galleryItems = document.querySelectorAll('.column.gallery-item');
    galleryItems.forEach((item, index) => {
        const img = item.querySelector('a.product-image img');
        if (!img) {
            console.log(`No image found for item ${index}`);
            return;
        }

        const timestamp = parseTimestamp(img.src);
        if (!timestamp) {
            console.log(`Failed to parse timestamp for item ${index}`);
            return;
        }

        const humanReadableDate = formatDate(timestamp);
        const itemDescription = item.querySelector('div.item-description');
        if (itemDescription) {
            addElementToContainer(itemDescription, 'p', `Posted on: ${humanReadableDate}`, 'small');
        } else {
            console.log(`Item description not found for item ${index}`);
        }
    });
    timestampsAdded = true;
}

function hideFeaturedItems(selector) {
    const featuredItems = document.querySelector(selector);
    if (featuredItems) {
        featuredItems.style.display = 'none';
    } else {
        console.log('Featured items element not found');
    }
}

function handlePageLoad() {
    const storage = chrome.storage || (browser && browser.storage);
    
    if (!storage || !storage.sync) {
        console.error('Storage API is not available');
        return;
    }

    storage.sync.get([
        'pluginEnabled',
        'enableProductTimestamp',
        'enableProductTags',
        'enableSearchTimestamp',
        'enableStoreTimestamp',
        'hideFeaturedItemsCategory'
    ], function(result) {
        if (chrome.runtime.lastError) {
            console.error('An error occurred:', chrome.runtime.lastError);
            return;
        }

        const settings = {
            pluginEnabled: result.pluginEnabled !== false,
            enableProductTimestamp: result.enableProductTimestamp !== false,
            enableProductTags: result.enableProductTags !== false,
            enableSearchTimestamp: result.enableSearchTimestamp !== false,
            enableStoreTimestamp: result.enableStoreTimestamp !== false,
            hideFeaturedItemsCategory: result.hideFeaturedItemsCategory === true
        };

        if (settings.pluginEnabled === false) {
            console.log('Plugin is disabled');
            return;
        }

        const url = window.location.href;

        if (url !== lastUrl) {
            timestampsAdded = false;
            tagsAdded = false;
            lastUrl = url;
        }

        if (url.includes('/p/')) {
            if (settings.enableProductTimestamp) {
                addPostTimestamp();
            }
            if (settings.enableProductTags) {
                addProductTags();
            }
        } else if (url.match(/products\/search/)) {
            if (settings.enableSearchTimestamp) {
                addSearchResultsTimestamps();
            }
        } else if (url.match(/\/stores\//)) {
            if (settings.enableStoreTimestamp) {
                addSearchResultsTimestamps();
            }
        }

        if (settings.hideFeaturedItemsCategory) {
            if (url.match(/^https:\/\/marketplace\.secondlife\.com\/(en-US|ja-JP|de-DE|fr-FR|pt-BR|es-ES)\/?$/)) {
                hideFeaturedItems('#featured-items');
            } else if (url.match(/products\/search/)) {
                hideFeaturedItems('#featured-items-category');
            }
        }
    });
}

function observeDOMChanges() {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                const addedNodes = mutation.addedNodes;
                for (let node of addedNodes) {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.matches('.column.gallery-item') || node.querySelector('.column.gallery-item')) {
                            handlePageLoad();
                            break;
                        }
                    }
                }
            }
        });
    });

    observer.observe(document.body, { childList: true, subtree: true });
}

// Run immediately and observe DOM changes
handlePageLoad();
observeDOMChanges();
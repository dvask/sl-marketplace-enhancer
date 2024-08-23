/*!
 * SL Marketplace Enhancer
 * Copyright (c) 2024 tjaysworld.com
 * Licensed under the MIT License (https://opensource.org/licenses/MIT)
 */

// Variables
let timestampsAdded = false;
let tagsAdded = false;
let lastUrl = '';
let settings = {};
let initialLoad = true;

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
    const detailsDiv = document.querySelector('div#details.body2');
    if (detailsDiv) {
        const dateElement = document.createElement('div');
        dateElement.className = 'body2 nowrap sl-enhancer-detail';
        dateElement.textContent = `Posted: ${humanReadableDate}`;
        
        const redeliveryDiv = detailsDiv.querySelector('.body2.redelivery.nowrap.permitted');
        if (redeliveryDiv && redeliveryDiv.nextSibling) {
            detailsDiv.insertBefore(dateElement, redeliveryDiv.nextSibling);
        } else {
            detailsDiv.appendChild(dateElement);
        }
        
        timestampsAdded = true;
    } else {
        console.log('Details div not found');
    }
}

function addProductTags() {
    if (tagsAdded) return;
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
        console.log('Keywords meta tag not found');
        return;
    }

    const tags = metaKeywords.content.split(',').map(tag => tag.trim()).filter(tag => tag); // Filter out empty tags
    const detailsDiv = document.querySelector('div#details.body2');
    if (detailsDiv) {
        const tagElement = document.createElement('div');
        tagElement.className = 'body2 sl-enhancer-detail';
        
        tagElement.textContent = `Tags: ${tags.join(', ')}`;
        
        const timestampDiv = detailsDiv.querySelector('.sl-enhancer-detail');
        if (timestampDiv && timestampDiv.nextSibling) {
            detailsDiv.insertBefore(tagElement, timestampDiv.nextSibling);
        } else {
            detailsDiv.appendChild(tagElement);
        }
        
        tagsAdded = true;
    } else {
        console.log('Details div not found');
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

function getElementByXPath(xpath) {
    return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
}

function updateSearchPageCheckboxes() {
    const filterMappings = [
        { param: 'copy_permission', xpath: '//*[@id="search_copy_permission"]' },
        { param: 'modify_permission', xpath: '//*[@id="search_modify_permission"]' },
        { param: 'transfer_permission', xpath: '//*[@id="search_transfer_permission"]' },
        { param: 'no_limited_quantities', xpath: '//*[@id="search_no_limited_quantities"]' },
        { param: 'no_demos', xpath: '//*[@id="search_no_demos"]' }
    ];

    const urlParams = new URLSearchParams(window.location.search);

    filterMappings.forEach(mapping => {
        const checkbox = getElementByXPath(mapping.xpath);
        if (checkbox) {
            const isChecked = urlParams.get(`search[${mapping.param}]`) === '1';
            checkbox.checked = isChecked;
        }
    });
}

// Function to generate filter parameters
function getFilterParams() {
    const params = new URLSearchParams();
    
    if (settings.enableAdvancedFilters) {
        if (settings.filterCopy) params.append('search[copy_permission]', '1');
        if (settings.filterModify) params.append('search[modify_permission]', '1');
        if (settings.filterTransfer) params.append('search[transfer_permission]', '1');
        if (settings.filterLimitedQuantities) params.append('search[no_limited_quantities]', '1');
        if (settings.filterDemoItems) params.append('search[no_demos]', '1');
    }
    
    return params;
}

// Function to modify search links
function modifySearchLinks() {
    const links = document.querySelectorAll('a[href*="search"]');
    links.forEach(link => {
        const url = new URL(link.href, window.location.origin);
        if (!url.pathname.includes('/stores/') && (url.searchParams.has('search[keywords]') || url.searchParams.has('search[category_id]'))) {
            const filterParams = getFilterParams();
            let modified = false;

            // Check each filter parameter
            for (let [key, value] of filterParams) {
                if (!url.searchParams.has(key)) {
                    url.searchParams.append(key, value);
                    modified = true;
                }
            }

            if (modified) {
                link.href = url.toString();
            }
        }
    });
}

// New function to handle form submission
function handleFormSubmission() {
    const form = document.querySelector('form.new_search');
    if (form) {
        form.addEventListener('submit', function(e) {
            const action = new URL(form.action);
            if (action.pathname.includes('/stores/')) {
                return; // Let the form submit normally for store searches for now.
            }

            e.preventDefault();
            const formData = new FormData(form);
            const url = new URL(form.action);
            for (let [key, value] of formData) {
                url.searchParams.append(key, value);
            }
            const filterParams = getFilterParams();
            for (let [key, value] of filterParams) {
                if (!url.searchParams.has(key)) {
                    url.searchParams.append(key, value);
                }
            }
            window.location.href = url.toString();
        });
    }
}

// Set up MutationObserver to handle dynamically added links
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
            modifySearchLinks();
        }
    });
});

function loadSettings() {
    return new Promise((resolve, reject) => {
        const storage = chrome.storage || (browser && browser.storage);
        if (!storage || !storage.sync) {
            console.error('Storage API is not available');
            reject('Storage API not available');
            return;
        }

        storage.sync.get([
            'pluginEnabled',
            'enableProductTimestamp',
            'enableProductTags',
            'enableSearchTimestamp',
            'enableStoreTimestamp',
            'hideFeaturedItemsCategory',
            'enableAdvancedFilters',
            'filterCopy',
            'filterModify',
            'filterTransfer',
            'filterLimitedQuantities',
            'filterDemoItems'
        ], function(result) {
            if (chrome.runtime.lastError) {
                console.error('An error occurred:', chrome.runtime.lastError);
                reject(chrome.runtime.lastError);
                return;
            }

            settings = {
                pluginEnabled: result.pluginEnabled !== false,
                enableProductTimestamp: result.enableProductTimestamp !== false,
                enableProductTags: result.enableProductTags !== false,
                enableSearchTimestamp: result.enableSearchTimestamp !== false,
                enableStoreTimestamp: result.enableStoreTimestamp !== false,
                hideFeaturedItemsCategory: result.hideFeaturedItemsCategory === true,
                enableAdvancedFilters: result.enableAdvancedFilters === true,
                filterCopy: result.filterCopy === true,
                filterModify: result.filterModify === true,
                filterTransfer: result.filterTransfer === true,
                filterLimitedQuantities: result.filterLimitedQuantities === true,
                filterDemoItems: result.filterDemoItems === true
            };

            resolve();
        });
    });
}

function handlePageLoad() {
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
        updateSearchPageCheckboxes();
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

    modifySearchLinks();
    handleFormSubmission();

    initialLoad = false;
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

function addStyleToHead() {
    const style = document.createElement('style');
    style.textContent = `
        .sl-enhancer-detail {
            max-width: 220px;
            overflow-wrap: break-word;
            word-wrap: break-word;
            hyphens: auto;
            margin-top: 5px;
            line-height: 1.4; /* Improve readability for multi-line content */
        }
    `;
    document.head.appendChild(style);
}

// Initialize and run
loadSettings().then(() => {
    addStyleToHead();
    handlePageLoad();
    observeDOMChanges();
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}).catch(error => {
    console.error('Failed to load settings:', error);
});

// Listen for changes to the settings
chrome.storage.onChanged.addListener(function(changes, namespace) {
    loadSettings().then(() => {
        handlePageLoad();
        modifySearchLinks();
    }).catch(error => {
        console.error('Failed to reload settings:', error);
    });
});
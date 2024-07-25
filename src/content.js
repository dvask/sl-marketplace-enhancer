/*!
 * SL Marketplace Enhancer
 * Copyright (c) 2024 tjaysworld.com
 * Licensed under the MIT License (https://opensource.org/licenses/MIT)
 */

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
    } else {
        console.log('Product details ul not found');
    }
  }
  
  function addProductTags() {
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
        console.log('Keywords meta tag not found');
        return;
    }
  
    const tags = metaKeywords.content.split(',').map(tag => tag.trim());
    const ul = document.querySelector('div#product-details ul');
    if (ul) {
        addElementToContainer(ul, 'li', `Tags: ${tags.join(', ')}`);
    } else {
        console.log('Product details ul not found');
    }
  }
  
  function addSearchResultsTimestamps() {
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
        'hideFeaturedItemsCategory'
    ], function(result) {
        if (chrome.runtime.lastError) {
            console.error('An error occurred:', chrome.runtime.lastError);
            return;
        }
  
        if (result.pluginEnabled === false) {
            console.log('Plugin is disabled');
            return;
        }
  
        const url = window.location.href;
  
        if (url.includes('/p/')) {
            if (result.enableProductTimestamp !== false) {
                addPostTimestamp();
            }
            if (result.enableProductTags !== false) {
                addProductTags();
            }
        } else if (url.match(/products\/search/)) {
            if (result.enableSearchTimestamp !== false) {
                addSearchResultsTimestamps();
            }
        } else if (url.match(/\/stores\//)) {
            if (result.enableSearchTimestamp !== false) {
                addSearchResultsTimestamps();
            }
        }
  
        if (result.hideFeaturedItemsCategory !== false) {
            if (url.match(/^https:\/\/marketplace\.secondlife\.com\/(en-US|ja-JP|de-DE|fr-FR|pt-BR|es-ES)\/?$/)) {
                hideFeaturedItems('#featured-items');
            } else if (url.match(/products\/search/)) {
                hideFeaturedItems('#featured-items-category');
            }
        }
    });
  }
  
  // Run immediately
  handlePageLoad();
  
  // We don't need DOMContentLoaded any longer, as we're running the script immediately.
  //document.addEventListener('DOMContentLoaded', handlePageLoad);
  
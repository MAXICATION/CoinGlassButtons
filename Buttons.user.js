// ==UserScript==
// @name         ❤️CoinGlass Iframe Buttons with TradingView & Bybit Links
// @namespace    http://tampermonkey.net/
// @version      4.0
// @description  Adds buttons to open/close iframes with specific websites, perform auto-search in the LQ_HM iframe, and provides quick navigation buttons to TradingView and Bybit for the current coin symbol.
// @author       @maxication
// @namespace    https://github.com/maxication
// @license      MIT
// @match        https://www.coinglass.com/tv/*
// @grant        none
// ==/UserScript==
/*
MIT License

Copyright (c) 2024 maxication

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
(function () {
    'use strict';

    let iframes = {};
    let currentCoinName = null;

    // Function to create a button
    function createButton(text, color, textColor, onClick) {
        let button = document.createElement('button');
        button.innerText = text;
        button.classList.add('MuiButtonBase-root', 'css-1jhxbfy');
        if (color) button.style.backgroundColor = color;
        if (textColor) button.style.color = textColor;
        button.onclick = onClick;
        return button;
    }

    // Function to toggle iframe
    function toggleIframe(url, coinName) {
        if (!iframes[url]) {
            let iframe = document.createElement('iframe');
            iframe.style.width = '80%';
            iframe.style.height = '80%';
            iframe.style.position = 'fixed';
            iframe.style.top = '10%';
            iframe.style.left = '10%';
            iframe.style.zIndex = '10000';
            iframe.src = url;
            iframe.classList.add('custom-iframe');
            document.body.appendChild(iframe);
            iframes[url] = iframe;

            iframe.onload = () => {
                console.log('Iframe loaded, initiating search with delay...');
                setTimeout(() => injectLQHMSearch(iframe, coinName), 500); // Delay for iframe load
            };
        } else {
            const iframe = iframes[url];
            if (iframe.style.display === 'none') {
                iframe.style.display = 'block';
                injectLQHMSearch(iframe, coinName); // Perform search
            } else {
                iframe.style.display = 'none';
            }
        }

        // Hide all other iframes
        Object.keys(iframes).forEach(key => {
            if (key !== url && iframes[key]) {
                iframes[key].style.display = 'none';
            }
        });
    }

    // Auto-search in LQ_HM iframe
    function injectLQHMSearch(iframe, coinName) {
        if (!coinName) return;

        const searchScript = `(function() {
            'use strict';
            console.log('Searching for coin: ${coinName}');
            function performSearch() {
                let targetElement = document.querySelector('div.MuiAutocomplete-root input');
                if (targetElement) {
                    targetElement.focus();
                    targetElement.value = '';
                    document.execCommand('insertText', false, '${coinName}');
                    targetElement.dispatchEvent(new Event('input', { bubbles: true }));
                    targetElement.dispatchEvent(new Event('change', { bubbles: true }));
                    setTimeout(() => {
                        let dropdownItem = document.querySelector('li.MuiAutocomplete-option');
                        if (dropdownItem) dropdownItem.click();
                    }, 700); // Delay for dropdown selection
                } else {
                    console.error('Search input not found');
                }
            }
            setTimeout(performSearch, 300); // Delay before text input
        })();`;

        iframe.contentWindow.eval(searchScript);
    }

    // Extract the second word (coin name)
    function extractCoinName(text) {
        const parts = text.split(' ');
        return parts.length > 1 ? parts[1].trim() : null;
    }

    // Monitor coin name changes
    function monitorCoinName(selector) {
        setInterval(() => {
            const targetNode = document.querySelector(selector);
            if (!targetNode) return;

            const newCoinName = extractCoinName(targetNode.innerText);
            if (newCoinName && newCoinName !== currentCoinName) {
                console.log(`Coin changed: ${currentCoinName} -> ${newCoinName}`);
                currentCoinName = newCoinName;
            }
        }, 500); // Check every 500 ms
    }

    // Create iframe buttons
    function createIframeButtons(targetDiv) {
        let websites = {
            'VS': { url: 'https://www.coinglass.com/pro/i/VisualScreener', textColor: '#ff33a6' },
            'LQ_HM': { url: 'https://www.coinglass.com/pro/futures/LiquidationHeatMap', textColor: '#ff5733' },
            'RSI_HM': { url: 'https://www.coinglass.com/pro/i/RsiHeatMap', textColor: '#33c1ff' },
            'OB_HM': { url: 'https://www.coinglass.com/LiquidityHeatmap', textColor: '#33ff57' },
            'G/L': { url: 'https://www.coinglass.com/gainers-losers', textColor: '#ffbd33' }
        };

        Object.keys(websites).forEach(name => {
            const website = websites[name];
            const button = createButton(`${name}`, null, website.textColor, () => {
                if (name === 'LQ_HM') {
                    toggleIframe(website.url, currentCoinName);
                } else {
                    toggleIframe(website.url, null);
                }
            });

            targetDiv.appendChild(button);
        });
    }

    // Helper: Wait for an element to appear
    function waitForElement(xpath, callback) {
        const interval = setInterval(() => {
            const targetDiv = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            if (targetDiv) {
                clearInterval(interval);
                callback(targetDiv);
            }
        }, 500);
    }

    // Create "TV" and "BB" buttons
    function createTradingButtons() {
        const buttonContainer = document.createElement('div');
        buttonContainer.style.position = 'fixed';
        buttonContainer.style.top = '670px';
        buttonContainer.style.left = '25px';
        buttonContainer.style.transform = 'translate(-50%, -50%)';
        buttonContainer.style.display = 'flex';
        buttonContainer.style.flexDirection = 'column';
        buttonContainer.style.gap = '10px';

        function createStyledButton(text, color, onClick) {
            const button = document.createElement('button');
            button.innerText = text;
            button.classList.add('button-KTgbfaP5');
            button.style.color = color;
            button.style.backgroundColor = '#161A1E';
            button.style.padding = '8px 16px';
            button.style.border = 'none';
            button.style.borderRadius = '2px';
            button.style.cursor = 'pointer';
            button.style.transition = 'all 0.3s';
            button.addEventListener('mouseover', () => {
                button.style.backgroundColor = '#2a2e39';
                button.style.padding = '10px 18px';
                button.style.borderRadius = '4px';
            });
            button.addEventListener('mouseout', () => {
                button.style.backgroundColor = '#161A1E';
                button.style.padding = '8px 16px';
                button.style.borderRadius = '2px';
            });
            button.onclick = onClick;
            return button;
        }

        const tradingViewButton = createStyledButton('TV', '#007BFF', () => {
            const coinSymbol = window.location.pathname.split('/').pop().split('_')[1];
            if (coinSymbol) {
                window.open(`https://www.tradingview.com/chart/Kb1uNw2E/?symbol=BYBIT:${coinSymbol}.P`, '_blank');
            } else {
                alert("Не удалось определить символ монеты.");
            }
        });

        const bybitButton = createStyledButton('BB', '#FFB11A', () => {
            const coinSymbol = window.location.pathname.split('/').pop().split('_')[1];
            if (coinSymbol) {
                window.open(`https://www.bybit.com/trade/usdt/${coinSymbol}`, '_blank');
            } else {
                alert("Не удалось определить символ монеты.");
            }
        });

        buttonContainer.appendChild(tradingViewButton);
        buttonContainer.appendChild(bybitButton);
        document.body.appendChild(buttonContainer);
    }

    // Main execution
    window.onload = function () {
        waitForElement("/html/body/div/main/div[1]/div", targetDiv => {
            createIframeButtons(targetDiv);
        });

        createTradingButtons();
        monitorCoinName("#__next > main > div.baseBg.tv-head > div > button:nth-child(3)");
    };

    console.log('Enhanced CoinGlass script loaded.');
})();

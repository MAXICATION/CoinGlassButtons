// ==UserScript==
// @name         ❤️CoinGlass Iframe Buttons
// @namespace    http://tampermonkey.net/
// @version      3.4
// @description  Adds buttons to open/close iframes with specific websites and perform auto-search within the LQ_HM iframe with toggle functionality and repeated search on reopening.
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

    // Функция для создания кнопки
    function createButton(text, color, textColor, onClick) {
        let button = document.createElement('button');
        button.innerText = text;
        button.classList.add('MuiButtonBase-root', 'css-1jhxbfy');
        if (color) button.style.backgroundColor = color;
        if (textColor) button.style.color = textColor;
        button.onclick = onClick;
        return button;
    }

    // Функция для переключения iframe
    function toggleIframe(url, coinName) {
        // Проверяем, существует ли iframe
        if (!iframes[url]) {
            // Создаем iframe
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

            // После загрузки iframe выполняем поиск
            iframe.onload = () => injectLQHMSearch(iframe, coinName);
        } else {
            // Если iframe уже существует, переключаем видимость
            const iframe = iframes[url];
            if (iframe.style.display === 'none') {
                iframe.style.display = 'block'; // Показываем iframe
                injectLQHMSearch(iframe, coinName); // Выполняем поиск заново
            } else {
                iframe.style.display = 'none'; // Скрываем iframe
            }
        }

        // Скрываем все остальные iframe
        Object.keys(iframes).forEach(key => {
            if (key !== url && iframes[key]) {
                iframes[key].style.display = 'none';
            }
        });
    }

    // Автопоиск в LQ_HM
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
                    }, 700);
                } else {
                    console.error('Search input not found');
                }
            }
            setTimeout(performSearch, 200);
        })();`;

        iframe.contentWindow.eval(searchScript);
    }

    // Извлечение второго слова
    function extractCoinName(text) {
        const parts = text.split(' ');
        return parts.length > 1 ? parts[1].trim() : null;
    }

    // Функция для отслеживания изменений через setInterval
    function monitorCoinName(selector) {
        setInterval(() => {
            const targetNode = document.querySelector(selector);
            if (!targetNode) return;

            const newCoinName = extractCoinName(targetNode.innerText);
            if (newCoinName && newCoinName !== currentCoinName) {
                console.log(`Coin changed: ${currentCoinName} -> ${newCoinName}`);
                currentCoinName = newCoinName;
            }
        }, 500); // Проверяем каждые 500 мс
    }

    // Создание кнопок для работы с iframe
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

    // Ожидание появления элемента
    function waitForElement(xpath, callback) {
        const interval = setInterval(() => {
            const targetDiv = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            if (targetDiv) {
                clearInterval(interval);
                callback(targetDiv);
            }
        }, 500);
    }

    window.onload = function () {
        waitForElement("/html/body/div/main/div[1]/div", targetDiv => {
            createIframeButtons(targetDiv);
        });

        // Запускаем мониторинг изменений в селекторе через setInterval
        monitorCoinName("#__next > main > div.baseBg.tv-head > div > button:nth-child(3)");
    };

    console.log('Script with toggle and repeated search for LQ_HM loaded.');
})();

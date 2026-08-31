import { BasePlugin } from '../core/base-plugin.js';
import { __publicField } from '../core/constants.js';
import { GM_xmlhttpRequest } from 'vite-plugin-monkey/dist/client';

function showCopiedFeedback($btn) {
    const originalText = $btn.text();
    $btn.addClass("copied").text("已复制");
    setTimeout((() => {
        $btn.removeClass("copied").text(originalText);
    }), 2e3);
}

function fallbackCopy(text, $btn) {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand("copy");
        showCopiedFeedback($btn);
    } catch (err) {
        console.error("复制失败:", err);
        alert("复制失败，请手动复制链接");
    }
    document.body.removeChild(textarea);
}

function parseSize(sizeStr) {
    if (!sizeStr || sizeStr === "未知") return 0;
    const match = sizeStr.match(/^([\d.]+)\s*(GiB|MiB|KiB|TiB|GB|MB|KB|TB|B)/i);
    if (!match) return 0;
    const num = parseFloat(match[1]);
    const unit = match[2].toUpperCase().replace("I", "");
    const multipliers = {B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776};
    return num * (multipliers[unit] || 1);
}

function parseDate(dateStr) {
    if (!dateStr || dateStr === "未知") return 0;
    const ts = Date.parse(dateStr);
    return isNaN(ts) ? 0 : ts;
}

class MagnetHubPlugin extends BasePlugin {
    constructor() {
        super(...arguments);
        __publicField(this, "currentEngine", null);
        __publicField(this, "searchEngines", [ {
            name: "U9A9",
            id: "u9a9",
            url: "https://u9a9.com/?type=2&search={keyword}",
            targetPage: "https://u9a9.com/?type=2&search={keyword}",
            parseHtml: this.parseU3C3
        }, {
            name: "U3C3",
            id: "u3c3",
            url: "https://u3c3.com/?search2=a8lr16lo&search={keyword}",
            targetPage: "https://u3c3.com/?search2=a8lr16lo&search={keyword}",
            parseHtml: this.parseU3C3
        }, {
            name: "Sukebei",
            id: "Sukebei",
            url: "https://sukebei.nyaa.si/?f=0&c=0_0&q={keyword}",
            targetPage: "https://sukebei.nyaa.si/?f=0&c=0_0&q={keyword}",
            parseHtml: this.parseSukebei
        } ]);
    }
    getName() {
        return "MagnetHubPlugin";
    }
    async initCss() {
        return "\n            <style>\n                .magnet-container {\n                    margin: 20px auto;\n                    width: 100%;\n                    font-family: Arial, sans-serif;\n                }\n                .magnet-tabs {\n                    display: flex;\n                    border-bottom: 1px solid #ddd;\n                    margin-bottom: 15px;\n                    justify-content: space-between;\n                }\n                .magnet-tab {\n                    padding: 5px 12px;\n                    cursor: pointer;\n                    border: 1px solid transparent;\n                    border-bottom: none;\n                    margin-right: 5px;\n                    background: #f5f5f5;\n                    border-radius: 5px 5px 0 0;\n                }\n                .magnet-tab.active {\n                    background: #fff;\n                    border-color: #ddd;\n                    border-bottom: 1px solid #fff;\n                    margin-bottom: -1px;\n                    font-weight: bold;\n                }\n                .magnet-tab:hover:not(.active) {\n                    background: #e9e9e9;\n                }\n                \n                .magnet-results {\n                    min-height: 200px;\n                }\n                .magnet-result {\n                    padding: 15px;\n                    border-bottom: 1px solid #eee;\n                    position: relative; \n                }\n                .magnet-result:hover {\n                    background-color: #f9f9f9;\n                }\n                .magnet-title {\n                    font-weight: bold;\n                    margin-bottom: 5px;\n                    white-space: nowrap;\n                    overflow: hidden; \n                    text-overflow: ellipsis;\n                    padding-right: 80px; \n                }\n                .magnet-info {\n                    display: flex;\n                    justify-content: space-between;\n                    font-size: 12px;\n                    color: #666;\n                    margin-bottom: 5px;\n                }\n                .magnet-loading {\n                    text-align: center;\n                    padding: 20px;\n                }\n                .magnet-error {\n                    color: #f44336;\n                    padding: 10px;\n                }\n                \n                .magnet-copy {\n                    position: absolute;\n                    right: 15px;\n                    top: 12px;\n                }\n                .magnet-hub-btn {\n                    background-color: #f0f0f0;\n                    color: #555;\n                    border: 1px solid #ddd;\n                    padding: 3px 8px;\n                    border-radius: 3px;\n                    cursor: pointer;\n                    font-size: 12px;\n                    transition: all 0.2s;\n                    margin-left: 10px;\n                }\n                .magnet-hub-btn:hover {\n                    background-color: #e0e0e0;\n                    border-color: #ccc;\n                }\n                .magnet-hub-btn.copied {\n                    background-color: #4CAF50;\n                    color: white;\n                    border-color: #4CAF50;\n                }\n            </style>\n        ";
    }
    createMagnetHub(keyword) {
        keyword = keyword.replace("FC2-", "");
        const $container = $('<div class="magnet-container"></div>'), $tabs = $('<div class="magnet-tabs"></div>'), key = "jhs_magnetHub_selectedEngine", savedEngineId = localStorage.getItem(key);
        let defaultEngineIndex = 0;
        const $tabBox = $('<div style="display: flex;"></div>');
        this.searchEngines.forEach(((engine, index) => {
            const $tab = $(`<div class="magnet-tab" data-engine="${engine.id}">${engine.name}</div>`);
            if (savedEngineId && engine.id === savedEngineId) {
                $tab.addClass("active");
                this.currentEngine = engine;
                defaultEngineIndex = index;
            } else if (0 === index && !savedEngineId) {
                $tab.addClass("active");
                this.currentEngine = engine;
            }
            $tabBox.append($tab);
        }));
        $tabs.append($tabBox);
        $tabs.append(`<a style="margin-right: 20px;margin-top:3px" id="targetBox" href="${this.currentEngine.targetPage.replace("{keyword}", encodeURIComponent(keyword))}" target="_blank">原网页</a>`);
        $container.append($tabs);
        const $resultsContainer = $('<div class="magnet-results"></div>');
        $container.append($resultsContainer);
        $container.on("click", ".magnet-tab", (e => {
            const engineId = $(e.target).data("engine");
            this.currentEngine = this.searchEngines.find((engine => engine.id === engineId));
            $("#targetBox").attr("href", this.currentEngine.targetPage.replace("{keyword}", encodeURIComponent(keyword)));
            localStorage.setItem(key, engineId);
            $container.find(".magnet-tab").removeClass("active");
            $(e.target).addClass("active");
            this.searchEngine($resultsContainer, this.currentEngine, keyword);
        }));
        $container.on("click", ".copy-btn", function () {
            const $btn = $(this), magnet = $btn.data("magnet");
            navigator.clipboard ? navigator.clipboard.writeText(magnet).then((() => {
                showCopiedFeedback($btn);
            })).catch((() => {
                fallbackCopy(magnet, $btn);
            })) : fallbackCopy(magnet, $btn);
        });
        $container.on("click", ".down-115", (async event => {
            event.stopPropagation();
            const magnet = $(event.currentTarget).data("magnet");
            let loadObj = loading();
            try {
                await this.getBean("WangPan115TaskPlugin").handleAddTask(magnet);
            } catch (e) {
                show.error("发生错误:" + e);
                console.error(e);
            } finally {
                loadObj.close();
            }
        }));
        this.searchEngine($resultsContainer, this.currentEngine || this.searchEngines[defaultEngineIndex], keyword);
        return $container;
    }
    searchEngine($container, engine, keyword) {
        $container.html(`<div class="magnet-loading">正在从 ${engine.name} 搜索 "${keyword}"...</div>`);
        const cacheKey = `${engine.name}_${keyword}`;
        sessionStorage.getItem(cacheKey);
        const url = engine.url.replace("{keyword}", encodeURIComponent(keyword));
        engine.parseHtml && GM_xmlhttpRequest({
            method: "GET",
            url: url,
            onload: response => {
                try {
                    const results = engine.parseHtml.call(this, response.responseText, keyword);
                    results.length > 0 && sessionStorage.setItem(cacheKey, JSON.stringify(results));
                    this.displayResults($container, results, engine.name);
                } catch (e) {
                    $container.html(`<div class="magnet-error">解析 ${engine.name} 结果失败: ${e.message}</div>`);
                }
            },
            onerror: error => {
                $container.html(`<div class="magnet-error">从 ${engine.name} 获取数据失败: ${error.statusText}</div>`);
            }
        });
        engine.parseJson && engine.parseJson.call(this, $container, engine, keyword, cacheKey);
    }
    displayResults($container, results, engineName) {
        $container.empty();
        if (0 !== results.length) {
            results.sort((a, b) => {
                const sizeA = parseSize(a.size), sizeB = parseSize(b.size);
                if (sizeB !== sizeA) return sizeB - sizeA;
                const dateA = parseDate(a.date), dateB = parseDate(b.date);
                return dateB - dateA;
            });
            results.forEach((result => {
                const $result = $(`\n                <div class="magnet-result">\n                    <div class="magnet-title"><a href="${result.magnet}">${result.title}</a></div>\n                    <div class="magnet-info">\n                        <span>大小: ${result.size || "未知"}</span>\n                        <span>日期: ${result.date || "未知"}</span>\n                    </div>\n                    <div class="magnet-copy">\n                        <button class="magnet-hub-btn copy-btn" data-magnet="${result.magnet}">复制链接</button>\n                        <button class="magnet-hub-btn down-115" data-magnet="${result.magnet}">115离线下载</button>\n                    </div>\n                </div>\n            `);
                $container.append($result);
            }));
        } else $container.append('<div class="magnet-error">没有找到相关结果</div>');
    }
    parseBTSOW($container, engine, keyword, cacheKey) {
        const _this = this;
        GM_xmlhttpRequest({
            method: "POST",
            url: engine.url,
            headers: {
                "Content-Type": "application/json"
            },
            data: `[{"search":"${keyword}"},50,1]`,
            onload: response => {
                try {
                    const dataList = JSON.parse(response.responseText).data, results = [];
                    for (let i = 0; i < dataList.length; i++) {
                        let item = dataList[i];
                        results.push({
                            title: item.name,
                            magnet: "magnet:?xt=urn:btih:" + item.hash,
                            size: (item.size / 1073741824).toFixed(2) + " GB",
                            date: utils.formatDate(new Date(1e3 * item.lastUpdateTime))
                        });
                    }
                    results.length > 0 && sessionStorage.setItem(cacheKey, JSON.stringify(results));
                    _this.displayResults($container, results, engine.name);
                } catch (e) {
                    $container.html(`<div class="magnet-error">解析 ${engine.name} 结果失败: ${e.message}</div>`);
                }
            },
            onerror: error => {
                $container.html(`<div class="magnet-error">从 ${engine.name} 获取数据失败: ${error.statusText}</div>`);
            }
        });
    }
    parseU3C3(html, keyword) {
        const $dom = utils.htmlTo$dom(html), results = [];
        $dom.find(".torrent-list tbody tr").each(((i, el) => {
            const $el = $(el);
            if ($el.text().includes("置顶")) return;
            const title = $el.find("td:nth-child(2) a").attr("title") || $el.find("td:nth-child(2) a").text().trim();
            if (!title.toLowerCase().includes(keyword.toLowerCase())) return;
            const magnet = $el.find("td:nth-child(3) a[href^='magnet:']").attr("href"), size = $el.find("td:nth-child(4)").text().trim(), date = $el.find("td:nth-child(5)").text().trim();
            magnet && results.push({
                title: title,
                magnet: magnet,
                size: size,
                date: date
            });
        }));
        return results;
    }
    parseSukebei(html, keyword) {
        const $dom = utils.htmlTo$dom(html), results = [];
        $dom.find(".torrent-list tbody tr").each(((i, el) => {
            const $el = $(el);
            if ($el.text().includes("置顶")) return;
            const title = $el.find("td:nth-child(2) a").attr("title") || $el.find("td:nth-child(2) a").text().trim();
            if (!title.toLowerCase().includes(keyword.toLowerCase())) return;
            const magnet = $el.find("td:nth-child(3) a[href^='magnet:']").attr("href"), size = $el.find("td:nth-child(4)").text().trim(), date = $el.find("td:nth-child(5)").text().trim();
            magnet && results.push({
                title: title,
                magnet: magnet,
                size: size,
                date: date
            });
        }));
        return results;
    }
}


export { MagnetHubPlugin };
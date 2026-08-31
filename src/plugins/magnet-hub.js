import {BasePlugin} from '../core/base-plugin.js';
import {__publicField} from '../core/constants.js';
import {GM_xmlhttpRequest} from 'vite-plugin-monkey/dist/client';

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
    const match = String(sizeStr).replace(/,/g, '').match(/([\d.]+)\s*(TiB|GiB|MiB|KiB|TB|GB|MB|KB|B)?/i);
    if (!match) return 0;
    const num = parseFloat(match[1]);
    const unit = (match[2] || 'B').toUpperCase();
    const multipliers = {
        TIB: 1099511627776,
        TB: 1099511627776,
        GIB: 1073741824,
        GB: 1073741824,
        MIB: 1048576,
        MB: 1048576,
        KIB: 1024,
        KB: 1024,
        B: 1
    };
    return Number.isFinite(num) ? num * (multipliers[unit] || 1) : 0;
}

function parseDate(dateStr) {
    if (!dateStr || dateStr === "未知") return 0;
    const ts = Date.parse(dateStr.replace(/\//g, '-'));
    return isNaN(ts) ? 0 : ts;
}

function formatMagnetDate(dateStr) {
    if (!dateStr) return '';
    const match = String(dateStr).match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (match) return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
    const ts = parseDate(dateStr);
    return ts ? new Date(ts).toISOString().slice(0, 10) : dateStr;
}

function classifyQuality(title) {
    const text = String(title || '').replace(/【[^】]*(?:APP|夸克|UC搜|(?:[a-z0-9-]+\.)+(?:com|net|org|cc|sbs|top))[^】]*】/gi, ' ');
    const hasCJK = /[\u4e00-\u9fff]/.test(text);
    const hasJP = /[\u3040-\u309f\u30a0-\u30ff]/.test(text);
    const isChinese = /(?:[^A-Za-z]|^)FHDC(?:[^A-Za-z]|$)/i.test(text)
        || /[-_](?:UC|CH?)(?:[^A-Za-z]|$)/.test(text)
        || /(?:\u4e2d\u5b57|\u4e2d\u6587|\u5b57\u5e55|\u4e2d\u6587\u5b57\u5e55|\u7e41\u9ad4\u4e2d\u5b57|\u7e41\u4f53\u4e2d\u5b57|\u7e41\u9ad4\u4e2d\u6587|\u7e41\u4f53\u4e2d\u6587|\u7e41\u9ad4\u5b57\u5e55|\u7e41\u4f53\u5b57\u5e55|\u7e41\u4e2d|\u7e41\u5b57|\u81ea\u63d0|\u5f81\u7528|\u5fb5\u7528|\u6f22\u5316|\u6c49\u5316|\u5167\u5d4c|\u5185\u5d4c|\u5167\u5c01|\u5185\u5c01|\u96d9\u8a9e|\u53cc\u8bed)/.test(text)
        || (hasCJK && !hasJP);
    const is4K = /(?:[^A-Za-z0-9]|^)(?:4K(?:UHD)?|2160P)(?:[^A-Za-z0-9]|$)/i.test(text);
    const isCracked = /(?:\u7834\u89e3|\u7834\u574f|\u7834\u58de|\u7834\u58ca|\u65e0\u7801|\u7121\u78bc)/.test(text)
        || /\b(?:uncensored|mosaic)\b/i.test(text);
    return {isChinese, is4K, isCracked};
}

function gmFetch(url, opts = {}) {
    return new Promise((resolve => {
        GM_xmlhttpRequest({
            method: opts.method || "GET",
            url: url,
            headers: opts.headers || {},
            data: opts.data,
            onload: r => {
                resolve({
                    loadstuts: r.status >= 200 && r.status < 300,
                    status: r.status,
                    responseText: r.responseText,
                    finalUrl: r.finalUrl || url
                });
            },
            onerror: () => resolve({loadstuts: false, status: 0, responseText: '', finalUrl: url})
        });
    }));
}

function parseHTML(html) {
    const parser = new DOMParser();
    return parser.parseFromString(html, "text/html");
}

class MagnetHubPlugin extends BasePlugin {
    constructor() {
        super(...arguments);
        __publicField(this, "currentEngine", null);
        __publicField(this, "searchEngines", [
            {
                name: "Sukebei",
                id: "Sukebei",
                url: "https://sukebei.nyaa.si/?f=0&c=0_0&q={keyword}",
                targetPage: "https://sukebei.nyaa.si/?f=0&c=0_0&q={keyword}",
                parseHtml: this.parseSukebei
            }, {
                name: "U9A9",
                id: "u9a9",
                url: "https://u9a9.com/?type=2&search={keyword}",
                targetPage: "https://u9a9.com/?type=2&search={keyword}",
                parseHtml: this.parseU9A9
            }, {
                name: "U3C3",
                id: "u3c3",
                url: "https://u3c3.com/?search={keyword}",
                targetPage: "https://u3c3.com/?search={keyword}",
                parseHtml: this.parseU3C3
            }, {
                name: "BTSearch",
                id: "btsearch",
                url: "https://btsearch.love/api/search?keyword={keyword}&limit=10&offset=0&sort=size&sort_type=desc",
                targetPage: "https://btsearch.love/search?keyword={keyword}",
                parseJson: this.parseBTSearch
            }, {
                name: "SoKitty",
                id: "sokitty",
                url: "https://w1.sokitty.me/search?key={keyword}",
                targetPage: "https://w1.sokitty.me/search?key={keyword}",
                parseHtml: this.parseSokitty
            }, {
                name: "ØMagnet",
                id: "omag",
                url: "https://xn--mag-zna.net/search?q={keyword}",
                targetPage: "https://xn--mag-zna.net/search?q={keyword}",
                parseHtml: this.parseOmag
            }]);
    }

    getName() {
        return "MagnetHubPlugin";
    }

    async initCss() {
        return `
            <style>
                .magnet-container {
                    margin: 20px auto;
                    width: 100%;
                    font-family: Arial, sans-serif;
                }
                .magnet-tabs {
                    display: flex;
                    border-bottom: 1px solid #ddd;
                    margin-bottom: 0;
                    justify-content: space-between;
                    align-items: center;
                }
                .magnet-tab {
                    padding: 6px 12px;
                    cursor: pointer;
                    border: 1px solid transparent;
                    border-bottom: none;
                    margin-right: 3px;
                    background: #f5f5f5;
                    border-radius: 5px 5px 0 0;
                    font-size: 13px;
                    transition: background .16s;
                }
                .magnet-tab.active {
                    background: #fff;
                    border-color: #ddd;
                    border-bottom: 1px solid #fff;
                    margin-bottom: -1px;
                    font-weight: bold;
                }
                .magnet-tab:hover:not(.active) {
                    background: #e9e9e9;
                }
                .magnet-controls {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    background: #fafafa;
                    border-bottom: 1px solid #eee;
                }
                .magnet-sort-select {
                    height: 28px;
                    padding: 2px 20px 2px 6px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    font-size: 12px;
                    color: #333;
                    background: #fff;
                    cursor: pointer;
                }
                .magnet-sort-select:disabled {
                    opacity: .5;
                    cursor: not-allowed;
                }
                .magnet-results {
                    min-height: 200px;
                }
                .magnet-table {
                    width: 100%;
                    border-collapse: collapse;
                    table-layout: fixed;
                    font-size: 13px;
                }
                .magnet-table th {
                    padding: 6px;
                    background: #f8f8f8;
                    border-bottom: 2px solid #e0e0e0;
                    font-weight: 600;
                    color: #555;
                    font-size: 12px;
                    text-align: left;
                }
                .magnet-table th.col-name { max-width: 0; }
                .magnet-table th.col-size { width: 70px; text-align: center; }
                .magnet-table th.col-date { width: 90px; text-align: center; }
                .magnet-table th.col-actions { width: 180px; text-align: center; }
                .magnet-table td {
                    padding: 8px 6px;
                    border-bottom: 1px solid #eee;
                    vertical-align: middle;
                }
                .magnet-table tr:hover td {
                    background-color: #f9f9f9;
                }
                .magnet-table td.col-size { text-align: center; white-space: nowrap; }
                .magnet-table td.col-date { text-align: center; white-space: nowrap; font-size: 12px; color: #888; }
                .magnet-table td.col-actions { text-align: center; white-space: nowrap; }
                .magnet-name-cell {
                    display: flex;
                    align-items: center;
                    gap: 5px;
                    min-width: 0;
                    overflow: hidden;
                }
                .magnet-name-cell > a {
                    flex: 1 1 auto;
                    min-width: 0;
                    display: block;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                    color: #243b67;
                    font-weight: 650;
                    text-decoration: none;
                    line-height: 1.5;
                }
                .magnet-name-cell > a:hover {
                    color: #1d4ed8;
                    text-decoration: underline;
                }
                .magnet-badge {
                    display: inline-flex;
                    align-items: center;
                    flex-shrink: 0;
                    padding: 1px 5px;
                    border-radius: 3px;
                    font-size: 11px;
                    font-weight: 800;
                    line-height: 1.5;
                    color: #fff;
                }
                .magnet-badge.mg-subtitle { background: #16a34a; }
                .magnet-badge.mg-four-k { background: #2563eb; }
                .magnet-badge.mg-cracked { background: #be123c; }
                .magnet-loading {
                    text-align: center;
                    padding: 20px;
                    color: #666;
                }
                .magnet-error {
                    color: #f44336;
                    padding: 10px;
                }
                .magnet-empty {
                    text-align: center;
                    padding: 20px;
                    color: #999;
                }
                .magnet-empty a {
                    color: #e74c3c;
                    font-weight: bold;
                    cursor: pointer;
                }
                .magnet-hub-btn {
                    background-color: #f0f0f0;
                    color: #555;
                    border: 1px solid #ddd;
                    padding: 5px 10px;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 12px;
                    transition: all 0.2s;
                    margin-left: 4px;
                }
                .magnet-hub-btn:hover {
                    background-color: #e0e0e0;
                    border-color: #ccc;
                }
                .magnet-hub-btn.copied {
                    background-color: #4CAF50;
                    color: white;
                    border-color: #4CAF50;
                }
                .magnet-hub-btn.check-btn {
                    color: #be185d;
                    border-color: #fecdd3;
                    background: #fff1f2;
                }
                .magnet-hub-btn.check-btn:hover {
                    background: #ffe4e6;
                    border-color: #fda4af;
                }
                .magnet-hub-btn.down-btn {
                    color: #137553;
                    border-color: #b7ddce;
                    background: #effaf5;
                }
                .magnet-hub-btn.down-btn:hover {
                    background: #e3f6ed;
                    border-color: #8ac9b3;
                }
                .magnet-hub-btn.copy-btn {
                    color: #4b3d87;
                    border-color: #d0c7ee;
                    background: #f6f4ff;
                }
                .magnet-hub-btn.copy-btn:hover {
                    background: #eeebff;
                    border-color: #b9aae5;
                }
                .whatslink-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 2147483700;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 22px;
                    background: rgba(15,23,42,.66);
                    backdrop-filter: blur(8px);
                }
                .whatslink-modal {
                    position: relative;
                    width: min(1140px, calc(100vw - 36px));
                    max-width: 1140px;
                    max-height: calc(100vh - 36px);
                    background: transparent;
                    border: 0;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                }
                .whatslink-gallery-scene {
                    display: grid;
                    grid-template-rows: minmax(0, 1fr) auto auto;
                    row-gap: 3px;
                    width: 100%;
                    align-items: center;
                    justify-items: center;
                }
                .whatslink-gallery-visual {
                    position: relative;
                    z-index: 1;
                    width: 100%;
                    display: grid;
                    place-items: center;
                    overflow: hidden;
                }
                .whatslink-gallery-hero {
                    width: 100%;
                    height: 100%;
                    min-height: 0;
                    object-fit: contain;
                    display: block;
                }
                .whatslink-gallery-close {
                    position: absolute;
                    top: 12px;
                    right: 14px;
                    z-index: 4;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border: 0;
                    border-radius: 50%;
                    color: #fff;
                    background: rgba(42,45,49,.76);
                    cursor: pointer;
                    padding: 0 0 2px;
                    font-family: Arial, sans-serif;
                    font-size: 23px;
                    line-height: 1;
                }
                .whatslink-gallery-close:hover { background: rgba(22,25,28,.92); }
                .whatslink-gallery-arrow {
                    position: absolute;
                    top: 50%;
                    z-index: 3;
                    width: 34px;
                    height: 34px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transform: translateY(-50%);
                    border: 0;
                    border-radius: 50%;
                    color: #fff;
                    background: rgba(38,42,45,.76);
                    cursor: pointer;
                    padding: 0 0 3px;
                    font-family: Arial, sans-serif;
                    font-size: 27px;
                    line-height: 1;
                }
                .whatslink-gallery-arrow:hover { background: rgba(22,25,28,.92); }
                .whatslink-gallery-prev { left: 16px; }
                .whatslink-gallery-next { right: 16px; }
                .whatslink-gallery-info {
                    position: relative;
                    z-index: 3;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 4px 10px;
                    border-radius: 4px;
                    color: #fff;
                    background: rgba(38,40,42,.68);
                    font: 11px ui-monospace, SFMono-Regular, Consolas, monospace;
                    white-space: nowrap;
                }
                .whatslink-gallery-info span + span::before { content: " · "; margin-right: 8px; color: rgba(255,255,255,.42); }
                .whatslink-gallery-thumbs {
                    position: relative;
                    z-index: 3;
                    display: flex;
                    justify-content: center;
                    gap: 3px;
                    max-width: 100%;
                    padding: 3px;
                    border-radius: 4px;
                    background: rgba(29,31,34,.68);
                }
                .whatslink-gallery-thumb {
                    width: 88px;
                    height: 50px;
                    padding: 0;
                    overflow: hidden;
                    border: 2px solid transparent;
                    border-radius: 3px;
                    background: transparent;
                    cursor: pointer;
                }
                .whatslink-gallery-thumb.active { border-color: #e3a05b; }
                .whatslink-gallery-thumb img { width: 100%; height: 100%; display: block; object-fit: cover; }
                .whatslink-gallery-empty {
                    position: absolute;
                    z-index: 2;
                    display: none;
                    width: min(420px, 72%);
                    text-align: center;
                    color: rgba(255,255,255,.74);
                }
                .whatslink-modal.no-shots .whatslink-gallery-empty { display: block; }
                .whatslink-modal.no-shots .whatslink-gallery-visual { height: min(460px, calc(100vh - 100px)); }
                .whatslink-modal.no-shots .whatslink-gallery-hero,
                .whatslink-modal.no-shots .whatslink-gallery-arrow,
                .whatslink-modal.no-shots .whatslink-gallery-thumbs { display: none; }
                .whatslink-gallery-empty-icon {
                    width: 56px;
                    height: 56px;
                    margin: 0 auto 14px;
                    display: grid;
                    place-items: center;
                    border: 1px solid rgba(255,255,255,.24);
                    border-radius: 50%;
                    color: #e3a05b;
                    font-size: 24px;
                }
                .whatslink-gallery-empty-title { margin-bottom: 7px; color: #fff; font-size: 17px; font-weight: 800; }
                .whatslink-gallery-empty-text { margin: 0; font-size: 13px; line-height: 1.6; }
                .whatslink-loading { padding: 28px; text-align: center; color: #475569; font-size: 14px; }
            </style>
        `;
    }

    createMagnetHub(keyword) {
        keyword = keyword.replace("FC2-", "");
        const $container = $('<div class="magnet-container"></div>');
        const $tabs = $('<div class="magnet-tabs"></div>');
        const key = "jhs_magnetHub_selectedEngine";
        const savedEngineId = localStorage.getItem(key);
        let defaultEngineIndex = 0;
        const $tabBox = $('<div style="display: flex; align-items: center;"></div>');
        this.searchEngines.forEach(((engine, index) => {
            const $tab = $(`<div class="magnet-tab" data-engine="${engine.id}">${engine.name}</div>`);
            if (savedEngineId && engine.id === savedEngineId) {
                $tab.addClass("active");
                this.currentEngine = engine;
                defaultEngineIndex = index;
            } else if (!savedEngineId && engine.id === "Sukebei") {
                $tab.addClass("active");
                this.currentEngine = engine;
            }
            $tabBox.append($tab);
        }));
        const sortMode = localStorage.getItem("jhs_magnetSort") || "size";
        const $sortSelect = $(`<select class="magnet-sort-select" disabled style="margin-left:auto;margin-right:4px;">
            <option value="size" ${sortMode === "size" ? "selected" : ""}>按大小</option>
            <option value="newest" ${sortMode === "newest" ? "selected" : ""}>按最新</option>
            <option value="oldest" ${sortMode === "oldest" ? "selected" : ""}>按最旧</option>
        </select>`);
        $tabBox.append($sortSelect);
        $tabs.append($tabBox);
        $tabs.append(`<a style="margin-right: 20px;margin-top:3px" id="targetBox" href="${this.currentEngine.targetPage.replace("{keyword}", encodeURIComponent(keyword))}" target="_blank">原网页</a>`);
        $container.append($tabs);

        const $resultsContainer = $('<div class="magnet-results"></div>');
        $container.append($resultsContainer);

        $container.on("click", ".magnet-tab", (e => {
            const engineId = $(e.target).data("engine");
            this.currentEngine = this.searchEngines.find((engine => engine.id === engineId));
            this.resolveUrl(this.currentEngine, keyword).then((url => {
                $("#targetBox").attr("href", url);
            }));
            localStorage.setItem(key, engineId);
            $container.find(".magnet-tab").removeClass("active");
            $(e.target).addClass("active");
            this.searchEngine($resultsContainer, $sortSelect, this.currentEngine, keyword);
        }));

        $sortSelect.on("change", () => {
            localStorage.setItem("jhs_magnetSort", $sortSelect.val());
            RerenderSort($resultsContainer, $sortSelect.val());
        });

        $container.on("click", ".copy-btn", function () {
            const $btn = $(this), magnet = $btn.data("magnet");
            const dnCode = $btn.data("dncode") || '';
            const magWithDn = magnet + (dnCode ? `&dn=${encodeURIComponent(dnCode)}` : '');
            navigator.clipboard ? navigator.clipboard.writeText(magWithDn).then((() => {
                showCopiedFeedback($btn);
            })).catch((() => {
                fallbackCopy(magWithDn, $btn);
            })) : fallbackCopy(magWithDn, $btn);
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

        $container.on("click", ".check-btn", (async event => {
            event.stopPropagation();
            const magnet = $(event.currentTarget).data("magnet");
            this.checkWhatslink(magnet);
        }));

        this.searchEngine($resultsContainer, $sortSelect, this.currentEngine || this.searchEngines[defaultEngineIndex], keyword);
        this.resolveUrl(this.currentEngine || this.searchEngines[defaultEngineIndex], keyword).then((url => {
            $("#targetBox").attr("href", url);
        }));
        return $container;
    }

    searchEngine($container, $sortSelect, engine, keyword) {
        $container.html(`<div class="magnet-loading">正在从 ${engine.name} 搜索 "${keyword}"...</div>`);
        const cacheKey = `${engine.name}_${keyword}`;
        sessionStorage.getItem(cacheKey);
        this.resolveUrl(engine, keyword).then((url => {
            const requestOpts = {method: "GET", url: url};
            if (engine.parseHtml) {
                GM_xmlhttpRequest(Object.assign(requestOpts, {
                    method: "GET",
                    url: url,
                    onload: async response => {
                        try {
                            const results = await engine.parseHtml.call(this, response.responseText, keyword);
                            results.length > 0 && sessionStorage.setItem(cacheKey, JSON.stringify(results));
                            $container.data("_magnetData", results);
                            $sortSelect.prop("disabled", results.length === 0);
                            this.displayResults($container, results, engine.name);
                        } catch (e) {
                            $container.html(`<div class="magnet-error">解析 ${engine.name} 结果失败: ${e.message}</div>`);
                        }
                    },
                    onerror: error => {
                        $container.html(`<div class="magnet-error">从 ${engine.name} 获取数据失败: ${error.statusText}</div>`);
                    }
                }));
            }
            if (engine.parseJson) {
                engine.parseJson.call(this, $container, $sortSelect, engine, keyword, cacheKey);
            }
        }));
    }

    displayResults($container, results, engineName) {
        $container.empty();
        const sortMode = localStorage.getItem("jhs_magnetSort") || "size";
        if (0 !== results.length) {
            results = this.sortMagnetData(results, sortMode);
            const $table = $(`<table class="magnet-table">
                <thead><tr>
                    <th class="col-name">名称</th>
                    <th class="col-size">大小</th>
                    <th class="col-date">日期</th>
                    <th class="col-actions">操作</th>
                </tr></thead>
                <tbody></tbody>
            </table>`);
            const $tbody = $table.find("tbody");
            results.forEach((result => {
                const quality = classifyQuality(result.title);
                let badges = '';
                if (quality.is4K) badges += '<span class="magnet-badge mg-four-k">4K</span>';
                if (quality.isChinese) badges += '<span class="magnet-badge mg-subtitle">中字</span>';
                if (quality.isCracked) badges += '<span class="magnet-badge mg-cracked">破解</span>';
                const displayDate = formatMagnetDate(result.date);
                const dnCode = extractCode(result.title);
                const $row = $(`<tr>
                    <td>
                        <div class="magnet-name-cell">
                            ${badges}
                            <a href="${result.magnet}" title="${result.title}">${result.title}</a>
                        </div>
                    </td>
                    <td class="col-size">${result.size || '未知'}</td>
                    <td class="col-date">${displayDate || '未知'}</td>
                    <td class="col-actions">
                        <button class="magnet-hub-btn copy-btn" data-magnet="${result.magnet}" data-dncode="${dnCode || ''}">复制</button>
                        <button class="magnet-hub-btn check-btn" data-magnet="${result.magnet}">验车</button>
                        <button class="magnet-hub-btn down-btn down-115" data-magnet="${result.magnet}">115离线</button>
                    </td>
                </tr>`);
                $tbody.append($row);
            }));
            $container.append($table);
        } else {
            $container.append(`<div class="magnet-empty">无搜索结果 <a id="retrySearch" href="#">🔄 刷新</a></div>`);
            $("#retrySearch").on("click", (e => {
                e.preventDefault();
                this.searchEngine($container, $container.closest(".magnet-container").find(".magnet-sort-select"), this.currentEngine, this.currentKeyword);
            }));
        }
    }

    sortMagnetData(data, mode) {
        return [...data].sort((a, b) => {
            const sizeDelta = parseSize(b.size) - parseSize(a.size);
            if (mode === 'size') return sizeDelta;
            const aTime = parseDate(a.date);
            const bTime = parseDate(b.date);
            if (!aTime && !bTime) return sizeDelta;
            if (!aTime) return 1;
            if (!bTime) return -1;
            const timeDelta = mode === 'oldest' ? aTime - bTime : bTime - aTime;
            return timeDelta || sizeDelta;
        });
    }

    async resolveUrl(engine, keyword) {
        return engine.url.replace("{keyword}", encodeURIComponent(keyword));
    }

    async checkWhatslink(magnet) {
        document.querySelector('.whatslink-overlay')?.remove();
        const overlay = document.createElement('div');
        overlay.className = 'whatslink-overlay';
        overlay.innerHTML = '<div class="whatslink-modal no-shots"><div class="whatslink-loading">正在验车...</div></div>';
        document.body.appendChild(overlay);
        try {
            const url = `https://whatslink.info/api/v1/link?url=${encodeURIComponent(magnet)}`;
            const r = await gmFetch(url, {timeout: 20000});
            if (!r.loadstuts) throw new Error('WhatsLink 请求失败');
            const data = JSON.parse(r.responseText || '{}');
            overlay.remove();
            this.showWhatslinkModal(data, magnet);
        } catch (e) {
            overlay.remove();
            this.showWhatslinkModal({
                error: e.message || '查询失败',
                name: '查询失败',
                type: '-',
                file_type: '-',
                size: 0,
                count: '-',
                screenshots: []
            }, magnet);
        }
    }

    showWhatslinkModal(payload, magnet) {
        document.querySelector('.whatslink-overlay')?.remove();
        const shots = Array.isArray(payload?.screenshots) ? payload.screenshots.map(item => item?.screenshot).filter(Boolean) : [];
        let index = 0;
        const resourceName = payload?.name || '未知资源';
        const resourceCount = payload?.count ?? '-';
        const overlay = document.createElement('div');
        overlay.className = 'whatslink-overlay';
        const modal = document.createElement('section');
        modal.className = `whatslink-modal${shots.length ? '' : ' no-shots'}`;
        modal.innerHTML = `<div class="whatslink-gallery-scene">
            <div class="whatslink-gallery-visual">
                <button class="whatslink-gallery-close" type="button" aria-label="关闭">×</button>
                <button class="whatslink-gallery-arrow whatslink-gallery-prev" type="button" aria-label="上一张">‹</button>
                <img class="whatslink-gallery-hero" alt="截图预览">
                <button class="whatslink-gallery-arrow whatslink-gallery-next" type="button" aria-label="下一张">›</button>
                <div class="whatslink-gallery-empty">
                    <div class="whatslink-gallery-empty-icon">?</div>
                    <div class="whatslink-gallery-empty-title">暂无截图</div>
                    <p class="whatslink-gallery-empty-text">当前资源没有可展示的截图，可以结合资源名称和文件数量判断。</p>
                </div>
            </div>
            <div class="whatslink-gallery-info">
                <span class="whatslink-gallery-name"></span>
                <span class="whatslink-gallery-count"></span>
                <span class="whatslink-gallery-index"></span>
            </div>
            <div class="whatslink-gallery-thumbs"></div>
        </div>`;
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        modal.querySelector('.whatslink-gallery-name').textContent = resourceName;
        modal.querySelector('.whatslink-gallery-count').textContent = `${resourceCount} 个文件`;
        const visual = modal.querySelector('.whatslink-gallery-visual');
        const hero = modal.querySelector('.whatslink-gallery-hero');
        const thumbs = modal.querySelector('.whatslink-gallery-thumbs');
        const currentIndex = modal.querySelector('.whatslink-gallery-index');
        const closeButton = modal.querySelector('.whatslink-gallery-close');
        const prevButton = modal.querySelector('.whatslink-gallery-prev');
        const nextButton = modal.querySelector('.whatslink-gallery-next');
        const sizeGallery = () => {
            if (!shots.length || !hero.naturalWidth || !hero.naturalHeight) return;
            const infoHeight = modal.querySelector('.whatslink-gallery-info').offsetHeight || 23;
            const thumbsHeight = thumbs.offsetHeight || 58;
            const maxHeight = Math.max(180, window.innerHeight - 36 - infoHeight - thumbsHeight - 6);
            const maxWidth = modal.clientWidth;
            const ratio = hero.naturalWidth / hero.naturalHeight;
            const height = Math.min(maxHeight, maxWidth / ratio);
            const width = height * ratio;
            visual.style.width = `${width}px`;
            visual.style.height = `${height}px`;
        };
        const positionControls = () => {
            if (!shots.length || !hero.naturalWidth || !hero.naturalHeight) return;
            const width = visual.clientWidth;
            const height = visual.clientHeight;
            const scale = Math.min(width / hero.naturalWidth, height / hero.naturalHeight);
            const imageWidth = hero.naturalWidth * scale;
            const imageHeight = hero.naturalHeight * scale;
            const imageLeft = (width - imageWidth) / 2;
            const imageTop = (height - imageHeight) / 2;
            const closeSize = closeButton.offsetWidth || 32;
            const arrowSize = prevButton.offsetWidth || 34;
            const sideGap = 12;
            closeButton.style.left = `${imageLeft + imageWidth - closeSize - sideGap}px`;
            closeButton.style.right = 'auto';
            closeButton.style.top = `${imageTop + sideGap}px`;
            prevButton.style.left = `${imageLeft + sideGap}px`;
            prevButton.style.right = 'auto';
            prevButton.style.top = `${imageTop + (imageHeight - arrowSize) / 2}px`;
            nextButton.style.left = 'auto';
            nextButton.style.right = `${width - imageLeft - imageWidth + sideGap}px`;
            nextButton.style.top = `${imageTop + (imageHeight - arrowSize) / 2}px`;
        };
        const render = () => {
            modal.classList.toggle('has-shots', Boolean(shots.length));
            if (!shots.length) {
                currentIndex.textContent = 'NO PREVIEW';
                return;
            }
            hero.src = shots[index];
            const frame = `${index + 1} / ${shots.length}`;
            currentIndex.textContent = frame;
            [...thumbs.children].forEach((btn, i) => btn.classList.toggle('active', i === index));
            if (hero.complete) {
                sizeGallery();
                positionControls();
            }
        };
        shots.forEach((url, i) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'whatslink-gallery-thumb';
            btn.innerHTML = `<img src="${url}" alt="截图${i + 1}">`;
            btn.addEventListener('click', () => {
                index = i;
                render();
            });
            thumbs.appendChild(btn);
        });
        prevButton.addEventListener('click', () => {
            if (!shots.length) return;
            index = (index + shots.length - 1) % shots.length;
            render();
        });
        nextButton.addEventListener('click', () => {
            if (!shots.length) return;
            index = (index + 1) % shots.length;
            render();
        });
        const onKeydown = event => {
            if (!document.body.contains(overlay)) return;
            if (event.key === 'ArrowLeft' && shots.length) {
                index = (index + shots.length - 1) % shots.length;
                render();
            }
            if (event.key === 'ArrowRight' && shots.length) {
                index = (index + 1) % shots.length;
                render();
            }
            if (event.key === 'Escape') close();
        };
        const onResize = () => {
            sizeGallery();
            positionControls();
        };
        const removeResize = () => window.removeEventListener('resize', onResize);
        const close = () => {
            overlay.remove();
            document.removeEventListener('keydown', onKeydown);
            removeResize();
        };
        closeButton.addEventListener('click', close);
        overlay.addEventListener('click', e => {
            if (e.target === overlay) close();
        });
        hero.addEventListener('load', () => {
            sizeGallery();
            positionControls();
        });
        window.addEventListener('resize', onResize);
        document.addEventListener('keydown', onKeydown);
        render();
    }

    parseU9A9(html, keyword) {
        const $dom = utils.htmlTo$dom(html), results = [];
        const kwNorm = String(keyword).toUpperCase().replace(/[^A-Z0-9]/g, '');
        $dom.find(".torrent-list tbody tr").each(((i, el) => {
            const $el = $(el);
            if ($el.text().includes("置顶")) return;
            const $titleA = $el.find("td:nth-child(2) a").first();
            const title = $titleA.attr("title") || $titleA.text().trim();
            if (!title) return;
            if (kwNorm) {
                const titleNorm = title.toUpperCase().replace(/[^A-Z0-9]/g, '');
                if (!titleNorm.includes(kwNorm)) return;
            }
            const magnet = $el.find("td:nth-child(3) a[href^='magnet:']").attr("href");
            const size = $el.find("td:nth-child(4)").text().trim();
            const date = $el.find("td:nth-child(5)").text().trim();
            magnet && results.push({title, magnet, size, date});
        }));
        return results;
    }

    async parseU3C3(_html, keyword) {
        const base = 'https://www.u3c3.com';
        const referer = base + '/';
        const home = await gmFetch(base + '/', {
            headers: {Referer: referer},
        });
        if (!home.loadstuts) return [];
        const homeDoc = parseHTML(home.responseText);
        const searchScript = [...homeDoc.scripts].map(script => script.textContent || '').find(text => text.includes('function search21')) || '';
        const token = searchScript.match(/^\s*var\s+nmefafej\s*=\s*["']([^"']+)["'];?/m)?.[1] || '';
        if (!token) return [];
        const searchUrl = `${base}/?search2=${encodeURIComponent(token)}&search=${encodeURIComponent(keyword)}`;
        const r = await gmFetch(searchUrl, {
            headers: {Referer: referer},
        });
        if (!r.loadstuts) return [];
        const doc = parseHTML(r.responseText);
        const normalizedKeyword = String(keyword || '').toUpperCase().replace(/[-_\s]/g, '');
        const data = [...doc.querySelectorAll('table.torrent-list tbody tr.default, table.torrent-list tbody tr.success')].map(row => {
            const titleA = row.querySelector('td:nth-child(2) a[href*="/view?id="]');
            const magnetA = row.querySelector('td:nth-child(3) a[href^="magnet:"]');
            const title = titleA?.getAttribute('title')?.trim() || titleA?.textContent?.trim() || '';
            if (!title || !magnetA?.href) return null;
            if (normalizedKeyword && !title.toUpperCase().replace(/[-_\s]/g, '').includes(normalizedKeyword)) return null;
            const href = titleA.getAttribute('href') || '';
            return {
                title,
                magnet: magnetA.href,
                size: row.querySelector('td:nth-child(4)')?.textContent?.trim() || '',
                date: row.querySelector('td:nth-child(5)')?.textContent?.trim() || '',
                src: href ? new URL(href, base).href : searchUrl,
            };
        }).filter(Boolean);
        return data;
    }

    parseSukebei(html, keyword) {
        const $dom = utils.htmlTo$dom(html), results = [];
        $dom.find("tr.default, tr.success").each(((i, el) => {
            const $el = $(el);
            const title = $el.find("td:nth-child(2) a").first().attr("title") || $el.find("td:nth-child(2) a").first().text().trim();
            if (!title) return;
            const magnet = $el.find("td:nth-child(3) a:last-child").attr("href");
            const size = $el.find("td:nth-child(4)").text().trim();
            const date = $el.find("td:nth-child(5)").text().trim();
            magnet && results.push({title, magnet, size, date});
        }));
        return results;
    }

    async parseOmag(html, keyword) {
        const doc = parseHTML(html);
        const base = "https://xn--mag-zna.net";
        const entries = [...doc.querySelectorAll('tr')].map(row => {
            const titleA = row.querySelector('td.result-title a[href^="/!"]');
            if (!titleA) return null;
            const href = titleA.getAttribute('href') || '';
            if (!href) return null;
            let src;
            try {
                src = new URL(href, base).href;
            } catch (_) {
                return null;
            }
            const title = titleA.textContent.trim();
            const meta = [...row.querySelectorAll('.result-meta > div')].map(item => item.textContent.trim());
            return {title, size: meta[0] || '', date: meta[1] || '', src};
        }).filter(Boolean);
        const searchUrl = `https://xn--mag-zna.net/search?q=${encodeURIComponent(keyword)}`;
        const results = [];
        for (const entry of entries) {
            try {
                const r = await gmFetch(entry.src, {
                    headers: {Referer: searchUrl}
                });
                if (!r.loadstuts) continue;
                const detailDoc = parseHTML(r.responseText);
                const magnetInput = detailDoc.querySelector('#input-magnet');
                const magnetA = detailDoc.querySelector('a[href^="magnet:"]');
                const maglink = (magnetInput?.getAttribute('value') || magnetA?.getAttribute('href') || magnetA?.href || '').trim();
                if (!maglink || !/^magnet:\?xt=urn:btih:/i.test(maglink)) continue;
                results.push({title: entry.title, magnet: maglink, size: entry.size, date: entry.date});
            } catch (_) {
            }
        }
        return results;
    }

    parseBTSearch($container, $sortSelect, engine, keyword, cacheKey) {
        const _this = this;
        const apiUrl = engine.url.replace("{keyword}", encodeURIComponent(keyword));
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const nonce = randomString(8);
        const parts = [`timestamp=${timestamp}`, `nonce=${nonce}`, `keyword=${keyword}`, `limit=10`, `offset=0`, `sort=size`, `sort_type=desc`];
        const signText = `${parts.sort().join('&')}&key=long2ice`;
        const sign = window.md5 ? window.md5(signText).toUpperCase() : '';
        GM_xmlhttpRequest({
            method: "GET",
            url: apiUrl,
            headers: {
                Accept: 'application/json',
                Referer: engine.targetPage.replace("{keyword}", encodeURIComponent(keyword)),
                'x-timestamp': timestamp,
                'x-nonce': nonce,
                'x-sign': sign
            },
            onload: response => {
                try {
                    const json = JSON.parse(response.responseText);
                    const items = Array.isArray(json?.data) ? json.data : Array.isArray(json?.data?.data) ? json.data.data : [];
                    const results = items.map(item => {
                        const title = String(item?.name || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
                        const hash = String(item?.hash || '').replace(/^magnet:\?xt=urn:btih:/i, '').replace(/[^a-z0-9]/gi, '');
                        if (!/^[a-f0-9]{32,40}$/i.test(hash)) return null;
                        const size = formatBytes(item?.size);
                        const date = item?.created_at || item?.created_time || item?.create_time || '';
                        return {
                            title: title || `magnet:?xt=urn:btih:${hash}`,
                            magnet: `magnet:?xt=urn:btih:${hash}`,
                            size,
                            date
                        };
                    }).filter(Boolean);
                    results.length > 0 && sessionStorage.setItem(cacheKey, JSON.stringify(results));
                    $container.data("_magnetData", results);
                    $sortSelect.prop("disabled", results.length === 0);
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

    parseSokitty(html, keyword) {
        const doc = parseHTML(html);
        const base = "https://w1.sokitty.me";
        const kwNorm = String(keyword).toUpperCase().replace(/[-_\s]/g, '');
        const results = [];
        doc.querySelectorAll('.panel.search-panel').forEach(panel => {
            const titleA = panel.querySelector('h3.panel-title > a.list-title');
            if (!titleA) return;
            const href = titleA.getAttribute('href') || '';
            if (!href.startsWith('/bt/')) return;
            const hash = href.replace('/bt/', '');
            if (!hash) return;
            const title = titleA.textContent.trim();
            if (!title.toUpperCase().replace(/[-_\s]/g, '').includes(kwNorm)) return;
            const maglink = `magnet:?xt=urn:btih:${hash}`;
            const infoItems = [...panel.querySelectorAll('.panel-footer .info-item')];
            const size = infoItems[0]?.textContent?.trim() || '';
            const date = infoItems[2]?.textContent?.trim() || '';
            results.push({title, magnet: maglink, size, date});
        });
        return results;
    }
}

function formatBytes(bytes) {
    if (!bytes || bytes <= 0) return '';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = 0;
    let size = bytes;
    while (size >= 1024 && i < units.length - 1) {
        size /= 1024;
        i++;
    }
    return size.toFixed(1) + ' ' + units[i];
}

function extractCode(text) {
    if (!text) return null;
    const patterns = [
        /FC2[-\s_]?(?:PPV)?[-\s_]?(\d{6,9})/i,
        /([A-Z]{2,15})-(\d{2,10})(?:-(\d+))?/i,
        /([A-Z]{2,15})-([A-Z]{0,2}\d{2,10})/i,
        /^[A-Z0-9]+[-_](\d{6}[-_]\d{2,3})/i,
        /(\d{6}[-_]\d{2,3})[-_][A-Z0-9]+$/i,
        /(?<!\w)(\d{6}[-_]\d{2,3})(?!\w)/,
        /([A-Z]{1,2})(\d{3,4})/i,
    ];
    for (const re of patterns) {
        const m = text.match(re);
        if (m) return m[0].toUpperCase();
    }
    return null;
}

function randomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
}

function RerenderSort($container, sortMode) {
    const data = $container.data("_magnetData");
    if (!data || !data.length) return;
    const results = [...data].sort((a, b) => {
        const sizeDelta = parseSize(b.size) - parseSize(a.size);
        if (sortMode === 'size') return sizeDelta;
        const aTime = parseDate(a.date), bTime = parseDate(b.date);
        if (!aTime && !bTime) return sizeDelta;
        if (!aTime) return 1;
        if (!bTime) return -1;
        const timeDelta = sortMode === 'oldest' ? aTime - bTime : bTime - aTime;
        return timeDelta || sizeDelta;
    });
    $container.empty();
    const $table = $(`<table class="magnet-table">
        <thead><tr>
            <th class="col-name">名称</th>
            <th class="col-size">大小</th>
            <th class="col-date">日期</th>
            <th class="col-actions">操作</th>
        </tr></thead>
        <tbody></tbody>
    </table>`);
    const $tbody = $table.find("tbody");
    results.forEach((result => {
        const quality = classifyQuality(result.title);
        let badges = '';
        if (quality.is4K) badges += '<span class="magnet-badge mg-four-k">4K</span>';
        if (quality.isChinese) badges += '<span class="magnet-badge mg-subtitle">中字</span>';
        if (quality.isCracked) badges += '<span class="magnet-badge mg-cracked">破解</span>';
        const displayDate = formatMagnetDate(result.date);
        const dnCode = extractCode(result.title);
        const $row = $(`<tr>
            <td>
                <div class="magnet-name-cell">
                    ${badges}
                    <a href="${result.magnet}" title="${result.title}">${result.title}</a>
                </div>
            </td>
            <td class="col-size">${result.size || '未知'}</td>
            <td class="col-date">${displayDate || '未知'}</td>
            <td class="col-actions">
                <button class="magnet-hub-btn copy-btn" data-magnet="${result.magnet}" data-dncode="${dnCode || ''}">复制</button>
                <button class="magnet-hub-btn check-btn" data-magnet="${result.magnet}">验车</button>
                <button class="magnet-hub-btn down-btn down-115" data-magnet="${result.magnet}">115</button>
            </td>
        </tr>`);
        $tbody.append($row);
    }));
    $container.append($table);
}

export {MagnetHubPlugin};
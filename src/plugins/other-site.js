import { BasePlugin } from '../core/base-plugin.js';
import { __publicField, isJavBus, isJavDb } from '../core/constants.js';
import { AsyncQueue } from '../core/utils.js';

class OtherSitePlugin extends BasePlugin {
    constructor() {
        super(...arguments);
        __publicField(this, "okBackgroundColor", "#7bc73b");
        __publicField(this, "errorBackgroundColor", "#de3333");
        __publicField(this, "warnBackgroundColor", "#d7a80c");
        __publicField(this, "domainErrorBackgroundColor", "#d7780c");
        __publicField(this, "asyncQueue", new AsyncQueue);
        __publicField(this, "siteConfigs", [ {
            id: "javTrailersBtn",
            getBaseUrl: async () => await this.getJavTrailersUrl(),
            itemSelector: ".videos-list .video-link",
            searchPath: (baseUrl, carNum2) => `${baseUrl}/search/${carNum2}`,
            getDetailPageHref: $box2 => $box2.attr("href"),
            findCarNumOrTitle: $box2 => $box2.find("p.card-text").text()
        }, {
            id: "123AvBtn",
            getBaseUrl: async () => await this.getAv123Url() + "/ja",
            itemSelector: ".box-item",
            searchPath: (baseUrl, carNum2) => `${baseUrl}/search?keyword=${carNum2}`,
            getDetailPageHref: $box2 => $box2.find(".detail a").attr("href"),
            findCarNumOrTitle: $box2 => $box2.find("img").attr("title")
        }, {
            id: "jableBtn",
            getBaseUrl: async () => await this.getjableUrl(),
            itemSelector: "#list_videos_videos_list_search_result .detail .title a",
            searchPath: (baseUrl, carNum2) => `${baseUrl}/search/${carNum2}/`,
            getDetailPageHref: $box2 => $box2.attr("href"),
            findCarNumOrTitle: $box2 => $box2.text()
        }, {
            id: "avgleBtn",
            getBaseUrl: async () => await this.getAvgleUrl(),
            itemSelector: ".text-secondary",
            searchPath: (baseUrl, carNum2) => `${baseUrl}/vod/search.html?wd=${carNum2}`,
            getDetailPageHref: $box2 => $box2.attr("href"),
            findCarNumOrTitle: $box2 => $box2.text()
        }, {
            id: "missAvBtn",
            getBaseUrl: async () => await this.getMissAvUrl(),
            itemSelector: ".text-secondary",
            searchPath: (baseUrl, carNum2) => `${baseUrl}/search/${carNum2}`,
            getDetailPageHref: $box2 => $box2.attr("href"),
            findCarNumOrTitle: $box2 => $box2.text()
        }, {
            id: "supJavBtn",
            getBaseUrl: async () => await this.getSupJavUrl(),
            itemSelector: ".posts post",
            searchPath: (baseUrl, carNum2) => `${baseUrl}/?s=${carNum2}`,
            getDetailPageHref: ($box2, baseUrl, carNum2) => $box2.attr("href"),
            findCarNumOrTitle: $box2 => $box2.attr("title")
        }, {
            id: "javDbBtn",
            getBaseUrl: async () => await this.getJavDbUrl(),
            itemSelector: ".movie-list .item",
            searchPath: (baseUrl, carNum2) => `${baseUrl}/search?q=${carNum2}`,
            getDetailPageHref: $box2 => $box2.find("a").attr("href"),
            findCarNumOrTitle: $box2 => $box2.find(".video-title").text(),
            condition: sourceCarNum => isJavBus
        }, {
            id: "javBusBtn",
            getBaseUrl: async () => await this.getJavBusUrl(),
            itemSelector: ".container h3",
            searchPath: (baseUrl, carNum2) => `${baseUrl}/${carNum2}`,
            getDetailPageHref: ($box2, baseUrl, carNum2) => `${baseUrl}/${carNum2}`,
            findCarNumOrTitle: $box2 => $box2.text(),
            condition: sourceCarNum => isJavDb && sourceCarNum && !sourceCarNum.includes("FC2")
        }, {
            id: "fanzaBtn",
            noHandle: !0,
            initUrl: carNum2 => `https://www.dmm.co.jp/search/=/searchstr=${carNum2}`,
            condition: sourceCarNum => sourceCarNum && !sourceCarNum.includes("FC2")
        } ]);
        __publicField(this, "settingCache", null);
        __publicField(this, "lastFetchTime", 0);
        __publicField(this, "CACHE_DURATION", 1e4);
    }
    getName() {
        return "OtherSitePlugin";
    }
    async initCss() {
        return "\n            <style>\n                .site-btn {\n                    position: relative !important;\n                    min-width: 80px;\n                    display: inline-block;\n                    padding: 5px 10px;\n                    color: white !important;\n                    background-color:#938585;\n                    text-decoration: none;\n                    border-radius: 4px;\n                    text-align: center;\n                    margin-bottom: 5px;\n                }\n                .site-btn:hover {\n                    color: white;\n                    transform: translateY(-2px);\n                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);\n                }\n                .site-tag {\n                    position: absolute; \n                    top: -15px; \n                    right: 0; \n                    background-color: #ffc107; \n                    color: #333; \n                    font-size: 12px; \n                    padding: 2px 6px; \n                    border-radius: 4px;\n                }\n            </style>\n        ";
    }
    async handle() {
        window.isDetailPage && this.loadOtherSite().then();
    }
    async loadOtherSite(carNum2, sourceCarNum) {
        if ("yes" !== await storageManager.getSetting("enableLoadOtherSite", "yes")) return;
        carNum2 || (carNum2 = this.getPageInfo().carNum);
        const enabledSites = this.getEnabledSites(), html = `\n            <div id="otherSiteBox" class="panel-block" style="${isJavDb ? "margin-top:8px;font-size:13px" : "margin-top:10px;font-size:13px"}; user-select: none; ">\n                <div style="display: flex;gap: 5px;flex-wrap: wrap">\n                    ${this.siteConfigs.map((config => {
            config.sourceCarNum = sourceCarNum;
            if (config.condition && !1 === config.condition(config.sourceCarNum)) return "";
            return `<a target="_blank" class="site-btn" style="${enabledSites.includes(config.id) ? "" : "display:none"}" id="${config.id}"><span>${config.id.replace("Btn", "")}</span></a>`;
        })).join("")}\n                    <a id="settingSiteBtn" class="site-btn"><span>设置</span></a>\n                </div>\n            </div>\n            \n            <div id="settingsArea" class="panel-block"  style="display: none; margin-top:10px; margin-bottom: 10px; user-select: none; ">\n                <div id="siteCheckboxes" style="display: flex;gap: 5px;flex-wrap: wrap">\n                </div>\n            </div>\n        `;
        $(".movie-panel-info").append(html);
        $(".container .info").append(html);
        $("#javTrailersBtn").on("click", (async event => {
            event.preventDefault();
            let settingObj = await storageManager.getSetting();
            const filterHotKey = settingObj.filterHotKey, favoriteHotKey = settingObj.favoriteHotKey, speedVideoHotKey = settingObj.speedVideoHotKey;
            let href = $("#javTrailersBtn").attr("href"), url = href + `?handle=1&filterHotKey=${filterHotKey}&favoriteHotKey=${favoriteHotKey}&speedVideoHotKey=${speedVideoHotKey}`;
            event && (event.ctrlKey || event.metaKey) && (url = href);
            utils.openPage(url, carNum2, !1, event);
        }));
        await Promise.all(this.siteConfigs.map((async config => {
            config.condition && !1 === config.condition(config.sourceCarNum) || await this.handleSite(carNum2, config);
        })));
        this.renderSettingsArea();
        this.setupEventListeners();
    }
    async handleSite(carNum2, config) {
        const $btn = $(`#${config.id}`);
        if (config.initUrl) {
            $btn.attr("href", config.initUrl(carNum2));
            $btn.css("backgroundColor", this.warnBackgroundColor);
        }
        if (config.noHandle && !0 === config.noHandle) {
            const dmmCacheKey = "jhs_other_site_dmm", dmmCachedResult = (localStorage.getItem(dmmCacheKey) ? JSON.parse(localStorage.getItem(dmmCacheKey)) : {})[carNum2];
            if (dmmCachedResult) if ("single" === dmmCachedResult.type) {
                $btn.attr("href", dmmCachedResult.url);
                $btn.css("backgroundColor", this.okBackgroundColor);
            } else if ("multiple" === dmmCachedResult.type) {
                $btn.attr("href", dmmCachedResult.url);
                $btn.append('<span class="site-tag" style="top:-15px">多结果</span>');
                $btn.css("backgroundColor", this.okBackgroundColor);
            }
        } else try {
            if ($btn.attr("href")) return;
            if (utils.isHidden($btn)) return;
            const cacheKey = "jhs_other_site", cacheData = localStorage.getItem(cacheKey) ? JSON.parse(localStorage.getItem(cacheKey)) : {}, siteKey = carNum2 + "_" + config.id.replace("Btn", ""), cachedResult = cacheData[siteKey];
            if (cachedResult) {
                if ("single" === cachedResult.type) {
                    $btn.attr("href", cachedResult.url);
                    $btn.css("backgroundColor", this.okBackgroundColor);
                } else if ("multiple" === cachedResult.type) {
                    $btn.attr("href", cachedResult.url);
                    $btn.append('<span class="site-tag" style="top:-15px">多结果</span>');
                    $btn.css("backgroundColor", this.okBackgroundColor);
                }
                return;
            }
            const baseUrl = await config.getBaseUrl(), searchUrl = config.searchPath(baseUrl, carNum2);
            $btn.attr("href", searchUrl);
            const html = await gmHttp.get(searchUrl, null, config.headers, !0), $dom = utils.htmlTo$dom(html), resultUrlList = [];
            $dom.find(config.itemSelector).each(((index, element) => {
                const $box2 = $(element);
                if (!config.findCarNumOrTitle($box2).toLowerCase().includes(carNum2.toLowerCase())) return;
                let href = config.getDetailPageHref($box2, baseUrl, carNum2);
                if (!href) throw new Error("解析href失败");
                href.includes("http") || (href = baseUrl + (href.startsWith("/") ? href : "/" + href));
                resultUrlList.push(href);
            }));
            let tagHtml = "", insertCacheData = null;
            if (1 === resultUrlList.length) {
                let resultUrl = resultUrlList[0];
                $btn.attr("href", resultUrl);
                $btn.css("backgroundColor", this.okBackgroundColor);
                insertCacheData = {
                    type: "single",
                    url: resultUrl
                };
            } else if (resultUrlList.length > 1) {
                $btn.attr("href", searchUrl);
                tagHtml += '<span class="site-tag" style="top:-15px">多结果</span>';
                $btn.css("backgroundColor", this.okBackgroundColor);
                insertCacheData = {
                    type: "multiple",
                    url: searchUrl
                };
            } else {
                $btn.attr("href", searchUrl);
                $btn.attr("title", "未查询到, 点击前往搜索页");
                $btn.css("backgroundColor", this.errorBackgroundColor);
            }
            insertCacheData && this.asyncQueue.addTask((() => {
                const newCacheData = localStorage.getItem(cacheKey) ? JSON.parse(localStorage.getItem(cacheKey)) : {};
                newCacheData[siteKey] = insertCacheData;
                localStorage.setItem(cacheKey, JSON.stringify(newCacheData));
            }));
            tagHtml && $btn.append(tagHtml);
        } catch (e) {
            const errorString = String(e), siteName = config.id.replace("Btn", "");
            if (errorString.includes("Just a moment")) {
                $btn.attr("title", "请求失败：Cloudflare 安全检查。");
                $btn.css("backgroundColor", this.warnBackgroundColor);
                clog.warn(`检测第三方资源失败, ${siteName} 需Cloudflare安全检查`);
            } else if (errorString.includes("重定向")) {
                $btn.attr("title", "域名失效");
                $btn.css("backgroundColor", this.domainErrorBackgroundColor);
                clog.warn(`检测第三方资源失败, ${siteName} 域名被重定向`);
            } else if (errorString.includes("404 Page Not Found")) {
                $btn.attr("title", "未查询到, 点击前往搜索页");
                $btn.css("backgroundColor", this.errorBackgroundColor);
            } else {
                console.error(e);
                $btn.attr("title", "请求失败。");
                $btn.css("backgroundColor", this.errorBackgroundColor);
                clog.warn(`检测第三方资源失败, ${siteName}`);
            }
        }
    }
    async getSettingCache() {
        const now = Date.now();
        if (!this.settingCache || now - this.lastFetchTime > this.CACHE_DURATION) {
            this.settingCache = await storageManager.getSetting();
            this.lastFetchTime = now;
        }
        return this.settingCache;
    }
    async getMissAvUrl() {
        return (await this.getSettingCache()).missAvUrl || "https://missav.live";
    }
    async getjableUrl() {
        return (await this.getSettingCache()).jableUrl || "https://jable.tv";
    }
    async getAvgleUrl() {
        return (await this.getSettingCache()).avgleUrl || "https://jav.rs";
    }
    async getJavTrailersUrl() {
        return (await this.getSettingCache()).javTrailersUrl || "https://javtrailers.com";
    }
    async getAv123Url() {
        return (await this.getSettingCache()).av123Url || "https://123av.com";
    }
    async getJavDbUrl() {
        return (await this.getSettingCache()).javDbUrl || "https://javdb.com";
    }
    async getJavBusUrl() {
        return (await this.getSettingCache()).javBusUrl || "https://www.javbus.com";
    }
    async getSupJavUrl() {
        return (await this.getSettingCache()).supJavUrl || "https://supjav.com";
    }
    getEnabledSites() {
        const enabledSites = localStorage.getItem("jhs_enabled_sites");
        return enabledSites ? JSON.parse(enabledSites) : this.siteConfigs.map((c => c.id));
    }
    saveEnabledSites(sites) {
        localStorage.setItem("jhs_enabled_sites", JSON.stringify(sites));
    }
    renderSettingsArea() {
        const enabledSites = this.getEnabledSites(), checkboxesDiv = document.getElementById("siteCheckboxes");
        checkboxesDiv && (checkboxesDiv.innerHTML = this.siteConfigs.map((config => {
            const isEnabled = enabledSites.includes(config.id);
            return `\n                <div style="margin-right: 15px; display: flex; align-items: ${isJavDb ? "center" : "flex-start"};">\n                    <input type="checkbox" id="checkbox-${config.id}" data-site-id="${config.id}" ${isEnabled ? "checked" : ""} style="margin-right: 8px; cursor: pointer;">\n                    <label for="checkbox-${config.id}" style="color: #333; font-weight: 500; cursor: pointer;">${config.id.replace("Btn", "")}</label>\n                </div>\n            `;
        })).join(""));
    }
    setupEventListeners() {
        const settingsArea = document.getElementById("settingsArea");
        document.addEventListener("click", (event => {
            if ("settingSiteBtn" === event.target.id || event.target.closest("#settingSiteBtn")) {
                const isHidden = "none" === settingsArea.style.display || "" === settingsArea.style.display;
                settingsArea.style.display = isHidden ? "block" : "none";
            }
        }));
        settingsArea.addEventListener("change", (event => {
            if ("checkbox" === event.target.type) {
                const siteId = event.target.getAttribute("data-site-id");
                if (event.target.checked) {
                    $(`#${siteId}`).show();
                    const carNum2 = this.getPageInfo().carNum, config = this.siteConfigs.find((item => item.id === siteId));
                    this.handleSite(carNum2, config).then();
                } else $(`#${siteId}`).hide();
                const enabledSites = Array.from(settingsArea.querySelectorAll('input[type="checkbox"]:checked')).map((checkbox => checkbox.getAttribute("data-site-id")));
                this.saveEnabledSites(enabledSites);
            }
        }));
    }
}


export { OtherSitePlugin };
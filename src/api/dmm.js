import { qualityOptions } from '../core/constants.js';
const selectDefaultQuality = (dmmVideoQualityList, intendedDefault) => {
    if (!dmmVideoQualityList || 0 === dmmVideoQualityList.length) return null;
    const availableSet = new Set(dmmVideoQualityList);
    if (availableSet.has(intendedDefault)) return intendedDefault;
    const priorityOrder = qualityOptions.map((option => option.quality)).reverse();
    for (const quality of priorityOrder) if (availableSet.has(quality)) return quality;
    return dmmVideoQualityList[0];
}, CACHE_KEY = "jhs_dmm_video";

class DmmVideoFetcher {
    constructor(carNum2, showErrorMessages = !0) {
        this.carNum = carNum2;
        this.showErrorMessages = showErrorMessages;
    }
    _checkCache() {
        const cachedData = localStorage.getItem(CACHE_KEY) ? JSON.parse(localStorage.getItem(CACHE_KEY)) : {};
        if (cachedData[this.carNum]) {
            clog.debug("缓存中存在预览视频信息", cachedData[this.carNum]);
            return cachedData[this.carNum];
        }
        return null;
    }
    _updateCache(videoMap) {
        const cachedData = localStorage.getItem(CACHE_KEY) ? JSON.parse(localStorage.getItem(CACHE_KEY)) : {};
        cachedData[this.carNum] = videoMap;
        clog.debug("成功解析出预览视频并已缓存:", videoMap);
        localStorage.setItem(CACHE_KEY, JSON.stringify(cachedData));
    }
    async _searchContentIds() {
        const carNum2 = this.carNum, carNumNoHyphen = carNum2.replace(/-/g, ""), keywordAttempts = [ {
            keyword: carNum2.replace("-", "00"),
            name: "00-替换关键词"
        }, {
            keyword: carNum2,
            name: "原始番号关键词"
        }, {
            keyword: carNumNoHyphen,
            name: "无连字符关键词"
        } ], carNumLower = carNum2.toLowerCase();
        for (const attempt of keywordAttempts) {
            const {keyword: keyword, name: name2} = attempt, currentTempCarNumLower = keyword.toLowerCase(), apiUrl2 = `https://api.dmm.com/affiliate/v3/ItemList?${new URLSearchParams({
                api_id: "UrwskPfkqQ0DuVry2gYL",
                affiliate_id: "10278-996",
                output: "json",
                site: "FANZA",
                sort: "match",
                keyword: keyword
            }).toString()}`;
            let response;
            try {
                response = await gmHttp.get(apiUrl2);
            } catch (e) {
                clog.error(`API 请求失败，跳过 ${name2}:`, e);
                continue;
            }
            if (!response || !response.result || !response.result.result_count) {
                clog.debug(`使用 ${name2} (${keyword}) 进行 API 搜索 返回无结果，尝试下一个关键词。`);
                continue;
            }
            const newItems = [];
            for (const item of response.result.items) {
                if (newItems.length >= 2) break;
                const contentId = item.content_id || "", makerProduct = item.maker_product || "";
                if (contentId.includes(currentTempCarNumLower.replace("-", "")) || carNumLower === makerProduct.toLowerCase() || contentId.includes(carNumNoHyphen.toLowerCase())) {
                    newItems.push({
                        serviceCode: item.service_code,
                        floorCode: item.floor_code,
                        contentId: contentId,
                        pageUrl: item.URL
                    });
                    clog.debug(`[${name2}] cid|makerProduct 匹配成功:`, contentId, makerProduct);
                }
            }
            if (newItems.length > 0) {
                clog.debug(`--- 成功通过 ${name2} 找到 Content IDs ---`);
                const $btn2 = $("#fanzaBtn");
                let url = `https://www.dmm.co.jp/search/=/searchstr=${keyword}`, type = "single";
                if (newItems.length > 1) {
                    $btn2.attr("href", url);
                    $btn2.append('<span class="site-tag" style="top:-15px">多结果</span>');
                    $btn2.css("backgroundColor", "#7bc73b");
                    type = "multiple";
                } else {
                    url = newItems[0].pageUrl;
                    $btn2.attr("href", url);
                    $btn2.css("backgroundColor", "#7bc73b");
                }
                const dmmCacheKey = "jhs_other_site_dmm", dmmCacheData = localStorage.getItem(dmmCacheKey) ? JSON.parse(localStorage.getItem(dmmCacheKey)) : {};
                dmmCacheData[this.carNum] = {
                    type: type,
                    url: url
                };
                localStorage.setItem(dmmCacheKey, JSON.stringify(dmmCacheData));
                return newItems;
            }
            clog.debug(`[${name2}] API 返回结果数 ${response.result.result_count}，但无精确匹配的 Content ID。`);
        }
        clog.warn("所有关键词尝试均未找到匹配的Content ID, 解析Dmm视频失败");
        const $btn = $("#fanzaBtn");
        $btn.attr("href", `https://www.dmm.co.jp/search/=/searchstr=${this.carNum}`);
        $btn.attr("title", "未查询到, 点击前往搜索页");
        $btn.css("backgroundColor", "#de3333");
        return null;
    }
    async _extractTrailerLinks({contentId: contentId, serviceCode: serviceCode, floorCode: floorCode}) {
        const trailerPageUrl = `https://www.dmm.co.jp/service/digitalapi/-/html5_player/=/cid=${contentId}/mtype=AhRVShI_/service=${serviceCode}/floor=${floorCode}/mode=/`, htmlContent = await gmHttp.get(trailerPageUrl, null, {
            "accept-language": "ja-JP,ja;q=0.9",
            Cookie: "age_check_done=1"
        });
        if ("string" != typeof htmlContent) {
            clog.error(htmlContent);
            throw new Error("解析播放页内容失败, 非文本内容");
        }
        if (htmlContent.includes("このサービスはお住まいの地域からは")) throw new Error("节点不可用，请将DMM域名分流到日本ip");
        const match = htmlContent.match(/const\s+args\s+=\s+(.*);/);
        if (!match) throw new Error("未在脚本中找到 const args = ... 变量");
        let bitrates;
        try {
            ({bitrates: bitrates} = JSON.parse(match[1]));
        } catch (e) {
            throw new Error(`解析播放器脚本 JSON 失败: ${e.message}`);
        }
        const finalQualityMap = {}, qualityKeys = qualityOptions.map((o => o.quality)).join("|"), qualityNameRegex = new RegExp(`(${qualityKeys})\\.mp4$`);
        if (!Array.isArray(bitrates)) {
            clog.error("解析画质链接失败: bitrates 字段不是一个数组或不存在");
            throw new Error("解析画质链接失败: bitrates 字段不是一个数组或不存在");
        }
        clog.debug("原始数据返回:", bitrates);
        for (const item of bitrates) {
            const url = null == item ? void 0 : item.src;
            if (!url || "string" != typeof url || !url.endsWith(".mp4")) continue;
            const qualityMatch = url.match(qualityNameRegex);
            let qualityKey = "";
            qualityMatch && qualityMatch[1] && (qualityKey = qualityMatch[1]);
            qualityKey && !finalQualityMap[qualityKey] && (finalQualityMap[qualityKey] = url);
        }
        if (0 === Object.keys(finalQualityMap).length) throw new Error("未找到匹配要求的预览画质视频");
        return finalQualityMap;
    }
    async fetchVideo() {
        const cachedResult = this._checkCache();
        if (cachedResult) return cachedResult;
        let contentItems;
        try {
            const testCarNum = this.carNum.toLowerCase();
            if (testCarNum.startsWith("heyzo") || /^(n\d+|\d+(-\d+)*)$/.test(testCarNum) || /^n\d+$/.test(testCarNum)) throw new Error("无码番号类型, 取消dmm解析");
            if (this.carNum.includes("VR-")) throw new Error("VR类型, 取消dmm解析");
            contentItems = await this._searchContentIds();
        } catch (e) {
            clog.error("DMM API 搜索失败:", e);
            const $btn = $("#fanzaBtn");
            $btn.attr("href", `https://www.dmm.co.jp/search/=/searchstr=${this.carNum}`);
            $btn.attr("title", "未查询到, 点击前往搜索页");
            $btn.css("backgroundColor", "#de3333");
            return null;
        }
        if (!contentItems || 0 === contentItems.length) return null;
        try {
            const finalVideoMap = await Promise.any(contentItems.map((item => this._extractTrailerLinks(item))));
            this._updateCache(finalVideoMap);
            return finalVideoMap;
        } catch (error) {
            const errors = error.errors || [ error ];
            if (errors.some((err => err.message.includes("节点不可用")))) this.showErrorMessages && show.error("节点不可用，请将DMM域名分流到日本ip"); else {
                const displayError = errors[0].message || errors[0];
                clog.error(`解析失败: ${displayError}`, errors);
                this.showErrorMessages && show.error(`解析失败: ${displayError}`);
            }
            const $btn = $("#fanzaBtn");
            $btn.attr("href", `https://www.dmm.co.jp/search/=/searchstr=${this.carNum}`);
            $btn.attr("title", "未查询到, 点击前往搜索页");
            $btn.css("backgroundColor", "#de3333");
            return null;
        }
    }
}

const getDmmVideo = async (carNum2, showErrorMessages = !0) => new DmmVideoFetcher(carNum2, showErrorMessages).fetchVideo();

export { DmmVideoFetcher, getDmmVideo, selectDefaultQuality };

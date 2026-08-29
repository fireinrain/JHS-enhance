import { BasePlugin } from '../core/base-plugin.js';
import { __publicField, isJavBus, YES } from '../core/constants.js';
import { AsyncQueue } from '../core/utils.js';

class TaskPlugin extends BasePlugin {
    constructor() {
        super(...arguments);
        __publicField(this, "singleTaskKey", "checkNewActressActorFilterCar");
        __publicField(this, "taskConfig", null);
        __publicField(this, "storageQueue", new AsyncQueue);
        __publicField(this, "lastCheckFavoriteActressTimeKey", "jhs_time_checkFavoriteActress");
        __publicField(this, "lastCheckBlacklistTimeKey", "jhs_time_checkBlacklist");
        __publicField(this, "lastCheckNewVideoTimeKey", "jhs_time_checkNewVideo");
    }
    getName() {
        return "TaskPlugin";
    }
    async limitConcurrency(taskParamList, checkConcurrencyCount, checkRequestSleep, taskFn) {
        this.showIsRun();
        const activePromises = [], totalItems = taskParamList.length;
        let processedCount = 0;
        for (const taskParam of taskParamList) {
            const p = taskFn(taskParam).finally((() => {
                activePromises.splice(activePromises.indexOf(p), 1);
            }));
            activePromises.push(p);
            processedCount++;
            if (activePromises.length >= checkConcurrencyCount) {
                const remainingToStart = totalItems - processedCount;
                clog.debug(`剩余任务数: <span style="color: #f40">${remainingToStart}</span>`);
                await Promise.race(activePromises);
                await utils.sleep(checkRequestSleep);
            }
        }
        await Promise.all(activePromises);
    }
    isUnnecessaryCheck(lastCheckTimeStr, checkIntervalTime) {
        if (!checkIntervalTime) throw new Error("未传入checkIntervalTime");
        checkIntervalTime = parseInt(checkIntervalTime);
        return utils.getHourDifference(new Date(lastCheckTimeStr), new Date) < checkIntervalTime;
    }
    handle() {
        this.doTask().then();
    }
    showIsRun() {
        show.info("正在执行检测任务中, 请勿关闭当前窗口", {
            duration: 3e3
        });
    }
    async doTask() {
        if (window.isListPage) {
            await this.loadConfig();
            this.javDbUrl = await this.getBean("OtherSitePlugin").getJavDbUrl();
            return navigator.locks.request(this.singleTaskKey, {
                ifAvailable: !0
            }, (async lock => {
                if (lock) {
                    if (window.isListPage) {
                        this.taskConfig.enableCheckBlacklist === YES ? await this.checkBlacklist() : clog.warn("自动检测屏蔽黑名单-禁用");
                        if (!isJavBus) {
                            if (this.taskConfig.enableCheckFavoriteActress === YES) {
                                const lastCheckFavoriteActressTimeStr = localStorage.getItem(this.lastCheckFavoriteActressTimeKey), checkFavoriteActress_IntervalTime = this.taskConfig.checkFavoriteActress_IntervalTime, isUnCheck = lastCheckFavoriteActressTimeStr && this.isUnnecessaryCheck(lastCheckFavoriteActressTimeStr, checkFavoriteActress_IntervalTime), isLogin = $('a[href*="/users/profile"]').length > 0;
                                isUnCheck && clog.debug(`检测同步演员, 上次检测时间: ${lastCheckFavoriteActressTimeStr} 检测间隔时间: ${checkFavoriteActress_IntervalTime}小时 未到时间`);
                                !isUnCheck && isLogin && await this.checkFavoriteActress();
                            } else clog.warn("自动同步已收藏的演员-禁用");
                            this.taskConfig.enableCheckNewVideo === YES ? await this.checkNewVideo() : clog.warn("自动检测已收藏演员的最新作品-禁用");
                        }
                    }
                } else clog.debug("争夺任务锁失败, 跳过执行");
            })).catch((error => {
                console.error("锁任务出现错误:", error);
                clog.error("锁任务出现错误:", error);
            })).finally((() => {
                setTimeout((() => {
                    this.doTask();
                }), 3e5);
            }));
        }
    }
    async loadConfig() {
        const settingObj = await storageManager.getSetting();
        this.taskConfig = {
            checkConcurrencyCount: settingObj.checkConcurrencyCount ? Number(settingObj.checkConcurrencyCount) : 2,
            checkRequestSleep: settingObj.checkRequestSleep ? Number(settingObj.checkRequestSleep) : 100,
            enableCheckBlacklist: settingObj.enableCheckBlacklist || YES,
            checkBlacklist_intervalTime: settingObj.checkBlacklist_intervalTime ? Number(settingObj.checkBlacklist_intervalTime) : 12,
            checkBlacklist_ruleTime: settingObj.checkBlacklist_ruleTime ? Number(settingObj.checkBlacklist_ruleTime) : 8760,
            enableCheckFavoriteActress: settingObj.enableCheckFavoriteActress || YES,
            checkFavoriteActress_IntervalTime: settingObj.checkFavoriteActress_IntervalTime ? Number(settingObj.checkFavoriteActress_IntervalTime) : 24,
            enableCheckNewVideo: settingObj.enableCheckNewVideo || YES,
            checkNewVideo_intervalTime: settingObj.checkNewVideo_intervalTime ? Number(settingObj.checkNewVideo_intervalTime) : 12,
            checkNewVideo_ruleTime: settingObj.checkNewVideo_ruleTime ? Number(settingObj.checkNewVideo_ruleTime) : 8760
        };
    }
    async checkBlacklist(isManual) {
        let blacklist = await storageManager.getBlacklist();
        if (0 === blacklist.length) return;
        blacklist = blacklist.sort(((a, b) => a.createTime < b.createTime ? 1 : a.createTime > b.createTime ? -1 : 0));
        const checkConcurrencyCount = this.taskConfig.checkConcurrencyCount, checkRequestSleep = this.taskConfig.checkRequestSleep, checkBlacklist_intervalTime = this.taskConfig.checkBlacklist_intervalTime, checkBlacklist_ruleTime = this.taskConfig.checkBlacklist_ruleTime, lastCheckBlacklistTimeStr = localStorage.getItem(this.lastCheckBlacklistTimeKey);
        if (!isManual && lastCheckBlacklistTimeStr && this.isUnnecessaryCheck(lastCheckBlacklistTimeStr, checkBlacklist_intervalTime)) {
            clog.debug(`检测黑名单, 上次检测时间: ${lastCheckBlacklistTimeStr} 检测间隔时间: ${checkBlacklist_intervalTime}小时 未到时间`);
            return;
        }
        const taskParamList = [], msgList = [];
        for (const blacklistItem of blacklist) {
            let name2 = blacklistItem.name, checkTime = blacklistItem.checkTime, lastPublishTime = blacklistItem.lastPublishTime, url = blacklistItem.url;
            if (new URL(window.location.href).hostname === new URL(url).hostname) {
                if (isManual || !checkTime || !this.isUnnecessaryCheck(checkTime, checkBlacklist_intervalTime)) if (!lastPublishTime || 0 === checkBlacklist_ruleTime || this.isUnnecessaryCheck(lastPublishTime, checkBlacklist_ruleTime)) taskParamList.push(blacklistItem); else {
                    let msg = `检测黑名单: ${name2} ${lastPublishTime} 停更超过${checkBlacklist_ruleTime / 24 / 365}年,跳过检测`;
                    msgList.push(msg);
                    $("#checkBlacklistMsg").text(msg);
                }
            } else clog.log("黑名单地址非同域名,跳过", url);
        }
        if (0 === taskParamList.length) return;
        msgList.forEach((msg => {
            clog.log(msg);
        }));
        clog.log(`<span style='color: #f40'>检测屏蔽黑名单, 总任务数: ${taskParamList.length}, 并发限制:${checkConcurrencyCount}, 请求间隔时间:${checkRequestSleep}ms</span>`);
        const blacklistPlugin = this.getBean("BlacklistPlugin");
        await this.limitConcurrency(taskParamList, checkConcurrencyCount, checkRequestSleep, (async task => {
            let {starId: starId, name: name2, url: url} = task;
            try {
                clog.log("正在检屏黑名单演员:", name2, url);
                $("#checkBlacklistMsg").text(`正在检屏黑名单演员: ${name2} ${url}`);
                const html = await gmHttp.get(url), $dom = utils.htmlTo$dom(html);
                this.storageQueue.addTask((async () => {
                    let {lastPublishTime: lastPublishTime} = await blacklistPlugin.parseAndSaveFilterInfo($dom, name2, starId);
                    await storageManager.updateBlacklistItem({
                        starId: starId,
                        name: name2,
                        checkTime: utils.getNowStr(),
                        lastPublishTime: lastPublishTime
                    });
                }));
            } catch (e) {
                $("#checkBlacklistMsg").text(`检测屏蔽演员信息, 发生错误: ${url}`);
                clog.error("检测屏蔽演员信息, 发生错误:", url, e);
                show.error("检测屏蔽演员信息, 发生错误:" + e, "bottom", "right");
            }
        }));
        await this.storageQueue.waitAllFinished();
        const updateLastCheckBlacklistTimeStr = utils.getNowStr();
        localStorage.setItem(this.lastCheckBlacklistTimeKey, updateLastCheckBlacklistTimeStr);
        clog.log('<span style="color: #f40">-------- END 检测屏蔽黑名单 END --------</span>');
        $("#checkBlacklistMsg").text("检测屏蔽黑名单, 结束");
        this.getBean("BlacklistPlugin").resetBtnTip().then();
    }
    async checkFavoriteActress() {
        const checkUrl = `${this.javDbUrl}/users/collection_actors`, actorInfoList = [];
        await this.scrapeActorInfo(checkUrl, actorInfoList);
        clog.log("所有演员信息已收集, 总计数量:", actorInfoList.length);
        $("#checkNewVideoMsg").text("同步完成");
        if (actorInfoList.length > 0) {
            await storageManager.addFavoriteActressList(actorInfoList);
            localStorage.setItem(this.lastCheckFavoriteActressTimeKey, utils.getNowStr());
            this.getBean("NewVideoPlugin").resetBtnTip().then();
        }
    }
    async scrapeActorInfo(currentUrl, actorInfoList) {
        clog.log(`正在抓取页面: ${currentUrl}`);
        $("#checkNewVideoMsg").text(`正在解析已收藏的演员: ${currentUrl}`);
        try {
            const html = await gmHttp.get(currentUrl), $dom = utils.htmlTo$dom(html);
            $dom.find("#actors .actor-box a").each(((i, element) => {
                const $a = $(element), title = $a.attr("title"), href = $a.attr("href");
                if (title && href) {
                    const allName = title.split(",").map((name3 => name3.trim())).filter((name3 => name3.length > 0)), name2 = allName[0] || "", segments = new URL(href, this.javDbUrl).pathname.split("/").filter((s => s.length > 0));
                    let starId = "";
                    segments.length > 0 && (starId = segments[segments.length - 1]);
                    let actressType = "censored";
                    const avatar = $a.find("img").attr("src"), $infoSpan = $a.find(".info");
                    $infoSpan.length && $infoSpan.text().trim().includes("無碼") && (actressType = "uncensored");
                    actorInfoList.push({
                        starId: starId,
                        name: name2,
                        allName: allName,
                        avatar: avatar,
                        actressType: actressType,
                        lastCheckTime: null,
                        lastUpdateTime: null
                    });
                }
            }));
            const nextRelativeUrl = $dom.find(".pagination-next").attr("href");
            if (nextRelativeUrl) {
                const nextAbsoluteUrl = new URL(nextRelativeUrl, this.javDbUrl).href;
                await this.scrapeActorInfo(nextAbsoluteUrl, actorInfoList);
            }
        } catch (error) {
            clog.error(`抓取 ${currentUrl} 时发生错误:`, error);
        }
    }
    async checkNewVideo(isManual) {
        const dataActressInfoList = await storageManager.getFavoriteActressList(), actressInfoList = utils.genericSort(dataActressInfoList, [ {
            key: item => {
                var _a2;
                return (null == (_a2 = item.newVideoList) ? void 0 : _a2.length) ?? 0;
            },
            order: "desc"
        }, {
            key: "lastPublishTime",
            order: "desc"
        } ]), checkConcurrencyCount = this.taskConfig.checkConcurrencyCount, checkRequestSleep = this.taskConfig.checkRequestSleep, checkNewVideo_intervalTime = this.taskConfig.checkNewVideo_intervalTime, checkNewVideo_ruleTime = this.taskConfig.checkNewVideo_ruleTime, lastCheckNewVideoTimeStr = localStorage.getItem(this.lastCheckNewVideoTimeKey);
        if (!isManual && lastCheckNewVideoTimeStr && this.isUnnecessaryCheck(lastCheckNewVideoTimeStr, checkNewVideo_intervalTime)) {
            clog.debug(`检测新作品, 上次检测时间: ${lastCheckNewVideoTimeStr} 检测间隔时间: ${checkNewVideo_intervalTime}小时 未到时间`);
            return;
        }
        const taskParamList = [], msgList = [];
        for (const actress of actressInfoList) {
            const {lastCheckTime: lastCheckTime, lastPublishTime: lastPublishTime, name: name2} = actress;
            !isManual && lastCheckTime && this.isUnnecessaryCheck(lastCheckTime, checkNewVideo_intervalTime) || (!lastPublishTime || 0 === checkNewVideo_ruleTime || this.isUnnecessaryCheck(lastPublishTime, checkNewVideo_ruleTime) ? taskParamList.push(actress) : msgList.push(`检测新作品: ${name2} ${lastPublishTime} 停更超过${checkNewVideo_ruleTime / 24 / 365}年,跳过检测`));
        }
        if (0 === taskParamList.length) return;
        msgList.forEach((msg => {
            clog.log(msg);
        }));
        clog.log(`<span style='color: #f40'>检测最新作品, 总任务数: ${taskParamList.length}, 并发限制:${checkConcurrencyCount}, 请求间隔时间:${checkRequestSleep}ms</span>`);
        const filterKeywordList = await storageManager.getTitleFilterKeyword(), filterActorActressCarList = await storageManager.getBlacklistCarList(), filterActorActressCarNumList = new Set(filterActorActressCarList.map((car => car.carNum)));
        await this.limitConcurrency(taskParamList, checkConcurrencyCount, checkRequestSleep, (async task => {
            const {lastCheckTime: lastCheckTime, name: name2, starId: starId} = task;
            let url = `${this.javDbUrl}/actors/${starId}?t=d`;
            try {
                clog.log("正在检测最新作品, 演员:", name2, url);
                $("#checkNewVideoMsg").text(`正在检测最新作品, 演员: ${name2}`);
                const html = await gmHttp.get(url), $dom = utils.htmlTo$dom(html);
                this.storageQueue.addTask((async () => {
                    await this.parsePage($dom, starId, name2, filterKeywordList, filterActorActressCarNumList);
                }));
            } catch (e) {
                clog.error("检测屏蔽演员信息, 发生错误:", url, e);
                console.error("检测屏蔽演员信息, 发生错误:", url, e);
                show.error("检测屏蔽演员信息, 发生错误:" + e, "bottom", "right");
            }
        }));
        await this.storageQueue.waitAllFinished();
        localStorage.setItem(this.lastCheckNewVideoTimeKey, utils.getNowStr());
        clog.log('<span style="color: #f40">检测最新作品---结束</span>');
        $("#checkNewVideoMsg").text("检测完毕");
        const newVideoPlugin = this.getBean("NewVideoPlugin");
        newVideoPlugin.loadData();
        newVideoPlugin.resetBtnTip().then();
    }
    async parsePage($dom, starId, name2, filterKeywordList, filterActorActressCarNumList) {
        let movieList, nextPageLink, tempIsJavBus = !1, selectorType = "javdb";
        if ($dom.text().includes("javbus")) {
            tempIsJavBus = !0;
            selectorType = "javbus";
        }
        tempIsJavBus && $dom.find(".avatar-box").length > 0 && $dom.find(".avatar-box").parent().remove();
        movieList = $dom.find(this.getSelector(selectorType).requestDomItemSelector);
        nextPageLink = $dom.find(this.getSelector(selectorType).nextPageSelector).attr("href");
        if (nextPageLink && 0 === movieList.length) {
            clog.error("新作品检测-解析列表失败");
            show.error("新作品检测-解析列表失败");
            throw new Error("新作品检测-解析列表失败");
        }
        let carNumList = [], lastPublishTime = null;
        for (const element of movieList) {
            const $item = $(element), {carNum: carNum2, url: url, title: title, publishTime: publishTime} = this.getBoxCarInfo($item);
            if (!carNum2) continue;
            if (!filterKeywordList.find((kw => title.includes(kw) || carNum2.startsWith(kw))) && !filterActorActressCarNumList.has(carNum2)) {
                lastPublishTime || (lastPublishTime = publishTime);
                carNumList.push(carNum2);
            }
        }
        const carList = await storageManager.getCarList(), storageCarNumList = new Set(carList.map((car => car.carNum))), nonExistingCarNumList = carNumList.filter((carNum2 => !storageCarNumList.has(carNum2)));
        nonExistingCarNumList.length > 0 && clog.log(`<span style='color: #f40'>检测出新作品, ${name2}, 共${nonExistingCarNumList.length}部</span>`);
        await storageManager.updateFavoriteActress({
            starId: starId,
            lastCheckTime: utils.getNowStr(),
            newVideoList: nonExistingCarNumList,
            lastPublishTime: lastPublishTime
        });
    }
    async checkOneNewVideo(actress) {
        const filterKeywordList = await storageManager.getTitleFilterKeyword(), filterActorActressCarList = await storageManager.getBlacklistCarList(), filterActorActressCarNumList = new Set(filterActorActressCarList.map((car => car.carNum))), {lastCheckTime: lastCheckTime, name: name2, starId: starId} = actress;
        let url = `${this.javDbUrl}/actors/${starId}?t=d`;
        const $checkNewVideoMsg = $("#checkNewVideoMsg");
        try {
            clog.log("正在检测最新作品, 演员:", name2, url);
            $checkNewVideoMsg.text(`正在检测最新作品, 演员: ${name2}`);
            const html = await gmHttp.get(url), $dom = utils.htmlTo$dom(html);
            await this.parsePage($dom, starId, name2, filterKeywordList, filterActorActressCarNumList);
            clog.log('<span style="color: #f40">检测最新作品---结束</span>');
            $checkNewVideoMsg.text("检测完毕");
            this.getBean("NewVideoPlugin").loadData();
        } catch (e) {
            clog.error("检测屏蔽演员信息, 发生错误:", url, e);
            show.error("检测屏蔽演员信息, 发生错误:" + e, "bottom", "right");
            $checkNewVideoMsg.text(`检测屏蔽演员信息, 发生错误: ${url}`);
        }
    }
}

const CDN_SOURCES = [ {
    name: "jsDelivr (全球CDN)",
    json: "https://cdn.jsdelivr.net/gh/gfriends/gfriends/Filetree.json",
    base: "https://cdn.jsdelivr.net/gh/gfriends/gfriends/Content/"
}, {
    name: "GitHub Raw (备用)",
    json: "https://raw.githubusercontent.com/gfriends/gfriends/master/Filetree.json",
    base: "https://raw.githubusercontent.com/gfriends/gfriends/master/Content/"
} ];

let currentCdnIndex = parseInt(localStorage.getItem("jhs_img_cdn_index") || "0", 10);

(currentCdnIndex >= CDN_SOURCES.length || currentCdnIndex < 0) && (currentCdnIndex = 0);

window.G_FRIENDS_JSON_URL = CDN_SOURCES[currentCdnIndex].json;
window.window.CDN_BASE_URL = CDN_SOURCES[currentCdnIndex].base;

const STORE_NAME = "filetreeStore", dbHelper = {
    db: null,
    async open() {
        return this.db ? this.db : new Promise(((resolve, reject) => {
            const request = indexedDB.open("GfriendsAvatarDB", 1);
            request.onupgradeneeded = event => {
                this.db = event.target.result;
                this.db.objectStoreNames.contains(STORE_NAME) || this.db.createObjectStore(STORE_NAME);
            };
            request.onsuccess = event => {
                this.db = event.target.result;
                resolve(this.db);
            };
            request.onerror = event => {
                console.error("IndexedDB open error:", event.target.errorCode);
                reject(new Error("Failed to open IndexedDB"));
            };
        }));
    },
    async get(key) {
        await this.open();
        return new Promise((resolve => {
            const request = this.db.transaction([ STORE_NAME ], "readonly").objectStore(STORE_NAME).get(key);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve(null);
        }));
    },
    async set(key, value) {
        await this.open();
        return new Promise(((resolve, reject) => {
            const request = this.db.transaction([ STORE_NAME ], "readwrite").objectStore(STORE_NAME).put(value, key);
            request.onsuccess = () => resolve();
            request.onerror = event => {
                console.error("IndexedDB set error:", event.target.errorCode);
                reject(new Error("Failed to write to IndexedDB"));
            };
        }));
    }
};

window.window.G_FRIENDS_DATA_CACHE = null;
window.window.G_FRIENDS_AVATAR_MAP = null;

function buildAvatarMap(rawData) {
    if (!rawData || !rawData.Content) return null;
    const map = {}, contentData = rawData.Content;
    for (const companyName in contentData) {
        const encodedCompany = encodeURIComponent(companyName);
        for (const fileName in contentData[companyName]) {
            let cleanNamePart = fileName.replace(/\.jpg$/i, "").split("-")[0];
            cleanNamePart.startsWith("AI-Fix-") && (cleanNamePart = cleanNamePart.substring(7));
            const actorNameKey = cleanNamePart.toLowerCase().trim();
            if (actorNameKey.length > 0) {
                const actualResourcePath = contentData[companyName][fileName], queryIndex = actualResourcePath.indexOf("?");
                let encodedFileNamePart, queryString = "";
                if (queryIndex > -1) {
                    encodedFileNamePart = encodeURIComponent(actualResourcePath.substring(0, queryIndex));
                    queryString = actualResourcePath.substring(queryIndex);
                } else encodedFileNamePart = encodeURIComponent(actualResourcePath);
                const fullUrl = `${window.CDN_BASE_URL}${encodedCompany}/${encodedFileNamePart}${queryString}`;
                map[actorNameKey] || (map[actorNameKey] = []);
                map[actorNameKey].includes(fullUrl) || map[actorNameKey].push(fullUrl);
            }
        }
    }
    return map;
}

async function searchActorAvatars(searchNames) {
    let loadObj = loading();
    try {
        await async function() {
            if (window.G_FRIENDS_DATA_CACHE && window.G_FRIENDS_AVATAR_MAP) return window.G_FRIENDS_DATA_CACHE;
            let cachedData = null;
            try {
                cachedData = await dbHelper.get("filetree_data");
            } catch (e) {
                console.error("读取 IndexedDB 失败:", e);
            }
            if (cachedData && cachedData.Content) {
                window.G_FRIENDS_DATA_CACHE = cachedData;
                window.G_FRIENDS_AVATAR_MAP = buildAvatarMap(cachedData);
                if (window.G_FRIENDS_AVATAR_MAP) return window.G_FRIENDS_DATA_CACHE;
            }
            show.info("正在载入头像数据源...");
            const response = await fetch(window.G_FRIENDS_JSON_URL);
            if (!response.ok) throw new Error(`请求头像源失败: ${response.status}`);
            const data = await response.json();
            if (data && data.Content) {
                window.G_FRIENDS_DATA_CACHE = data;
                window.G_FRIENDS_AVATAR_MAP = buildAvatarMap(data);
                try {
                    await dbHelper.set("filetree_data", data);
                    clog.debug("载入头像数据源并写入缓存成功!");
                } catch (e) {
                    clog.error(e);
                    show.error("头像数据源写入缓存失败，可能磁盘已满或其他权限问题。");
                }
                return window.G_FRIENDS_DATA_CACHE;
            }
            console.log(data);
            throw new Error("解析头像数据源失败");
        }();
    } catch (e) {
        show.error(e);
        return [];
    } finally {
        loadObj.close();
    }
    if (!window.G_FRIENDS_AVATAR_MAP) return [];
    const foundLinks = new Set, searchKeys = searchNames.map((name2 => name2.toLowerCase().trim())).filter((n => n.length > 0));
    if (0 === searchKeys.length) return [];
    for (const searchKey of searchKeys) {
        const links = window.G_FRIENDS_AVATAR_MAP[searchKey];
        links && links.forEach((link => foundLinks.add(link)));
    }
    return Array.from(foundLinks);
}



export { TaskPlugin, CDN_SOURCES, STORE_NAME, dbHelper, currentCdnIndex };
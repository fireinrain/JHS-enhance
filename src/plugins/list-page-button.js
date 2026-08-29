import { BasePlugin } from '../core/base-plugin.js';
import { __publicField, isJavBus, isJavDb, isSearchPage, currentHref, Status_FAVORITE, NO, YES } from '../core/constants.js';

class ListPageButtonPlugin extends BasePlugin {
    getName() {
        return "ListPageButtonPlugin";
    }
    async handle() {
        if (!window.isListPage) return;
        await this.createMenuBtn();
        this.bindEvent();
        await storageManager.getSetting("autoPage") === YES ? $("#sort-toggle-btn").hide() : this.sortItems().then();
        this.initOneTimeSortBtn();
    }
    async createMenuBtn() {
        const showWaitCheckBtn = await storageManager.getSetting("showWaitCheckBtn", YES), showWaitDownBtn = await storageManager.getSetting("showWaitDownBtn", YES);
        if (isJavDb) {
            const isStarPage = currentHref.includes("/actors/");
            let $el = $(".main-tabs, .tabs"), addBlacklistBtnText = "加入黑名单", addBlacklistBtnColor = "#d22020", otherCss = "", blacklistItem = null;
            if (isStarPage) {
                $el = $(".toolbar, .section-addition").filter(":last");
                const blacklist = await storageManager.getBlacklist(), actressPageInfo = this.getActressPageInfo();
                if (blacklist.find((item => item.starId === actressPageInfo.starId))) {
                    addBlacklistBtnText = "已加入黑名单";
                    addBlacklistBtnColor = "#885d5d";
                }
            } else currentHref.includes("/tags") && utils.loopDetector((() => $("#jhs-check-tag").text().trim()), (async () => {
                const $addBlacklistBtn = $("#addBlacklistBtn");
                $addBlacklistBtn.attr("data-tip", "将当前分类标签加入到黑名单, 后续有作品更新也会纳入屏蔽中");
                const checkTag = $("#jhs-check-tag").text().trim();
                if (!checkTag) return;
                const tagStarId = "no-" + checkTag, blacklist = await storageManager.getBlacklist();
                blacklistItem = blacklist.find((item => item.starId === tagStarId));
                if (blacklistItem) {
                    $addBlacklistBtn.css("backgroundColor", "#885d5d");
                    $("#addBlacklistBtn span").text("已加入黑名单");
                }
            }));
            const isFc2Page2 = currentHref.includes("advanced_search");
            isFc2Page2 ? $el = $("h2.section-title") : otherCss = "flex-grow:1;";
            const jhs_sortMethod = localStorage.getItem("jhs_sortMethod"), sortText = "当前排序方式: " + ("rateCount" === jhs_sortMethod ? "评价人数" : "date" === jhs_sortMethod ? "时间" : "默认");
            $el.append(`\n                <div style="display: flex;align-items: center; ${otherCss} ">\n                    <a id="waitCheckBtn" class="menu-btn main-tab-btn" data-tip="打开未鉴定的列表项, 并自动播放视频" style="background-color:#56c938 !important; ${showWaitCheckBtn === NO ? "display: none" : ""}"><span>打开待鉴定</span></a>\n                    <a id="waitDownBtn" class="menu-btn main-tab-btn" style="background-color:#2caac0 !important; ${showWaitDownBtn === NO ? "display: none" : ""}"><span>打开已收藏</span></a>\n                    ${isStarPage ? `\n                     <a id="addBlacklistBtn" class="menu-btn main-tab-btn" style="background-color:${addBlacklistBtnColor} !important;" data-tip="将演员加入黑名单, 后续有作品更新也会纳入屏蔽中"><span>${addBlacklistBtnText}</span></a>\n                     <a id="filterAllVideo" class="menu-btn main-tab-btn" style="background-color:#e8ab39 !important;margin-right: 30px!important;" data-tip="一键屏蔽已选分类的视频列表至鉴定记录中"><span>一键屏蔽所有作品</span></a>\n                    ` : ""}\n                    ${currentHref.includes("/tags") ? `\n                      <a id="addBlacklistBtn" class="menu-btn main-tab-btn" style="background-color:${addBlacklistBtnColor} !important;" data-tip="将演员加入黑名单, 后续有作品更新也会纳入屏蔽中"><span>${addBlacklistBtnText}</span></a>\n                    ` : ""}\n                </div>\n                <div style="display: flex;align-items: center;">\n                    <a id="one-time-sort-btn" class="menu-btn main-tab-btn" style="background-color:#8783ab !important;">一次性排序: 默认</a>\n                    <a id="newVideoBtn" class="menu-btn main-tab-btn" style="background-color:#2c6cc0 !important;"><span>新作品检测 (<span id="newVideoCount">0</span>)</span></a>\n                    <a id="blacklistBtn" class="menu-btn main-tab-btn" style="background-color:#34393f !important;"><span>演员黑名单</span></a>\n                    ${isSearchPage || isFc2Page2 ? "" : `<a id="sort-toggle-btn" class="menu-btn main-tab-btn" style="background-color:#8783ab !important;"> ${sortText} </a>`}\n                </div>\n            `);
        }
        if (isJavBus) {
            const isStarPage = currentHref.includes("/star/");
            let addBlacklistBtnText = "加入黑名单", addBlacklistBtnColor = "#d22020";
            if (isStarPage) {
                const blacklist = await storageManager.getBlacklist(), actressPageInfo = this.getActressPageInfo();
                if (blacklist.find((item => item.starId === actressPageInfo.starId))) {
                    addBlacklistBtnText = "已加入黑名单";
                    addBlacklistBtnColor = "#885d5d";
                }
            }
            $(".masonry").parent().prepend(`\n                <div style="margin: 10px; display: flex;">\n                    <a id="waitCheckBtn" class="menu-btn main-tab-btn" style="background-color:#56c938 !important; ${showWaitCheckBtn === NO ? "display: none" : ""}"><span>打开待鉴定</span></a>\n                    <a id="waitDownBtn" class="menu-btn main-tab-btn" style="background-color:#2caac0 !important; ${showWaitDownBtn === NO ? "display: none" : ""}"><span>打开已收藏</span></a>\n                    \n                    ${isStarPage ? `    \n                        <a id="addBlacklistBtn" class="menu-btn main-tab-btn" style="background-color:${addBlacklistBtnColor} !important;" data-tip="将演员加入黑名单, 后续有作品更新也会纳入屏蔽中"><span>${addBlacklistBtnText}</span></a>\n                        <a id="filterAllVideo" class="menu-btn main-tab-btn" style="background-color:#e8ab39 !important;" data-tip="一键屏蔽已选分类的视频列表至鉴定记录中"><span>一键屏蔽所有作品</span></a>\n                    ` : '<a id="blacklistBtn" class="menu-btn main-tab-btn" style="background-color:#34393f !important;"><span>演员黑名单</span></a>'}\n                </div>\n            `);
        }
        const newVideoPlugin = window.pluginManager.getBean("NewVideoPlugin");
        newVideoPlugin && newVideoPlugin.showNewVideoCount().then();
    }
    bindEvent() {
        $("#waitCheckBtn").on("click", (event => {
            this.openWaitCheck(event).then();
        }));
        $("#waitDownBtn").on("click", (event => {
            this.openFavorite(event).then();
        }));
        $("#newVideoBtn").on("click", (event => {
            this.getBean("NewVideoPlugin").openDialog();
        }));
        $("#blacklistBtn").on("click", (event => {
            this.getBean("BlacklistPlugin").openBlacklistDialog();
        }));
        $("#sort-toggle-btn").on("click", (event => {
            const currentMethod = localStorage.getItem("jhs_sortMethod") || "default";

            // 1. 定义排序状态的循环顺序
            const sortCycle = ["default", "rateCount", "totalScore", "date"];
            let nextIndex = sortCycle.indexOf(currentMethod) + 1;
            if (nextIndex >= sortCycle.length || nextIndex < 0) nextIndex = 0;

            const newMethod = sortCycle[nextIndex];

            // 2. 映射对应的文本
            const methodText = {
                default: "默认",
                rateCount: "评价人数",
                totalScore: "总分",
                date: "时间"
            }[newMethod];

            $(event.target).text(`当前排序方式: ${methodText}`);
            localStorage.setItem("jhs_sortMethod", newMethod);
            this.sortItems().then();
        }));
        $("#one-time-sort-btn").on("click", (event => {
            const currentMethod = localStorage.getItem("jhs_oneTimeSortMethod") || "default";
            const sortCycle = ["default", "rateCount", "totalScore", "date"];
            let nextIndex = sortCycle.indexOf(currentMethod) + 1;
            if (nextIndex >= sortCycle.length || nextIndex < 0) nextIndex = 0;
            const newMethod = sortCycle[nextIndex];
            const methodText = {
                default: "默认",
                rateCount: "评价人数",
                totalScore: "总分",
                date: "时间"
            }[newMethod];
            $("#one-time-sort-btn").text(`一次性排序: ${methodText}`);
            localStorage.setItem("jhs_oneTimeSortMethod", newMethod);
            this.oneTimeSortItems().then();
        }));
        const blacklistPlugin = this.getBean("BlacklistPlugin");
        $("#addBlacklistBtn").on("click", (async event => {
            await blacklistPlugin.addBlacklist(event);
        }));
        $("#filterAllVideo").on("click", (async event => {
            let tempEvent = {
                clientX: event.clientX,
                clientY: event.clientY + 80
            }, $actor = isJavDb ? $(".actor-section-name") : $(".avatar-box .photo-info .pb10");
            if (0 === $actor.length) {
                show.error("获取演员名称失败");
                return;
            }
            let actorName = $actor.text().trim().split(",")[0];
            utils.q(tempEvent, "一键屏蔽已选分类的视频列表至鉴定记录中?", (async () => {
                this.loadObj = loading();
                try {
                    await blacklistPlugin.filterAllVideo(actorName);
                    window.refresh();
                } catch (e) {
                    console.error(e);
                } finally {
                    this.loadObj.close();
                }
            }));
        }));
    }
    async sortItems() {
        if (currentHref.includes("handle") || currentHref.includes("advanced_search")) return;
        const autoPage = await storageManager.getSetting("autoPage");
        if (isSearchPage || autoPage === YES) return;

        const method = localStorage.getItem("jhs_sortMethod");
        if (!method) return;

        $(".movie-list .item").each((function(index) {
            $(this).attr("data-original-index") || $(this).attr("data-original-index", index);
        }));

        const $container = $(".movie-list"), $items = $(".item", $container);

        if ("default" === method) {
            $items.sort((function(a, b) {
                return $(a).data("original-index") - $(b).data("original-index");
            })).appendTo($container);
        } else {
            const items = $items.get();
            items.sort((function(a, b) {

                // 按评价人数排序
                if ("rateCount" === method) {
                    const getScore = el => {
                        const match = $(el).find(".score .value").text().match(/由(\d+)人/);
                        return match ? parseFloat(match[1]) : 0;
                    };
                    return getScore(b) - getScore(a);
                }
                // 新增：按总分排序 (平均分 * 评价人数)
                else if ("totalScore" === method) {
                    const getTotalScore = el => {
                        const text = $(el).find(".score .value").text();
                        // 分别提取分数和人数，增加容错率
                        const scoreMatch = text.match(/([\d.]+)分/);
                        const countMatch = text.match(/由(\d+)人/);

                        const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0;
                        const count = countMatch ? parseFloat(countMatch[1]) : 0;
                        return score * count;
                    };
                    return getTotalScore(b) - getTotalScore(a);
                }
                // 按时间排序
                else {
                    const getDate = el => {
                        const dateStr = $(el).find(".meta").text().trim();
                        return new Date(dateStr);
                    };
                    return getDate(b) - getDate(a);
                }

            }));
            $container.empty().append(items);
        }
    }

    async initOneTimeSortBtn() {
        const autoPage = await storageManager.getSetting("autoPage");
        if (autoPage !== YES) {
            $("#one-time-sort-btn").hide();
            return;
        }
        const oneTimeMethod = localStorage.getItem("jhs_oneTimeSortMethod") || "default";
        const methodText = {
            default: "默认",
            rateCount: "评价人数",
            totalScore: "总分",
            date: "时间"
        }[oneTimeMethod];
        $("#one-time-sort-btn").text(`一次性排序: ${methodText}`).show();
    }

    async oneTimeSortItems() {
        if (currentHref.includes("handle") || currentHref.includes("advanced_search")) return;
        if (isSearchPage) return;
        const method = localStorage.getItem("jhs_oneTimeSortMethod");
        if (!method) return;
        $(".movie-list .item").each((function (index) {
            $(this).attr("data-original-index") || $(this).attr("data-original-index", index);
        }));
        const $container = $(".movie-list"), $items = $(".item", $container);
        if ("default" === method) {
            $items.sort((function (a, b) {
                return $(a).data("original-index") - $(b).data("original-index");
            })).appendTo($container);
        } else {
            const items = $items.get();
            items.sort((function (a, b) {
                if ("rateCount" === method) {
                    const getScore = el => {
                        const match = $(el).find(".score .value").text().match(/由(\d+)人/);
                        return match ? parseFloat(match[1]) : 0;
                    };
                    return getScore(b) - getScore(a);
                } else if ("totalScore" === method) {
                    const getTotalScore = el => {
                        const text = $(el).find(".score .value").text();
                        const scoreMatch = text.match(/([\d.]+)分/);
                        const countMatch = text.match(/由(\d+)人/);
                        const score = scoreMatch ? parseFloat(scoreMatch[1]) : 0;
                        const count = countMatch ? parseFloat(countMatch[1]) : 0;
                        return score * count;
                    };
                    return getTotalScore(b) - getTotalScore(a);
                } else {
                    const getDate = el => {
                        const dateStr = $(el).find(".meta").text().trim();
                        return new Date(dateStr);
                    };
                    return getDate(b) - getDate(a);
                }
            }));
            $container.empty().append(items);
        }
    }
    async openWaitCheck(event) {
        const maxCount = await storageManager.getSetting("waitCheckCount", 5);
        let count = 0;
        $(`${this.getSelector().itemSelector}:visible`).each(((i, el) => {
            if (count >= maxCount) return !1;
            const $box2 = $(el);
            if ($box2.find(".status-tag").length > 0) return;
            const {carNum: carNum2, aHref: aHref} = this.getBoxCarInfo($box2);
            if (carNum2.includes("FC2-")) {
                const movieId = this.parseMovieId(aHref);
                this.getBean("Fc2Plugin").openFc2Page(movieId, carNum2, aHref);
            } else {
                let url = aHref + (aHref.includes("?") ? "&autoPlay=1" : "?autoPlay=1");
                window.open(url);
            }
            count++;
        }));
        0 === count && show.info("没有需鉴定的视频");
    }
    async openFavorite() {
        let favoriteList, openCount = await storageManager.getSetting("waitCheckCount", 5), randomOpenWaitDown = await storageManager.getSetting("randomOpenWaitDown", NO), dataList = await storageManager.getCarList();
        favoriteList = randomOpenWaitDown === YES ? dataList.filter((item => item.status === Status_FAVORITE)).sort((() => Math.random() - .5)) : dataList.filter((item => item.status === Status_FAVORITE)).sort(((a, b) => b.createDate - a.createDate));
        for (let i = 0; i < openCount; i++) {
            if (i >= favoriteList.length) return;
            let data = favoriteList[i], carNum2 = data.carNum, url = data.url;
            if (carNum2.includes("FC2-")) {
                const movieId = this.parseMovieId(url);
                await this.getBean("Fc2Plugin").openFc2Page(movieId, carNum2, url);
            } else window.open(url);
            clog.debug("打开已收藏", carNum2, url);
        }
    }
}

export const translateText = async (text, sourceLang = "ja", targetLang = "zh-CN") => {
    if (!text) throw new Error("翻译文本不能为空");
    const url = "https://translate-pa.googleapis.com/v1/translate?" + new URLSearchParams({
        "params.client": "gtx",
        dataTypes: "TRANSLATION",
        key: "AIzaSyDLEeFI5OtFBwYBIoK_jj5m32rZK5CkCXA",
        "query.sourceLanguage": sourceLang,
        "query.targetLanguage": targetLang,
        "query.text": text
    }), res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return (await res.json()).translation;
}, TAG_STYLES = {
    IS_FILTERED: {
        text: "🚫 已屏蔽",
        color: "#de3333",
        reasonType: "单番号屏蔽",
        isCounted: !0,
        countKey: "currentPageFilterCount"
    },
    IS_FAVORITE: {
        text: "⭐ 已收藏",
        color: "#25b1dc",
        reasonType: "",
        isCounted: !0,
        countKey: "currentPageFavoriteCount"
    },
    IS_HAS_DOWN: {
        text: "📥️ 已下载",
        color: "#7bc73b",
        reasonType: "",
        isCounted: !0,
        countKey: "currentPageHasDownCount"
    },
    IS_HAS_WATCH: {
        text: "🔍 已观看",
        color: "#d7a80c",
        reasonType: "",
        isCounted: !0,
        countKey: "currentPageHasWatchCount"
    },
    IS_KEYWORD_FILTER: {
        text: "❌ 关键词屏蔽",
        color: "#de3333",
        reasonType: "",
        isCounted: !0,
        countKey: "currentPageKeywordFilterCount"
    },
    IS_ACTOR_FILTER: {
        text: "♂️ 男演员屏蔽",
        color: "#b22222",
        reasonType: "",
        isCounted: !0,
        countKey: "currentPageActorFilterCount"
    },
    IS_ACTRESS_FILTER: {
        text: "♀️ 女演员屏蔽",
        color: "#cd5c5c",
        reasonType: "",
        isCounted: !0,
        countKey: "currentPageActorFilterCount"
    },
    IS_WAIT_CHECK: {
        text: "",
        color: "",
        reasonType: "",
        isCounted: !0,
        countKey: "currentPageWaitCheckCount"
    }
};


export { ListPageButtonPlugin };
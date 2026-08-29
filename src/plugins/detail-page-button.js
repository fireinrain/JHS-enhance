import { BasePlugin } from '../core/base-plugin.js';
import { __publicField, isJavBus, isJavDb, Status_FILTER, Status_FAVORITE, Status_HAS_DOWN, Status_HAS_WATCH, NO, YES } from '../core/constants.js';
import { HotkeyManager } from './preview-video.js';

class DetailPageButtonPlugin extends BasePlugin {
    getName() {
        return "DetailPageButtonPlugin";
    }
    constructor() {
        super();
        this.answerCount = 1;
    }
    async handle() {
        let settingObj = await storageManager.getSetting();
        this.filterHotKey = settingObj.filterHotKey;
        this.favoriteHotKey = settingObj.favoriteHotKey;
        this.hasDownHotKey = settingObj.hasDownHotKey;
        this.hasWatchHotKey = settingObj.hasWatchHotKey;
        this.speedVideoHotKey = settingObj.speedVideoHotKey;
        this.bindHotkey().then();
        this.hideVideoControls();
        window.isDetailPage && this.createMenuBtn();
    }
    async createMenuBtn() {
        const pageInfo = this.getPageInfo(), carNum2 = pageInfo.carNum, buttonsHtml = '\n            <div style="margin: 10px auto; display: flex; justify-content: space-between; align-items: center; flex-wrap:wrap;gap: 20px;">\n                <div style="display: flex; gap: 10px; flex-wrap:wrap;">\n                    <a id="filterBtn" class="menu-btn" style="width: 120px; background-color:#de3333; color: white; text-align: center; padding: 8px 0;">\n                        <span>🚫 屏蔽</span>\n                    </a>\n                    <a id="favoriteBtn" class="menu-btn" style="width: 120px; background-color:#25b1dc; color: white; text-align: center; padding: 8px 0;">\n                        <span>⭐ 收藏</span>\n                    </a>\n                    <a id="hasDownBtn" class="menu-btn" style="width: 120px; background-color:#7bc73b; color: white; text-align: center; padding: 8px 0;">\n                        <span>📥️ 已下载</span>\n                    </a>\n                    <a id="hasWatchBtn" class="menu-btn" style="width: 120px; background-color:#d7a80c; color: white; text-align: center; padding: 8px 0;">\n                        <span>🔍 已观看</span>\n                    </a>\n                </div>\n        \n                <div style="display: flex; gap: 10px; flex-wrap:wrap;">\n                    <a id="enable-magnets-filter" class="menu-btn" style="width: 140px; background-color: #c2bd4c; color: white; text-align: center; padding: 8px 0;">\n                        <span id="magnets-span">关闭磁力过滤</span>\n                    </a>\n                    <a id="magnetSearchBtn" class="menu-btn" style="width: 120px; background: linear-gradient(to right, rgb(245,140,1), rgb(84,161,29)); color: white; text-align: center; padding: 8px 0;">\n                        <span>磁力搜索</span>\n                    </a>\n                    <a id="xunLeiSubtitleBtn" class="menu-btn" style="width: 120px; background: linear-gradient(to left, #375f7c, #2196F3); color: white; text-align: center; padding: 8px 0;">\n                        <span>字幕 (迅雷)</span>\n                    </a>\n                    <a id="search-subtitle-btn" class="menu-btn" style="width: 160px; background: linear-gradient(to bottom, #8d5656, rgb(196,159,91)); color: white; text-align: center; padding: 8px 0;">\n                        <span>字幕 (SubTitleCat)</span>\n                    </a>\n                </div>\n            </div>\n        ';
        isJavDb && $(".tabs").after(buttonsHtml);
        isJavBus && $("#mag-submit-show").before(buttonsHtml);
        $("#favoriteBtn").on("click", (() => this.favoriteOne()));
        $("#filterBtn").on("click", (event => this.filterOne(event)));
        $("#hasDownBtn").on("click", (async () => this.hasDownOne()));
        $("#hasWatchBtn").on("click", (async () => this.hasWatchOne()));
        $("#magnetSearchBtn").on("click", (() => {
            let magnetHub = this.getBean("MagnetHubPlugin").createMagnetHub(pageInfo.carNum);
            layer.open({
                type: 1,
                title: "磁力搜索 " + pageInfo.carNum,
                content: '<div id="magnetHubBox"></div>',
                area: utils.getResponsiveArea([ "60%", "80%" ]),
                scrollbar: !1,
                success: () => {
                    $("#magnetHubBox").append(magnetHub);
                }
            });
        }));
        const highlightMagnetPlugin = this.getBean("HighlightMagnetPlugin"), enableMagnetsFilter = await storageManager.getSetting("enableMagnetsFilter", YES);
        $("#magnets-span").text(enableMagnetsFilter === YES ? "关闭磁力过滤" : "开启磁力过滤");
        enableMagnetsFilter === YES && highlightMagnetPlugin.doFilterMagnet();
        $("#enable-magnets-filter").on("click", (event => {
            let $span = $("#magnets-span");
            if ("关闭磁力过滤" === $span.text()) {
                highlightMagnetPlugin.showAll();
                $span.text("开启磁力过滤");
                storageManager.saveSettingItem("enableMagnetsFilter", NO);
            } else {
                highlightMagnetPlugin.doFilterMagnet();
                $span.text("关闭磁力过滤");
                storageManager.saveSettingItem("enableMagnetsFilter", YES);
            }
        }));
        $("#search-subtitle-btn").on("click", (event => utils.openPage(`https://subtitlecat.com/index.php?search=${carNum2}`, carNum2, !1, event)));
        $("#xunLeiSubtitleBtn").on("click", (() => this.searchXunLeiSubtitle(carNum2)));
        this.showStatus(carNum2).then();
    }
    async showStatus(carNum2) {
        const $filterBtn = $("#filterBtn span"), $favoriteBtn = $("#favoriteBtn span"), $hasDownBtn = $("#hasDownBtn span"), $hasWatchBtn = $("#hasWatchBtn span"), hotKeyDisplay = hotKey => hotKey ? `(${hotKey})` : "";
        $filterBtn.text(`🚫 屏蔽 ${hotKeyDisplay(this.filterHotKey)}`);
        $favoriteBtn.text(`⭐ 收藏 ${hotKeyDisplay(this.favoriteHotKey)}`);
        $hasDownBtn.text(`📥️ 已下载 ${hotKeyDisplay(this.hasDownHotKey)}`);
        $hasWatchBtn.text(`🔍 已观看 ${hotKeyDisplay(this.hasWatchHotKey)}`);
        const car = await storageManager.getCar(carNum2);
        if (car) switch (car.status) {
            case Status_FILTER:
                $filterBtn.text(`🚫 已屏蔽 ${hotKeyDisplay(this.filterHotKey)}`);
                break;

            case Status_FAVORITE:
                $favoriteBtn.text(`⭐ 已收藏 ${hotKeyDisplay(this.favoriteHotKey)}`);
                break;

            case Status_HAS_DOWN:
                $hasDownBtn.text(`📥️ 已标记下载 ${hotKeyDisplay(this.hasDownHotKey)}`);
                break;

            case Status_HAS_WATCH:
                $hasWatchBtn.text(`🔍 已标记观看 ${hotKeyDisplay(this.hasWatchHotKey)}`);
        }
    }
    async favoriteOne() {
        let pageInfo = this.getPageInfo();
        await storageManager.saveCar({
            carNum: pageInfo.carNum,
            url: pageInfo.url,
            names: pageInfo.actress,
            actionType: Status_FAVORITE,
            publishTime: pageInfo.publishTime
        });
        this.showStatus(pageInfo.carNum).then();
        window.refresh();
        utils.closePage();
    }
    async hasDownOne() {
        let pageInfo = this.getPageInfo();
        await storageManager.saveCar({
            carNum: pageInfo.carNum,
            url: pageInfo.url,
            names: pageInfo.actress,
            actionType: Status_HAS_DOWN,
            publishTime: pageInfo.publishTime
        });
        this.showStatus(pageInfo.carNum).then();
        window.refresh();
        utils.closePage();
    }
    async hasWatchOne() {
        let pageInfo = this.getPageInfo();
        await storageManager.saveCar({
            carNum: pageInfo.carNum,
            url: pageInfo.url,
            names: pageInfo.actress,
            actionType: Status_HAS_WATCH,
            publishTime: pageInfo.publishTime
        });
        this.showStatus(pageInfo.carNum).then();
        window.refresh();
        utils.closePage();
    }
    searchXunLeiSubtitle(carNum2) {
        let loadObj = loading();
        gmHttp.get(`https://api-shoulei-ssl.xunlei.com/oracle/subtitle?gcid=&cid=&name=${carNum2}`).then((res => {
            let dataList = res.data;
            dataList && 0 !== dataList.length ? layer.open({
                type: 1,
                title: "迅雷字幕",
                content: '\n                    <div style="height: 100%;overflow:hidden;"> \n                        <div id="xunlei-table-container" style="height: 100%;padding-bottom: 20px"></div>\n                    </div>\n                ',
                scrollbar: !1,
                area: utils.getResponsiveArea([ "60%", "70%" ]),
                anim: -1,
                success: (layero, index) => {
                    new Tabulator("#xunlei-table-container", {
                        layout: "fitColumns",
                        placeholder: "暂无数据",
                        virtualDom: !0,
                        data: dataList,
                        responsiveLayout: "collapse",
                        responsiveLayoutCollapse: !0,
                        columnDefaults: {
                            headerHozAlign: "center",
                            hozAlign: "center"
                        },
                        columns: [ {
                            title: "文件名",
                            field: "name",
                            headerSort: !1,
                            responsive: 0
                        }, {
                            title: "类型",
                            field: "ext",
                            headerSort: !1,
                            responsive: 0
                        }, {
                            title: "操作",
                            responsive: 0,
                            headerSort: !1,
                            formatter: (cell, formatterParams, onRendered) => {
                                const item = cell.getData();
                                onRendered((() => {
                                    const previewButton = cell.getElement().querySelector(".a-primary"), downButton = cell.getElement().querySelector(".a-success");
                                    previewButton && previewButton.addEventListener("click", (async e => {
                                        let url = item.url, name2 = carNum2 + "." + item.ext;
                                        this.previewSubtitle(url, name2);
                                    }));
                                    downButton && downButton.addEventListener("click", (async e => {
                                        let url = item.url, name2 = carNum2 + "." + item.ext, content = await gmHttp.get(url);
                                        utils.download(content, name2);
                                    }));
                                }));
                                return '\n                                        <a class="a-primary">预览</a>\n                                        <a class="a-success">下载</a>\n                                    ';
                            }
                        } ],
                        locale: "zh-cn",
                        langs: {
                            "zh-cn": {
                                pagination: {
                                    first: "首页",
                                    first_title: "首页",
                                    last: "尾页",
                                    last_title: "尾页",
                                    prev: "上一页",
                                    prev_title: "上一页",
                                    next: "下一页",
                                    next_title: "下一页",
                                    all: "所有",
                                    page_size: "每页行数"
                                }
                            }
                        }
                    });
                    utils.setupEscClose(index);
                }
            }) : show.error("迅雷中找不到相关字幕!");
        })).catch((e => {
            console.error(e);
            show.error(e);
        })).finally((() => {
            loadObj.close();
        }));
    }
    async filterOne(event, noAlert) {
        event && event.preventDefault();
        let pageInfo = this.getPageInfo();
        if (noAlert) {
            await storageManager.saveCar({
                carNum: pageInfo.carNum,
                url: pageInfo.url,
                names: pageInfo.actress,
                actionType: Status_FILTER,
                publishTime: pageInfo.publishTime
            });
            this.showStatus(pageInfo.carNum).then();
            window.refresh();
            utils.closePage();
            layer.closeAll();
            this.answerCount = 1;
        } else utils.q(event, `是否屏蔽${pageInfo.carNum}?`, (async () => {
            await storageManager.saveCar({
                carNum: pageInfo.carNum,
                url: pageInfo.url,
                names: pageInfo.actress,
                actionType: Status_FILTER,
                publishTime: pageInfo.publishTime
            });
            this.showStatus(pageInfo.carNum).then();
            window.refresh();
            utils.closePage();
        }), (() => {
            this.answerCount = 1;
        }));
    }
    speedVideo() {
        if ($("#preview-video").is(":visible")) {
            const videoEl = document.getElementById("preview-video");
            if (videoEl) {
                videoEl.muted = !1;
                videoEl.controls = !1;
                if (videoEl.currentTime + 5 < videoEl.duration) videoEl.currentTime += 5; else {
                    show.info("预览视频结束, 已回到开头");
                    videoEl.currentTime = 1;
                }
            }
            return;
        }
        const iframe = $('iframe[id^="layui-layer-iframe"]');
        if (iframe.length > 0) {
            iframe[0].contentWindow.postMessage("speedVideo", "*");
            return;
        }
        let $videoPlayBtn = $(".preview-video-container");
        if ($videoPlayBtn.length > 0) {
            $videoPlayBtn[0].click();
            const videoEl = document.getElementById("preview-video");
            if (videoEl) {
                videoEl.currentTime += 5;
                videoEl.muted = !1;
            }
        } else $("#javTrailersBtn").click();
    }
    hideVideoControls() {
        $(document).on("mouseenter", "#preview-video", (function() {
            $(this).prop("controls", !0);
        }));
    }
    async bindHotkey() {
        const handlers = {};
        this.filterHotKey && (handlers[this.filterHotKey] = () => {
            this.answerCount >= 2 ? this.filterOne(null, !0) : this.filterOne(null);
            this.answerCount++;
        });
        this.favoriteHotKey && (handlers[this.favoriteHotKey] = () => this.favoriteOne(null));
        this.hasDownHotKey && (handlers[this.hasDownHotKey] = () => this.hasDownOne());
        this.hasWatchHotKey && (handlers[this.hasWatchHotKey] = () => this.hasWatchOne());
        this.speedVideoHotKey && (handlers[this.speedVideoHotKey] = () => this.speedVideo());
        const registerHotkey = (key, handler) => {
            HotkeyManager.registerHotkey(key, (event => {
                const activeElement = document.activeElement;
                "INPUT" === activeElement.tagName || "TEXTAREA" === activeElement.tagName || activeElement.isContentEditable || (window.isDetailPage ? handler() : (message => {
                    const childIframe = $(".layui-layer-content iframe");
                    if (0 === childIframe.length) return !1;
                    childIframe[0].contentWindow.postMessage(message, "*");
                })(key));
            }));
        };
        window.isDetailPage && window.addEventListener("message", (event => {
            handlers[event.data] && handlers[event.data]();
        }));
        Object.entries(handlers).forEach((([key, handler]) => {
            registerHotkey(key, handler);
        }));
    }
    async previewSubtitle(url, name2) {
        if (!url) {
            console.error("未提供文件URL");
            return;
        }
        const fileExt = url.split(".").pop().toLowerCase();
        if ("ass" === fileExt || "srt" === fileExt) try {
            let resText = await gmHttp.get(url), title = "字幕预览";
            "ass" === fileExt ? title = "ASS字幕预览 - " + name2 : "srt" === fileExt && (title = "SRT字幕预览 - " + name2);
            const lines = resText.split("\n");
            let numberedContent = "";
            const maxLineNumberLength = String(lines.length).length;
            lines.forEach(((line, index) => {
                const paddedLineNumber = String(index + 1).padStart(maxLineNumberLength, " ");
                numberedContent += `<span style="color:#AAA;">${paddedLineNumber}. </span>${line}\n`;
            }));
            const finalContent = numberedContent;
            layer.open({
                type: 1,
                title: title,
                area: [ "80%", "80%" ],
                scrollbar: !1,
                content: `<div style="padding:15px 5px;background:#1E1E1E;color:#FFF;font-family:Consolas,Monaco,monospace;white-space:pre-wrap;overflow:auto;height:100%;">${finalContent}</div>`,
                btn: [ "下载", "关闭" ],
                btn1: function(index, layero, that) {
                    utils.download(resText, name2);
                    return !1;
                }
            });
        } catch (error) {
            show.error(`预览失败: ${error.message}`);
            console.error("预览字幕文件出错:", error);
        } else show.error("仅支持预览ASS和SRT字幕文件");
    }
}


export { DetailPageButtonPlugin };

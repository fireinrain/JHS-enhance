import { BasePlugin } from '../core/base-plugin.js';
import {
    __publicField,
    isJavBus,
    isJavDb,
    isEligibleDmmCoverCode,
    Status_FILTER,
    Status_FAVORITE,
    Status_HAS_DOWN,
    Status_HAS_WATCH,
    NO,
    YES
} from '../core/constants.js';
import { HotkeyManager } from './preview-video.js';
import {GM_xmlhttpRequest} from 'vite-plugin-monkey/dist/client';
import {getJavxyCover} from '../api/javxy.js';

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
        const pageInfo = this.getPageInfo(), carNum2 = pageInfo.carNum,
            buttonsHtml = '\n            <div style="margin: 10px auto; display: flex; justify-content: space-between; align-items: center; flex-wrap:wrap;gap: 20px;">\n                <div style="display: flex; gap: 10px; flex-wrap:wrap;">\n                    <a id="filterBtn" class="menu-btn" style="width: 120px; background-color:#de3333; color: white; text-align: center; padding: 8px 0;">\n                        <span>🚫 屏蔽</span>\n                    </a>\n                    <a id="favoriteBtn" class="menu-btn" style="width: 120px; background-color:#25b1dc; color: white; text-align: center; padding: 8px 0;">\n                        <span>⭐ 收藏</span>\n                    </a>\n                    <a id="hasDownBtn" class="menu-btn" style="width: 120px; background-color:#7bc73b; color: white; text-align: center; padding: 8px 0;">\n                        <span>📥️ 已下载</span>\n                    </a>\n                    <a id="hasWatchBtn" class="menu-btn" style="width: 120px; background-color:#d7a80c; color: white; text-align: center; padding: 8px 0;">\n                        <span>🔍 已观看</span>\n                    </a>\n                </div>\n        \n                <div style="display: flex; gap: 10px; flex-wrap:wrap;">\n                    <a id="downloadCoverBtn" class="menu-btn" style="width: 140px; background-color: #9b59b6; color: white; text-align: center; padding: 8px 0;">\n                        <span>下载高清封面</span>\n                    </a>\n                    <a id="enable-magnets-filter" class="menu-btn" style="width: 140px; background-color: #c2bd4c; color: white; text-align: center; padding: 8px 0;">\n                        <span id="magnets-span">排序与过滤</span>\n                    </a>\n                    <a id="magnetSearchBtn" class="menu-btn" style="width: 120px; background: linear-gradient(to right, rgb(245,140,1), rgb(84,161,29)); color: white; text-align: center; padding: 8px 0;">\n                        <span>磁力搜索</span>\n                    </a>\n                    <a id="subtitleSearchBtn" class="menu-btn" style="width: 120px; background: linear-gradient(to left, #375f7c, #2196F3); color: white; text-align: center; padding: 8px 0;">\n                        <span>字幕搜索</span>\n                    </a>\n                    <!--\n                    <a id="xunLeiSubtitleBtn" class="menu-btn" style="width: 120px; background: linear-gradient(to left, #375f7c, #2196F3); color: white; text-align: center; padding: 8px 0;">\n                        <span>字幕 (迅雷)</span>\n                    </a>\n                    <a id="search-subtitle-btn" class="menu-btn" style="width: 160px; background: linear-gradient(to bottom, #8d5656, rgb(196,159,91)); color: white; text-align: center; padding: 8px 0;">\n                        <span>字幕 (SubTitleCat)</span>\n                    </a>\n                    -->\n                </div>\n            </div>\n        ';
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
        const highlightMagnetPlugin = this.getBean("HighlightMagnetPlugin"),
            enableMagnetsFilter = await storageManager.getSetting("enableMagnetsFilter", NO);
        if (enableMagnetsFilter === YES) {
            const savedSettings = await storageManager.getSetting("magnetSortAndFilter", "{}");
            let settings;
            try {
                settings = JSON.parse(savedSettings);
            } catch (e) {
                settings = {};
            }
            const sortEnabled = settings.sortEnabled || {};
            const defaultFullSortOrder = isJavBus ? ["date", "size"] : ["date", "size", "files"];
            const fullSortOrder = (settings.sortOrder && settings.sortOrder.length === defaultFullSortOrder.length) ? settings.sortOrder : defaultFullSortOrder;
            const effectiveSortOrder = fullSortOrder.filter(key => sortEnabled[key]);
            const applySettings = {
                filterHD: settings.filterHD || !1,
                filter4K: settings.filter4K || !1,
                filterSubtitle: settings.filterSubtitle || !1,
                filterUncensored: settings.filterUncensored || !1,
                sortOrder: effectiveSortOrder,
            };
            const rowReadyCondition = isJavBus
                ? (() => $("#magnet-table tr").length > 1)
                : (() => $("#magnets-content .item[data-rank]").length > 0);
            utils.loopDetector(rowReadyCondition, () => {
                highlightMagnetPlugin.applySortAndFilter(applySettings);
            });
            $("#magnets-span").text("取消磁力过滤");
        } else {
            $("#magnets-span").text("排序与过滤");
        }
        $("#enable-magnets-filter").on("click", (event => {
            const $span = $("#magnets-span");
            if ("取消磁力过滤" === $span.text()) {
                highlightMagnetPlugin.showAll();
                $span.text("排序与过滤");
                storageManager.saveSettingItem("enableMagnetsFilter", NO);
            } else {
                this.openMagnetSortFilterPanel(highlightMagnetPlugin);
            }
        }));
        $("#subtitleSearchBtn").on("click", (() => {
            window.JavPackSubtitle.openSearchModal({details: {code: carNum2}});
        }));
        $("#downloadCoverBtn").on("click", (async () => {
            if (!isEligibleDmmCoverCode(carNum2)) {
                show.error("当前番号不支持下载高清封面");
                return;
            }
            const $btn = $("#downloadCoverBtn");
            $btn.addClass("is-loading").prop("disabled", true);
            try {
                const coverData = await getJavxyCover(carNum2);
                if (!coverData) {
                    show.error("未找到高清封面");
                    return;
                }
                const coverUrl = coverData.url || coverData.highCover || coverData.cover;
                if (!coverUrl) {
                    show.error("封面链接为空");
                    return;
                }
                const fileName = `${carNum2}-cover.jpg`;
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: coverUrl,
                    responseType: 'blob',
                    onload: (response) => {
                        if (response.status === 200) {
                            const blobUrl = URL.createObjectURL(response.response);
                            const a = document.createElement('a');
                            a.href = blobUrl;
                            a.download = fileName;
                            document.body.appendChild(a);
                            a.click();
                            setTimeout(() => {
                                document.body.removeChild(a);
                                URL.revokeObjectURL(blobUrl);
                            }, 100);
                            show.ok("封面下载已开始");
                        } else {
                            show.error(`封面下载失败: ${response.status}`);
                        }
                    },
                    onerror: () => show.error("封面下载网络错误"),
                    ontimeout: () => show.error("封面下载超时"),
                });
            } catch (e) {
                show.error("获取封面信息失败");
            } finally {
                $btn.removeClass("is-loading").prop("disabled", false);
            }
        }));
        window.JavPackSubtitle.preload115Matches(carNum2);
        // $("#search-subtitle-btn").on("click", (event => utils.openPage(`https://subtitlecat.com/index.php?search=${carNum2}`, carNum2, !1, event)));
        // $("#xunLeiSubtitleBtn").on("click", (() => this.searchXunLeiSubtitle(carNum2)));
        this.showStatus(carNum2).then();
    }

    async openMagnetSortFilterPanel(highlightMagnetPlugin) {
        const existingPanel = document.getElementById("magnet-sort-filter-panel");
        if (existingPanel) {
            existingPanel.remove();
            return;
        }
        const savedSettings = await storageManager.getSetting("magnetSortAndFilter", "{}");
        let settings;
        try {
            settings = JSON.parse(savedSettings);
        } catch (e) {
            settings = {};
        }
        const sortEnabled = settings.sortEnabled || (isJavBus ? {date: !1, size: !1} : {date: !1, size: !1, files: !1});
        const defaultSortOrder = isJavBus ? ["date", "size"] : ["date", "size", "files"];
        const sortOrder = (settings.sortOrder && settings.sortOrder.length === defaultSortOrder.length) ? settings.sortOrder : defaultSortOrder;
        const filterHD = settings.filterHD || !1;
        const filter4K = settings.filter4K || !1;
        const filterSubtitle = settings.filterSubtitle || !1;
        const filterUncensored = settings.filterUncensored || !1;
        const SORT_LABELS = isJavBus ? {date: "发布日期", size: "文件大小"} : {
            date: "发布日期",
            size: "文件大小",
            files: "文件数量"
        };
        const SORT_HINTS = isJavBus ? {date: "从新到旧", size: "从大到小"} : {
            date: "从新到旧",
            size: "从大到小",
            files: "从少到多"
        };
        const FILTER_ITEMS = [
            {key: "HD", label: "高清", checked: filterHD},
            {key: "4K", label: "4K", checked: filter4K},
            {key: "Subtitle", label: "字幕", checked: filterSubtitle},
            {key: "Uncensored", label: "无码", checked: filterUncensored},
        ];
        const currentSortOrder = [...sortOrder];
        const currentSortEnabled = {...sortEnabled};
        const currentFilters = {
            HD: filterHD,
            "4K": filter4K,
            Subtitle: filterSubtitle,
            Uncensored: filterUncensored,
        };
        const buildSortItemsHTML = () => {
            return currentSortOrder.map(key => {
                const checked = currentSortEnabled[key] ? "checked" : "";
                return `<div class="msf-sort-item" draggable="true" data-sort-key="${key}">
                    <span class="msf-drag-handle">⋮⋮</span>
                    <label class="msf-sort-label">
                        <input type="checkbox" class="msf-sort-checkbox" data-sort-key="${key}" ${checked}>
                        ${SORT_LABELS[key]} <span class="msf-sort-hint">${SORT_HINTS[key]}</span>
                    </label>
                </div>`;
            }).join("");
        };
        const buildFilterItemsHTML = () => {
            return FILTER_ITEMS.map(item => {
                const checked = currentFilters[item.key] ? "checked" : "";
                return `<label class="msf-filter-label">
                    <input type="checkbox" class="msf-filter-checkbox" data-filter-key="${item.key}" ${checked}>
                    ${item.label}
                </label>`;
            }).join("");
        };
        const panelHTML = `
            <div class="msf-overlay" id="msf-overlay"></div>
            <div class="msf-panel" id="magnet-sort-filter-panel">
                <div class="msf-header">
                    <span class="msf-title">磁力排序与过滤</span>
                    <span class="msf-close" id="msf-close-btn">&times;</span>
                </div>
                <div class="msf-body">
                    <div class="msf-section">
                        <div class="msf-section-title">排序优先级（拖动调整顺序，勾选启用）</div>
                        <div class="msf-sort-list" id="msf-sort-list">
                            ${buildSortItemsHTML()}
                        </div>
                    </div>
                    <div class="msf-section">
                        <div class="msf-section-title">过滤条件（可多选，并集关系）</div>
                        <div class="msf-filter-list">
                            ${buildFilterItemsHTML()}
                        </div>
                    </div>
                </div>
                <div class="msf-footer">
                    <button class="msf-btn msf-btn-cancel" id="msf-cancel-btn">取消</button>
                    <button class="msf-btn msf-btn-confirm" id="msf-confirm-btn">确认</button>
                </div>
            </div>
        `;
        const wrapper = document.createElement("div");
        wrapper.innerHTML = panelHTML;
        document.body.appendChild(wrapper);
        const panel = document.getElementById("magnet-sort-filter-panel");
        const overlay = document.getElementById("msf-overlay");
        const closePanel = () => {
            panel.remove();
            overlay.remove();
        };
        overlay.addEventListener("click", closePanel);
        document.getElementById("msf-close-btn").addEventListener("click", closePanel);
        document.getElementById("msf-cancel-btn").addEventListener("click", closePanel);
        const rebuildSortList = () => {
            const sortList = document.getElementById("msf-sort-list");
            sortList.innerHTML = buildSortItemsHTML();
            bindSortEvents();
        };
        const bindSortEvents = () => {
            const sortItems = document.querySelectorAll("#msf-sort-list .msf-sort-item");
            sortItems.forEach(item => {
                item.addEventListener("dragstart", (e) => {
                    e.dataTransfer.effectAllowed = "move";
                    e.dataTransfer.setData("text/plain", item.dataset.sortKey);
                    item.classList.add("msf-dragging");
                });
                item.addEventListener("dragend", () => {
                    item.classList.remove("msf-dragging");
                    document.querySelectorAll("#msf-sort-list .msf-sort-item").forEach(el => el.classList.remove("msf-drag-over"));
                });
                item.addEventListener("dragover", (e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    item.classList.add("msf-drag-over");
                });
                item.addEventListener("dragleave", () => {
                    item.classList.remove("msf-drag-over");
                });
                item.addEventListener("drop", (e) => {
                    e.preventDefault();
                    item.classList.remove("msf-drag-over");
                    const fromKey = e.dataTransfer.getData("text/plain");
                    const toKey = item.dataset.sortKey;
                    if (fromKey === toKey) return;
                    const fromIdx = currentSortOrder.indexOf(fromKey);
                    const toIdx = currentSortOrder.indexOf(toKey);
                    currentSortOrder.splice(fromIdx, 1);
                    currentSortOrder.splice(toIdx, 0, fromKey);
                    rebuildSortList();
                });
                const checkbox = item.querySelector(".msf-sort-checkbox");
                checkbox.addEventListener("change", () => {
                    currentSortEnabled[item.dataset.sortKey] = checkbox.checked;
                });
            });
        };
        bindSortEvents();
        document.querySelectorAll(".msf-filter-checkbox").forEach(cb => {
            cb.addEventListener("change", () => {
                currentFilters[cb.dataset.filterKey] = cb.checked;
            });
        });
        document.getElementById("msf-confirm-btn").addEventListener("click", async () => {
            try {
                const enabledSortOrder = currentSortOrder.filter(key => currentSortEnabled[key]);
                const newSettings = {
                    sortOrder: currentSortOrder,
                    sortEnabled: currentSortEnabled,
                    filterHD: currentFilters.HD,
                    filter4K: currentFilters["4K"],
                    filterSubtitle: currentFilters.Subtitle,
                    filterUncensored: currentFilters.Uncensored,
                };
                await storageManager.saveSettingItem("magnetSortAndFilter", JSON.stringify(newSettings));
                const hasAnyFilter = currentFilters.HD || currentFilters["4K"] || currentFilters.Subtitle || currentFilters.Uncensored;
                const hasAnySort = enabledSortOrder.length > 0;
                if (hasAnyFilter || hasAnySort) {
                    await highlightMagnetPlugin.applySortAndFilter({
                        filterHD: currentFilters.HD,
                        filter4K: currentFilters["4K"],
                        filterSubtitle: currentFilters.Subtitle,
                        filterUncensored: currentFilters.Uncensored,
                        sortOrder: enabledSortOrder,
                    });
                    $("#magnets-span").text("取消磁力过滤");
                    await storageManager.saveSettingItem("enableMagnetsFilter", YES);
                } else {
                    highlightMagnetPlugin.showAll();
                    $("#magnets-span").text("排序与过滤");
                    await storageManager.saveSettingItem("enableMagnetsFilter", NO);
                }
            } catch (e) {
                console.error("[磁力排序] 应用失败:", e);
            }
            closePanel();
        });
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

    /*
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
    */
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
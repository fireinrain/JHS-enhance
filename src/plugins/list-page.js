import { BasePlugin } from '../core/base-plugin.js';
import { __publicField, isJavBus, isJavDb, isSearchPage, currentHref, Status_FILTER, Status_FAVORITE, Status_HAS_DOWN, Status_HAS_WATCH, NO, YES } from '../core/constants.js';
import { HotkeyManager } from './preview-video.js';
import { translateText, TAG_STYLES } from './list-page-button.js';

class ListPagePlugin extends BasePlugin {
    constructor() {
        super(...arguments);
        __publicField(this, "currentPageFilterCount", 0);
        __publicField(this, "currentPageFavoriteCount", 0);
        __publicField(this, "currentPageHasDownCount", 0);
        __publicField(this, "currentPageHasWatchCount", 0);
        __publicField(this, "currentPageKeywordFilterCount", 0);
        __publicField(this, "currentPageActorFilterCount", 0);
        __publicField(this, "currentPageWaitCheckCount", 0);
        __publicField(this, "currentPageTotalCount", 0);
        __publicField(this, "cache", localStorage.getItem("jhs_translate") ? JSON.parse(localStorage.getItem("jhs_translate")) : {});
        __publicField(this, "writeQueue", Promise.resolve());
    }
    getName() {
        return "ListPagePlugin";
    }
    async handle() {
        this.cleanRepeatId();
        this.replaceHdImg();
        this.addJumpPageControl();
        this.fixBusTitleBox();
        await this.doFilter();
        this.bindClick().then();
        this.bindListPageHotKey().then();
        this.rememberTagExpand();
        $(this.getSelector().itemSelector + " a").attr("target", "_blank");
        this.checkDom();
    }
    rememberTagExpand() {
        if (!window.location.href.includes("actors")) return;
        const $expandButton = $(".tag-expand");
        if (0 === $expandButton.length) return;
        const isExpanded = "true" === localStorage.getItem("jhs_tag_expand"), $actorTagsContent = $(".actor-tags .content");
        isExpanded && $actorTagsContent.hasClass("collapse") && $expandButton[0].click();
        $expandButton.on("click", (function() {
            const newState = !$actorTagsContent.hasClass("collapse");
            localStorage.setItem("jhs_tag_expand", newState.toString());
        }));
    }
    checkDom() {
        if (!window.isListPage) return;
        const selector = this.getSelector(), targetNode = document.querySelector(selector.boxSelector);
        if (!targetNode) {
            console.error("没有找到容器节点!");
            return;
        }
        const observer = new MutationObserver((async mutations => {
            observer.disconnect();
            try {
                this.replaceHdImg();
                this.addJumpPageControl();
                this.fixBusTitleBox();
                this.getBean("CoverButtonPlugin").addSvgBtn().then();
                await this.doFilter();
                await this.getBean("ListPageButtonPlugin").sortItems();
                $(this.getSelector().itemSelector + " a").attr("target", "_blank");
                this.getBean("AutoPagePlugin").checkLoad();
            } finally {
                observer.observe(targetNode, config);
            }
        })), config = {
            childList: !0,
            subtree: !1
        };
        observer.observe(targetNode, config);
    }
    fixBusTitleBox() {
        if (!isJavBus) return;
        $(this.getSelector().itemSelector).toArray().forEach((ele => {
            var _a2;
            let $box2 = $(ele);
            if ($box2.find(".avatar-box").length > 0) return;
            const title = (null == (_a2 = $box2.find("img").attr("title")) ? void 0 : _a2.trim()) || "";
            $box2.find(".photo-info span:first").contents().first().wrap(`<span class="video-title" title="${title}">${title}</span>`);
            $box2.find("br").remove();
        }));
    }
    cleanRepeatId() {
        if (!isJavBus) return;
        $("#waterfall_h").removeAttr("id").attr("id", "no-page");
        const $waterfalls = $('[id="waterfall"]');
        0 !== $waterfalls.length && $waterfalls.each((function() {
            const $current = $(this);
            if (!$current.hasClass("masonry")) {
                $current.children().insertAfter($current);
                $current.remove();
            }
        }));
    }
    async doFilter() {
        if (!window.isListPage) return;
        let movieList = $(this.getSelector().itemSelector).toArray();
        if (movieList.length) {
            await this.filterMovieList(movieList);
            await this.getBean("WangPan115MatchPlugin").matchMovieList(movieList);
            isJavBus && await this.getBean("BusImgPlugin").logImageHeightsByRow();
        }
    }
    async filterMovieList(movieList) {
        utils.time("累计耗费时间");
        utils.time("读取数据耗时");
        const [carList, filterKeywordList, blacklist, blacklistCarList, settingObj] = await Promise.all([ storageManager.getCarList(), storageManager.getTitleFilterKeyword(), storageManager.getBlacklist(), storageManager.getBlacklistCarList(), storageManager.getSetting() ]), t1 = utils.time("读取数据耗时"), carNumSets = carList.reduce(((dataMap, item) => {
            const statusKey = item.status;
            dataMap.hasOwnProperty(statusKey) && dataMap[statusKey].add(item.carNum);
            return dataMap;
        }), {
            [Status_FILTER]: new Set,
            [Status_FAVORITE]: new Set,
            [Status_HAS_DOWN]: new Set,
            [Status_HAS_WATCH]: new Set
        });
        utils.time("组装数据耗时");
        const starIdToRoleMap = new Map(blacklist.map((item => [ item.starId, item.role ]))), {actorCarNumToNameMap: actorCarNumToNameMap, actressCarNumToNameMap: actressCarNumToNameMap} = blacklistCarList.reduce(((dataMap, carItem) => {
            const role = starIdToRoleMap.get(carItem.starId);
            if (!role) {
                clog.error("黑名单数据源丢失演员信息", carItem);
                return dataMap;
            }
            const targetMap = "actor" === role ? dataMap.actorCarNumToNameMap : dataMap.actressCarNumToNameMap;
            targetMap.has(carItem.carNum) || targetMap.set(carItem.carNum, carItem.names);
            return dataMap;
        }), {
            actorCarNumToNameMap: new Map,
            actressCarNumToNameMap: new Map
        }), t2 = utils.time("组装数据耗时"), settings = {
            showFilterItem: (null == settingObj ? void 0 : settingObj.showFilterItem) ?? NO,
            showFilterActorItem: (null == settingObj ? void 0 : settingObj.showFilterActorItem) ?? NO,
            showFilterKeywordItem: (null == settingObj ? void 0 : settingObj.showFilterKeywordItem) ?? NO,
            showFavoriteItem: (null == settingObj ? void 0 : settingObj.showFavoriteItem) ?? YES,
            showHasDownItem: (null == settingObj ? void 0 : settingObj.showHasDownItem) ?? YES,
            showHasWatchItem: (null == settingObj ? void 0 : settingObj.showHasWatchItem) ?? YES,
            showAllItem: (null == settingObj ? void 0 : settingObj.showAllItem) ?? NO,
            tagPosition: (null == settingObj ? void 0 : settingObj.tagPosition) || "rightTop",
            movieShowType: (null == settingObj ? void 0 : settingObj.movieShowType) || "hide"
        };
        this.currentPageFilterCount = 0;
        this.currentPageFavoriteCount = 0;
        this.currentPageHasDownCount = 0;
        this.currentPageHasWatchCount = 0;
        this.currentPageKeywordFilterCount = 0;
        this.currentPageActorFilterCount = 0;
        this.currentPageWaitCheckCount = 0;
        this.currentPageTotalCount = 0;
        utils.time("处理页面耗时");
        await Promise.all(movieList.map((async ele => {
            let $box2 = $(ele);
            if (isJavBus && $box2.find(".avatar-box").length > 0) return;
            const {carNum: carNum2, title: title} = this.getBoxCarInfo($box2), {filter: filter, favorite: favorite, hasDown: hasDown, hasWatch: hasWatch} = carNumSets, isFavorite = favorite.has(carNum2), isHasDown = hasDown.has(carNum2), isHasWatch = hasWatch.has(carNum2), isFiltered = filter.has(carNum2), isFilterActorMale = actorCarNumToNameMap.has(carNum2), isFilterActorFemale = actressCarNumToNameMap.has(carNum2), isFilterActor = isFilterActorMale || isFilterActorFemale, foundKeyword = filterKeywordList.find((kw => title.includes(kw) || carNum2.startsWith(kw))), isFilterKeyword = !!foundKeyword;
            if (!isSearchPage) {
                let shouldHide = settings.showFavoriteItem === NO && isFavorite || settings.showHasDownItem === NO && isHasDown || settings.showHasWatchItem === NO && isHasWatch || settings.showFilterItem === NO && isFiltered && !(isFavorite || isHasDown || isHasWatch) || settings.showFilterActorItem === NO && isFilterActor || settings.showFilterKeywordItem === NO && isFilterKeyword;
                if ($box2.attr("data-movieShowType") !== settings.movieShowType) {
                    $box2.css("border", "");
                    $box2.children().css("visibility", "");
                    $box2.removeAttr("data-hide");
                    $box2.show();
                }
                const isCurrentlyHidden = $box2.attr("data-hide") === YES;
                settings.showAllItem === YES && (shouldHide = !1);
                if (shouldHide !== isCurrentlyHidden) {
                    shouldHide ? $box2.attr("data-hide", YES) : $box2.removeAttr("data-hide");
                    if ("hide" === settings.movieShowType) shouldHide ? $box2.hide() : $box2.show(); else {
                        if ("visibility" !== settings.movieShowType) throw new Error("movieShowType值有误:" + settings.movieShowType);
                        {
                            const $content = $box2.children(), borderStyle = shouldHide ? "1px solid rgb(192 176 176)" : "none", visibilityValue = shouldHide ? "hidden" : "visible";
                            $box2.css("border", borderStyle);
                            $content.css("visibility", visibilityValue);
                        }
                    }
                    $box2.attr("data-movieShowType") !== settings.movieShowType && $box2.attr("data-movieShowType", settings.movieShowType);
                }
            }
            let tag = TAG_STYLES.IS_WAIT_CHECK, filterReason = null;
            if (isFiltered) tag = TAG_STYLES.IS_FILTERED; else if (isFavorite) tag = TAG_STYLES.IS_FAVORITE; else if (isHasDown) tag = TAG_STYLES.IS_HAS_DOWN; else if (isHasWatch) tag = TAG_STYLES.IS_HAS_WATCH; else if (isFilterKeyword) {
                tag = TAG_STYLES.IS_KEYWORD_FILTER;
                filterReason = foundKeyword || "未知";
            } else if (isFilterActorMale) {
                tag = TAG_STYLES.IS_ACTOR_FILTER;
                filterReason = actorCarNumToNameMap.get(carNum2) || "";
            } else if (isFilterActorFemale) {
                tag = TAG_STYLES.IS_ACTRESS_FILTER;
                filterReason = actressCarNumToNameMap.get(carNum2) || "";
            }
            filterReason || (filterReason = tag.reasonType);
            tag.isCounted && this[tag.countKey]++;
            this.currentPageTotalCount++;
            $box2.find(".status-tag").remove();
            const tagPositionCss = "rightTop" === settings.tagPosition ? "right: 0; top:5px;" : "left: 0; top:5px;";
            if (tag.text) {
                const tagHtml = isJavDb ? `<span class="tag is-success status-tag" data-tip="${filterReason}" title=""\n                        style="margin-right: 5px; border-radius:10px; position:absolute; \n                        z-index:10; background-color: ${tag.color} !important; ${tagPositionCss}">\n                        ${tag.text}\n                    </span>` : `<a class="a-primary status-tag" data-tip="${filterReason}"  title=""\n                        style="margin-right: 5px; padding: 0 5px; color: #fff !important; border-radius:10px; position:absolute; \n                        z-index:10; background-color: ${tag.color} !important; ${tagPositionCss}">\n                        <span class="tag" style="color:#fff !important;">${tag.text}</span>\n                    </a>`;
                isJavDb && $box2.find(".tags").append(tagHtml);
                if (isJavBus) {
                    const $itemTag = $box2.find(".item-tag");
                    $itemTag.length ? $itemTag.append(tagHtml) : $box2.find(".photo-info > span > div").append(tagHtml);
                }
            }
            await this.translate($box2);
        })));
        const t3 = utils.time("处理页面耗时"), t4 = utils.time("累计耗费时间");
        $("#waitDownBtn span").text(`打开已收藏 (${carNumSets.favorite.size})`);
        clog.log(`\n            <table class="countTable" style='border-collapse: collapse; width: 100%'>\n                <tr>\n                    <td colspan="2" style='padding: 3px; border: 1px solid #ccc;'>${t1}</td>\n                    <td colspan="2" style='padding: 3px; border: 1px solid #ccc;'>${t2}</td>\n                </tr>\n                \n                <tr>\n                    <td colspan="2" style='padding: 3px; border: 1px solid #ccc;'>${t3}</td>\n                    <td colspan="2" style='padding: 3px; border: 1px solid #ccc;'>${t4}</td>\n                </tr>\n                <tr>\n                    <td style='padding: 3px; border: 1px solid #ccc; font-weight: bold;'>项目</td>\n                    <td style='padding: 3px; border: 1px solid #ccc; font-weight: bold;'>数量</td>\n                    <td style='padding: 3px; border: 1px solid #ccc; font-weight: bold;'>项目</td>\n                    <td style='padding: 3px; border: 1px solid #ccc; font-weight: bold;'>数量</td>\n                </tr>\n                \n                <tr>\n                    <td style='padding: 3px; border: 1px solid #ccc;'>屏蔽单番号</td>\n                    <td style='padding: 3px; border: 1px solid #ccc;'><strong>${this.currentPageFilterCount}</strong></td>\n                     <td style='padding: 3px; border: 1px solid #ccc;'>收藏</td>\n                    <td style='padding: 3px; border: 1px solid #ccc;'><strong>${this.currentPageFavoriteCount}</strong></td>\n                </tr>\n                \n                <tr>\n                    <td style='padding: 3px; border: 1px solid #ccc;'>屏蔽演员</td>\n                    <td style='padding: 3px; border: 1px solid #ccc;'><strong>${this.currentPageActorFilterCount}</strong></td>\n                    <td style='padding: 3px; border: 1px solid #ccc;'>已下载</td>\n                    <td style='padding: 3px; border: 1px solid #ccc;'><strong>${this.currentPageHasDownCount}</strong></td>\n                </tr>\n                \n                <tr>\n                    <td style='padding: 3px; border: 1px solid #ccc;'>屏蔽关键词</td>\n                    <td style='padding: 3px; border: 1px solid #ccc;'><strong>${this.currentPageKeywordFilterCount}</strong></td>\n                    <td style='padding: 3px; border: 1px solid #ccc;'>已观看</td>\n                    <td style='padding: 3px; border: 1px solid #ccc;'><strong>${this.currentPageHasWatchCount}</strong></td>\n                </tr>\n                \n                <tr>\n                    <td style='padding: 3px; border: 1px solid #ccc;'>待鉴定</td>\n                    <td style='padding: 3px; border: 1px solid #ccc;'><strong>${this.currentPageWaitCheckCount}</strong></td>\n                    <td style='padding: 3px; border: 1px solid #ccc;'></td>\n                    <td style='padding: 3px; border: 1px solid #ccc;'></td>\n                </tr>\n        \n                <tr>\n                    <td style='padding: 3px; border: 1px solid #ccc;'><strong>总数</strong></td>\n                    <td style='padding: 3px; border: 1px solid #ccc;'><strong>${this.currentPageTotalCount}</strong></td>\n                </tr>\n            </table>\n        `);
    }
    async bindClick() {
        let selector = this.getSelector();
        $(selector.boxSelector).on("click", ".item img", (async event => {
            event.preventDefault();
            event.stopPropagation();
            if ($(event.target).closest("div.meta-buttons").length) return;
            const $box2 = $(event.target).closest(".item"), {carNum: carNum2, aHref: aHref} = this.getBoxCarInfo($box2);
            let dialogOpenDetail = await storageManager.getSetting("dialogOpenDetail", YES);
            if (carNum2.includes("FC2-")) {
                let movieId = this.parseMovieId(aHref);
                this.getBean("Fc2Plugin").openFc2Dialog(movieId, carNum2, aHref);
            } else if (dialogOpenDetail === YES) {
                utils.openPage(aHref, carNum2, !0, event);
                this.$currentImage = null;
            } else window.open(aHref);
        }));
        $(selector.boxSelector).on("click", ".item video", (async event => {
            const video = event.currentTarget;
            video.paused ? video.play().catch((e => console.error("播放失败:", e))) : video.pause();
            event.preventDefault();
            event.stopPropagation();
        }));
        $(selector.boxSelector).on("click", ".item .video-title", (async event => {
            if ($(event.target).closest('[class^="jhs-match-"]').length) return;
            const $box2 = $(event.currentTarget).closest(".item"), {carNum: carNum2, aHref: aHref} = this.getBoxCarInfo($box2);
            if (carNum2.includes("FC2-")) {
                event.preventDefault();
                let movieId = this.parseMovieId(aHref);
                this.getBean("Fc2Plugin").openFc2Dialog(movieId, carNum2, aHref);
            }
        }));
        $(selector.boxSelector).on("contextmenu", ".item img, .item video", (async event => {
            event.preventDefault();
            const $box2 = $(event.target).closest(".item"), {carNum: carNum2, url: url, publishTime: publishTime} = this.getBoxCarInfo($box2);
            let $actor = isJavDb ? $(".actor-section-name") : $(".avatar-box .photo-info .pb10"), actorName = "";
            $actor.length && (actorName = $actor.text().trim().split(",")[0].replace("(無碼)", ""));
            utils.q(event, `是否屏蔽番号 ${carNum2}?`, (async () => {
                setTimeout((async () => {
                    actorName || (actorName = await this.parseActressName(url));
                    await storageManager.saveCar({
                        carNum: carNum2,
                        url: url,
                        names: actorName,
                        actionType: Status_FILTER,
                        publishTime: publishTime
                    });
                    window.refresh();
                    show.ok("操作成功");
                }));
            }));
        }));
    }
    async parseActressName(url) {
        let actorName = null;
        if (await storageManager.getSetting("enableSaveActressCarInfo", NO) === YES) {
            clog.debug("鉴定补录演员信息-已启用, 开始解析详情页");
            clog.debug("开始解析演员详情页", url);
            const html = await gmHttp.get(url), $dom = utils.htmlTo$dom(html);
            isJavDb ? actorName = $dom.find(".female").prev().map(((i, el) => $(el).text())).get().join(" ") : isJavBus && (actorName = $dom.find('span[onmouseover*="star_"] a').map(((i, el) => $(el).text())).get().join(" "));
            clog.debug("解析到名称:", actorName);
        }
        return actorName;
    }
    async bindListPageHotKey() {
        this.$currentImage = null;
        $(document).on("mouseenter", this.getSelector().coverImgSelector, (e => {
            this.$currentImage = $(e.currentTarget);
        })).on("mouseleave", this.getSelector().coverImgSelector, (() => {
            this.$currentImage = null;
        }));
        let settingObj = await storageManager.getSetting();
        this.filterHotKey = settingObj.filterHotKey;
        this.favoriteHotKey = settingObj.favoriteHotKey;
        this.hasDownHotKey = settingObj.hasDownHotKey;
        this.hasWatchHotKey = settingObj.hasWatchHotKey;
        this.enableImageHotKey = settingObj.enableImageHotKey || NO;
        this.clogHotKey = settingObj.clogHotKey;
        this.foldCategoryHotKey = settingObj.foldCategoryHotKey;
        this.showFilterItemHotKey = settingObj.showFilterItemHotKey;
        this.showFilterActorItemHotKey = settingObj.showFilterActorItemHotKey;
        this.showFilterKeywordItemHotKey = settingObj.showFilterKeywordItemHotKey;
        this.showFavoriteItemHotKey = settingObj.showFavoriteItemHotKey;
        this.showHasDownItemHotKey = settingObj.showHasDownItemHotKey;
        this.showHasWatchItemHotKey = settingObj.showHasWatchItemHotKey;
        this.showAllItemHotKey = settingObj.showAllItemHotKey;
        const HOTKEY_REGISTRY = {
            showFilterItemHotKey: "showFilterItem",
            showFilterActorItemHotKey: "showFilterActorItem",
            showFilterKeywordItemHotKey: "showFilterKeywordItem",
            showFavoriteItemHotKey: "showFavoriteItem",
            showHasDownItemHotKey: "showHasDownItem",
            showHasWatchItemHotKey: "showHasWatchItem",
            showAllItemHotKey: "showAllItem"
        }, registerToggleHotkey = (hotkeyName, settingKey) => {
            const hotkeyString = this[hotkeyName];
            hotkeyString && HotkeyManager.registerHotkey(hotkeyString, (async event => {
                const newVal = await storageManager.getSetting(settingKey) === YES ? NO : YES;
                await storageManager.saveSettingItem(settingKey, newVal);
                window.refresh();
            }));
        };
        for (const hotkeyName in HOTKEY_REGISTRY) if (HOTKEY_REGISTRY.hasOwnProperty(hotkeyName)) {
            registerToggleHotkey(hotkeyName, HOTKEY_REGISTRY[hotkeyName]);
        }
        if (this.enableImageHotKey === NO) return;
        const handleAction = async (boxInfo, status) => {
            setTimeout((async () => {
                let actorName = await this.parseActressName(boxInfo.url);
                await storageManager.saveCar({
                    carNum: boxInfo.carNum,
                    url: boxInfo.url,
                    names: actorName,
                    actionType: status,
                    publishTime: boxInfo.publishTime
                });
                window.refresh();
                show.ok("操作成功");
            }));
        }, handlers = {};
        this.filterHotKey && (handlers[this.filterHotKey] = boxInfo => {
            handleAction(boxInfo, Status_FILTER);
        });
        this.favoriteHotKey && (handlers[this.favoriteHotKey] = boxInfo => {
            handleAction(boxInfo, Status_FAVORITE);
        });
        this.hasDownHotKey && (handlers[this.hasDownHotKey] = boxInfo => {
            handleAction(boxInfo, Status_HAS_DOWN);
        });
        this.hasWatchHotKey && (handlers[this.hasWatchHotKey] = boxInfo => {
            handleAction(boxInfo, Status_HAS_WATCH);
        });
        this.clogHotKey && HotkeyManager.registerHotkey(this.clogHotKey, (event => {
            clog.toggleExpandCollapsed();
        }));
        this.foldCategoryHotKey && HotkeyManager.registerHotkey(this.foldCategoryHotKey, (event => {
            const $btn = $("#foldCategoryBtn");
            $btn.length && $btn[0].click();
        }));
        const registerImageHotkey = (key, handler) => {
            HotkeyManager.registerHotkey(key, (event => {
                const activeElement = document.activeElement;
                if (!("INPUT" === activeElement.tagName || "TEXTAREA" === activeElement.tagName || activeElement.isContentEditable) && this.$currentImage) {
                    const $box2 = this.$currentImage.closest(".item"), boxInfo = this.getBoxCarInfo($box2);
                    handler(boxInfo);
                }
            }));
        };
        Object.entries(handlers).forEach((([key, handler]) => {
            registerImageHotkey(key, handler);
        }));
    }
    replaceHdImg(coverImgNodeList) {
        coverImgNodeList && "string" == typeof coverImgNodeList.jquery && (coverImgNodeList = coverImgNodeList.toArray());
        coverImgNodeList || (coverImgNodeList = document.querySelectorAll(this.getSelector().coverImgSelector));
        isJavDb && coverImgNodeList.forEach((img => {
            img.src = img.src.replace("thumbs", "covers");
            img.title = "";
        }));
        if (isJavBus) {
            const THUMB_PATH_REGEX = /\/(imgs|pics)\/(thumb|thumbs)\//, IMG_EXT_REGEX = /(\.jpg|\.jpeg|\.png)$/i, replaceWithHd = img => {
                if (img.src && THUMB_PATH_REGEX.test(img.src) && "true" !== img.dataset.hdReplaced) {
                    img.src = img.src.replace(THUMB_PATH_REGEX, "/$1/cover/").replace(IMG_EXT_REGEX, "_b$1");
                    img.dataset.hdReplaced = "true";
                    img.dataset.title = img.title;
                    img.title = "";
                }
            }, DMM_THUMB_REGEX = /ps(\.jpg|\.jpeg|\.png)$/i, replaceWithHdForDMM = img => {
                if (img.src && DMM_THUMB_REGEX.test(img.src) && "true" !== img.dataset.hdReplaced) {
                    img.src = img.src.replace(DMM_THUMB_REGEX, "pl$1");
                    img.dataset.hdReplaced = "true";
                    img.dataset.title = img.title;
                    img.title = "";
                }
            };
            coverImgNodeList.forEach((img => {
                replaceWithHd(img);
                replaceWithHdForDMM(img);
            }));
        }
        storageManager.getSetting("hoverBigImg", NO).then((hoverBigImg => {
            hoverBigImg === YES && (window.imageHoverPreviewObj ? window.imageHoverPreviewObj.bindEvents() : window.imageHoverPreviewObj = new ImageHoverPreview({
                selector: this.getSelector().coverImgSelector
            }));
        }));
    }
    async translate($box2) {
        if (await storageManager.getSetting("translateTitle", YES) !== YES) return;
        let content, carNum2, $title = $box2.find(".video-title");
        if (isJavDb) {
            content = $title.contents().filter(((i, node) => 3 === node.nodeType && "" !== node.textContent.trim())).text().trim();
            carNum2 = $box2.find(".video-title strong").text().trim();
        } else {
            content = $box2.find("img").attr("data-title").trim();
            carNum2 = $box2.find("a").attr("href").split("/").filter(Boolean).pop().trim();
        }
        if (this.cache[carNum2]) {
            let _this = this;
            $title.contents().each((function() {
                3 === this.nodeType && "" !== this.textContent.trim() && (this.textContent = " " + _this.cache[carNum2] + " ");
            }));
            $title.attr("title", _this.cache[carNum2]);
        } else translateText(content).then((result => {
            if (isJavDb) {
                $title.contents().each((function() {
                    3 !== this.nodeType || "" === this.textContent.trim() || this.textContent.includes(carNum2) || (this.textContent = " " + result + " ");
                }));
                $title.attr("title", result);
            } else $title.text(result);
            this.writeQueue = this.writeQueue.then((() => {
                this.cache[carNum2] = result;
                localStorage.setItem("jhs_translate", JSON.stringify(this.cache));
            }));
        })).catch((error => {
            console.error("翻译失败:", error);
        }));
    }
    async revertTranslation() {
        $(this.getSelector().itemSelector).toArray().forEach((ele => {
            let $box2 = $(ele);
            const originalContent = $box2.find(".box").attr("title") || $box2.find(".video-title").attr("title") || $box2.find("img").attr("data-title");
            let carNum2;
            isJavDb && (carNum2 = $box2.find(".video-title strong").text().trim());
            const $title = $box2.find(".video-title");
            $title.contents().each((function() {
                3 !== this.nodeType || "" === this.textContent.trim() || this.textContent.includes(carNum2) || (this.textContent = " " + originalContent + " ");
            }));
            $title.removeAttr("title");
        }));
    }
    addJumpPageControl() {
        if ($("#gemini-jump-page-control").length > 0) return;
        if (0 === $(".pagination-link.is-current").length) return;
        const currentPageNum = utils.getUrlParam(currentHref, "page") || 1, $input = $("<input>", {
            type: "number",
            id: "jumpPageInput",
            placeholder: "页码",
            min: "1",
            style: "width: 60px; margin-left: 10px; padding: 10px; border: 1px solid #ccc; font-size: 14px;",
            value: currentPageNum + 1
        }), $button = $("<button>", {
            text: "跳转",
            style: "margin-left: 5px; padding: 9px 8px; cursor: pointer; border: 1px solid #ccc; background-color: #f0f0f0; font-size: 14px;"
        }), $jumpLi = $("<li>", {
            id: "gemini-jump-page-control"
        }).append($input).append($button);
        $(".pagination-list").append($jumpLi);
        const jumpToPage = () => {
            const pageNumber = parseInt($input.val(), 10);
            if (isNaN(pageNumber) || pageNumber < 1) {
                $input.focus();
                return;
            }
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.set("page", pageNumber.toString());
            window.location.href = newUrl.toString();
        };
        $button.on("click", jumpToPage);
        $input.on("keypress", (function(e) {
            if (13 === e.which) {
                jumpToPage();
                e.preventDefault();
            }
        }));
    }
}


export { ListPagePlugin };
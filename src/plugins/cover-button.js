import { BasePlugin } from '../core/base-plugin.js';
import { __publicField, isJavBus, isJavDb, Status_FILTER, Status_FAVORITE, Status_HAS_DOWN, Status_HAS_WATCH, YES } from '../core/constants.js';
import { GM_openInTab } from 'vite-plugin-monkey/dist/client';

class CoverButtonPlugin extends BasePlugin {
    getName() {
        return "CoverButtonPlugin";
    }
    async initCss() {
        return `\n            <style>\n                .box .tags {\n                    justify-content: space-between;\n                }\n                .tool-box span{\n                    opacity:.6\n                }\n                .tool-box span:hover{\n                    opacity:1\n                }\n                ${isJavBus ? ".tool-box .icon, .setting-label .icon{ height: 24px; width: 24px; }" : ""}\n                .tool-box svg path {\n                  fill: blue;\n                }\n                [data-theme="dark"] .tool-box svg path {\n                  fill: white;\n                }\n                .tool-box .delete115Svg svg path {\n                  fill: #e57373 !important;\n                }\n                [data-theme="dark"] .tool-box .delete115Svg svg path {\n                  fill: #ef9a9a !important;\n                }\n                .tool-box .markDeleteSvg svg path {
                  fill: #81c784 !important;
                }
                [data-theme="dark"] .tool-box .markDeleteSvg svg path {
                  fill: #66bb6a !important;
                }
                .tool-box .markDeleteSvg.marked svg path {
                  fill: #d84315 !important;
                }
                [data-theme="dark"] .tool-box .markDeleteSvg.marked svg path {
                  fill: #e64a19 !important;
                }\n                \n                \n                /* 鼠标移入时的弹性动画 */\n                .elastic-in {\n                    animation: elasticIn 0.2s ease-out forwards;  /* 动画名称 | 时长 | 缓动函数 | 保持最终状态 */\n                }\n                \n                /* 鼠标移出时的弹性动画 */\n                .elastic-out {\n                    animation: elasticOut 0.2s ease-in forwards;\n                }\n                /* 弹性进入动画（像果冻弹入） */\n                @keyframes elasticIn {\n                    0% {\n                        opacity: 0;\n                        transform: scale(0.8);  /* 起始状态：80% 大小 */\n                    }\n                    50% {\n                        opacity: 1;\n                        transform: scale(1.1);  /* 弹到 110%（超调一点） */\n                    }\n                    70% {\n                        transform: scale(0.95); /* 回弹到 95%（模拟弹性阻尼） */\n                    }\n                    100% {\n                        opacity: 1;\n                        transform: scale(1);    /* 最终恢复正常大小 */\n                    }\n                }\n                /* 弹性离开动画（像果冻弹出） */\n                @keyframes elasticOut {\n                    0% {\n                        opacity: 1;\n                        transform: scale(1);    /* 起始状态：正常大小 */\n                    }\n                    30% {\n                        transform: scale(1.05); /* 先弹大一点（105%） */\n                    }\n                    100% {\n                        opacity: 0;\n                        transform: scale(0.8);  /* 最终缩小并消失 */\n                    }\n                }\n                \n                \n                .loading {\n                    opacity: 0.7;\n                    filter: blur(1px);\n                }\n                .loading-spinner {\n                    position: absolute;\n                    top: 50%;\n                    left: 50%;\n                    transform: translate(-50%, -50%);\n                    width: 40px;\n                    height: 40px;\n                    border: 3px solid rgba(255,255,255,.3);\n                    border-radius: 50%;\n                    border-top-color: #fff;\n                    animation: spin 1s ease-in-out infinite;\n                    z-index: 20;\n                }\n                @keyframes spin {\n                    to { transform: translate(-50%, -50%) rotate(360deg); }\n                }\n            </style>\n        `;
    }
    handle() {
        if (window.isListPage) {
            this.addSvgBtn();
            this.bindClick().then();
        }
    }
    async addSvgBtn() {
        $(this.getSelector().itemSelector).toArray().forEach((ele => {
            let $box2 = $(ele);
            if (!($box2.find(".tool-box").length > 0)) {
                isJavDb && $box2.find(".tags").append(`\n                    <div class="tool-box" style="margin-left: auto; display: flex; align-items: center">\n                        <span class="markDeleteSvg" title="标记删除" style="margin-right: 15px; display: none;">${this.markDeleteSvg}</span>\n                        <span class="delete115Svg" title="删除115作品" style="margin-right: 15px; display: none;">${this.removeSvg}</span>\n                        <span class="screenSvg" title="长缩略图" style="margin-right: 15px;">${this.screenSvg}</span>\n                        \n                        <span class="videoSvg" title="播放视频" style="margin-right: 15px;">${this.videoSvg}</span>\n                        \n                        <div class="more-tools-container handleSvg" style="position: relative; margin-right: 15px;">\n                            <div title="鉴定处理" style="padding: 5px; margin: -5px;opacity:.3">${this.handleSvg}</div>\n                            \n                            <div class="more-tools" style=" position: absolute; bottom: 33px; right: -30px; display: none;\n                                background-color: rgba(255, 255, 255, 0);z-index: 10;">\n                                <a class="menu-btn hasWatchBtn" style="background-color:#d7a80c;color:white !important;margin-bottom: 5px"><span style="opacity: 1;">🔍 已观看</span></a>\n                                <a class="menu-btn hasDownBtn" style="background-color:#7bc73b; color:white !important;margin-bottom: 5px"><span style="opacity: 1;">📥️ 已下载</span></a>\n                                <a class="menu-btn favoriteBtn" style="background-color:#25b1dc; color:white !important;margin-bottom: 5px"><span style="opacity: 1;">⭐ 收藏</span></a>\n                                <a class="menu-btn filterBtn" style="background-color:#de3333;   color:white !important;margin-bottom: 5px"><span style="opacity: 1;">🚫 屏蔽</span></a>\n                            </div>\n                        </div>\n                        \n                        <div class="more-tools-container siteSvg"  style="position: relative; margin-right: 15px;">\n                            <div title="第三方网站" style="padding: 5px; margin: -5px;opacity:.3">${this.siteSvg}</div>\n                            \n                             <div class="more-tools" style=" position: absolute; bottom: 33px; right: -30px; display: none;\n                                background-color: rgba(255, 255, 255, 0);z-index: 10;">\n                                <a class="site-btn site-jable" style="color:white !important;margin-bottom: 5px;background-color:#71bb59;">\n                                    <span style="opacity: 1;">Jable</span>\n                                </a>\n                                <a class="site-btn site-avgle" style="margin-bottom: 5px;background-color:#71bb59;">\n                                    <span style="opacity: 1;">Avgle</span>\n                                </a>\n                                <a class="site-btn site-miss-av" style="color:white !important;margin-bottom: 5px;background-color:#71bb59;">\n                                    <span style="opacity: 1;">MissAv</span>\n                                </a>\n                                <a class="site-btn site-123-av" style="color:white !important;margin-bottom: 5px;background-color:#71bb59;">\n                                    <span style="opacity: 1;">123Av</span>\n                                </a>\n                            </div>\n                        </div>\n                        \n                        <div class="more-tools-container copySvg" style="position: relative; margin-right: 15px;">\n                            <div title="复制按钮" style="padding: 5px; margin: -5px;opacity:.3">${this.copySvg}</div>\n                            \n                            <div class="more-tools" style="\n                                position: absolute;\n                                bottom: 20px;\n                                right: -10px;\n                                display: none;\n                                background: white;\n                                box-shadow: 0 2px 8px rgba(0,0,0,0.15);\n                                border-radius: 20px;\n                                padding: 10px 0;\n                                margin-bottom: 15px;\n                                z-index: 10;\n                            ">\n                                <span class="carNumSvg" title="复制番号" style="padding: 5px 10px; white-space: nowrap;">${this.carNumSvg}</span>\n                                <span class="titleSvg" title="复制标题" style="padding: 5px 10px; white-space: nowrap;">${this.titleSvg}</span>\n                                <span class="downSvg" title="下载封面" style="padding: 5px 10px; white-space: nowrap;">${this.downSvg}</span>\n                            </div>\n                        </div>\n                    </div>\n                `);
                if (isJavBus) {
                    if ($box2.find(".avatar-box").length > 0) return;
                    $box2.find(".photo-info").append(`\n                    <div class="tool-box" style="display: flex; align-items: center;justify-content: flex-end">\n                        <span class="markDeleteSvg" title="标记删除" style="margin-right: 15px; display: none;">${this.markDeleteSvg}</span>\n                        <span class="delete115Svg" title="删除115作品" style="margin-right: 15px; display: none;">${this.removeSvg}</span>\n                        <span class="screenSvg" title="长缩略图" style="margin-right: 15px;">${this.screenSvg}</span>\n\n                        <span class="videoSvg" title="播放视频" style="margin-right: 15px;">${this.videoSvg}</span>\n                        \n                        <div class="more-tools-container handleSvg" style="position: relative; margin-right: 15px;">\n                            <div title="鉴定处理" style="padding: 5px; margin: -5px;opacity:.3">${this.handleSvg}</div>\n                            \n                            <div class="more-tools" style=" position: absolute; bottom: 33px; right: -30px; display: none;\n                                background-color: rgba(255, 255, 255, 0);z-index: 10;">\n                                <a class="menu-btn hasWatchBtn" style="background-color:#d7a80c;color:white;margin-bottom: 5px"><span style="opacity: 1;display: inline; color:white !important">🔍 已观看</span></a>\n                                <a class="menu-btn hasDownBtn" style="background-color:#7bc73b; color:white;margin-bottom: 5px"><span style="opacity: 1;display: inline; color:white !important">📥️ 已下载</span></a>\n                                <a class="menu-btn favoriteBtn" style="background-color:#25b1dc; color:white;margin-bottom: 5px"><span style="opacity: 1;display: inline; color:white !important">⭐ 收藏</span></a>\n                                <a class="menu-btn filterBtn" style="background-color:#de3333;   color:white;margin-bottom: 5px"><span style="opacity: 1;display: inline; color:white !important">🚫 屏蔽</span></a>\n                            </div>\n                        </div>\n                        \n                        <div class="more-tools-container siteSvg" style="position: relative; margin-right: 15px;">\n                            <div title="第三方网站" style="padding: 5px; margin: -5px;opacity:.3">${this.siteSvg}</div>\n                            \n                             <div class="more-tools" style=" position: absolute; bottom: 33px; right: -30px; display: none;\n                                background-color: rgba(255, 255, 255, 0);z-index: 10;">\n                                <a class="site-btn site-jable" style="color:white;margin-bottom: 5px;background-color:#71bb59;">\n                                    <span style="opacity: 1;display: inline; color:white !important">Jable</span>\n                                </a>\n                                <a class="site-btn site-avgle" style="margin-bottom: 5px;background-color:#71bb59;">\n                                    <span style="opacity: 1;display: inline; color:white !important">Avgle</span>\n                                </a>\n                                <a class="site-btn site-miss-av" style="color:white;margin-bottom: 5px;background-color:#71bb59;">\n                                    <span style="opacity: 1;display: inline; color:white !important">MissAv</span>\n                                </a>\n                                <a class="site-btn site-123-av" style="color:white;margin-bottom: 5px;background-color:#71bb59;">\n                                    <span style="opacity: 1;display: inline; color:white !important">123Av</span>\n                                </a>\n                            </div>\n                        </div>\n                      \n                        <div class="more-tools-container copySvg" style="position: relative;">\n                            <div title="复制按钮" style="padding: 5px; margin: -5px;opacity:.3">${this.copySvg}</div>\n                            \n                            <div class="more-tools" style="\n                                max-width: 44px;\n                                position: absolute;\n                                bottom: 20px;\n                                right: -10px;\n                                display: none;\n                                background: white;\n                                box-shadow: 0 2px 8px rgba(0,0,0,0.15);\n                                border-radius: 20px;\n                                padding: 10px 0;\n                                margin-bottom: 15px;\n                                z-index: 10;\n                                text-align: center;\n                            ">\n                                <span class="carNumSvg" title="复制番号" style="padding: 5px 10px; white-space: nowrap;display: inline">${this.carNumSvg}</span>\n                                <span class="titleSvg" title="复制标题"  style="padding: 5px 10px; white-space: nowrap;display: inline">${this.titleSvg}</span>\n                                <span class="downSvg" title="下载封面"   style="padding: 5px 10px; white-space: nowrap;display: inline">${this.downSvg}</span>\n                            </div>\n                        </div>\n                    </div>\n                `);
                }
            }
        }));
        this.enableSvgBtn();
    }
    async enableSvgBtn() {
        const settingObj = await storageManager.getSetting(), {enableScreenSvg: enableScreenSvg = YES, enableVideoSvg: enableVideoSvg = YES, enableHandleSvg: enableHandleSvg = YES, enableSiteSvg: enableSiteSvg = YES, enableCopySvg: enableCopySvg = YES} = settingObj;
        [ {
            selector: ".screenSvg",
            enabled: enableScreenSvg
        }, {
            selector: ".videoSvg",
            enabled: enableVideoSvg
        }, {
            selector: ".handleSvg",
            enabled: enableHandleSvg
        }, {
            selector: ".siteSvg",
            enabled: enableSiteSvg
        }, {
            selector: ".copySvg",
            enabled: enableCopySvg
        } ].forEach((({selector: selector, enabled: enabled}) => {
            $(selector).toggle(enabled === YES);
        }));
    }
    async bindClick() {
        this.getSelector();
        const listPagePlugin = this.getBean("ListPagePlugin");
        $(document).on("click", ".more-tools-container", (event => {
            event.preventDefault();
            var $currentTools = $(event.target).closest(".more-tools-container").find(".more-tools");
            $(".more-tools").not($currentTools).stop(!0, !0).removeClass("elastic-in").addClass("elastic-out").hide();
            $currentTools.is(":visible") ? $currentTools.stop(!0, !0).removeClass("elastic-in").addClass("elastic-out").hide() : $currentTools.stop(!0, !0).removeClass("elastic-out").addClass("elastic-in").show();
        }));
        $(document).on("click", (function(event) {
            $(event.target).closest(".more-tools-container").length || $(".more-tools").stop(!0, !0).removeClass("elastic-in").addClass("elastic-out").hide();
        }));
        $(document).on("click", ".videoSvg", (event => {
            event.preventDefault();
            $('.videoSvg[title!="播放视频"]').each(((index, element) => {
                const $otherSvgElement = $(element);
                let $otherBox = $otherSvgElement.closest(".item"), $otherImg = $otherBox.find("img"), {carNum: carNum2} = this.getBoxCarInfo($otherBox);
                this.showImg($otherSvgElement, $otherImg, carNum2);
                $otherSvgElement.html(this.videoSvg).attr("title", "播放视频");
            }));
            const $currentBox = $(event.target).closest(".item"), $svgElement = $currentBox.find(".videoSvg");
            if ("播放视频" === $svgElement.attr("title")) {
                $svgElement.html(this.recoveryVideoSvg).attr("title", "切回封面");
                const {carNum: carNum2} = this.getBoxCarInfo($currentBox);
                let $img = $currentBox.find("img");
                if (!$img.length) {
                    show.error("没有找到图片");
                    return;
                }
                this.showVideo($svgElement, $img, carNum2).then();
            }
        }));
        $(document).on("click", ".screenSvg", (async event => {
            event.preventDefault();
            let loadObj = loading();
            try {
                const $box2 = $(event.currentTarget).closest(".item");
                let {carNum: carNum2} = this.getBoxCarInfo($box2);
                carNum2 = carNum2.replace("FC2-", "");
                const imgUrl = await this.getBean("ScreenShotPlugin").getScreenshot(carNum2);
                loadObj.close();
                showPreviewOverlay(imgUrl, carNum2);
            } catch (error) {
                console.error("图片预览出错:", error);
                show.error("图片预览出错:" + error);
            } finally {
                loadObj.close();
            }
        }));
        $(document).on("click", ".filterBtn, .favoriteBtn, .hasDownBtn, .hasWatchBtn", (event => {
            event.preventDefault();
            event.stopPropagation();
            const $btn = $(event.target).closest(".menu-btn"), $box2 = $btn.closest(".item"), {carNum: carNum2, url: url, publishTime: publishTime} = this.getBoxCarInfo($box2), handleAction = async status => {
                let actress = await listPagePlugin.parseActressName(url);
                await storageManager.saveCar({
                    carNum: carNum2,
                    url: url,
                    names: actress,
                    actionType: status,
                    publishTime: publishTime
                });
                window.refresh();
                show.ok("操作成功");
            };
            $btn.hasClass("filterBtn") ? utils.q(event, `是否屏蔽${carNum2}?`, (() => handleAction(Status_FILTER))) : $btn.hasClass("favoriteBtn") ? handleAction(Status_FAVORITE).then() : $btn.hasClass("hasDownBtn") ? handleAction(Status_HAS_DOWN).then() : $btn.hasClass("hasWatchBtn") && handleAction(Status_HAS_WATCH).then();
            $(".more-tools").stop(!0, !0).removeClass("elastic-in").addClass("elastic-out").hide();
        }));
        const otherSitePlugin = this.getBean("OtherSitePlugin"), missAvUrl = await otherSitePlugin.getMissAvUrl(), jableUrl = await otherSitePlugin.getjableUrl(), avgleUrl = await otherSitePlugin.getAvgleUrl(), av123Url = await otherSitePlugin.getAv123Url();
        $(document).on("click", ".site-jable, .site-avgle, .site-miss-av, .site-123-av", (event => {
            event.preventDefault();
            event.stopPropagation();
            const $currentTarget = $(event.currentTarget), $box2 = $currentTarget.closest(".item"), {carNum: carNum2} = this.getBoxCarInfo($box2);
            let url = null;
            $currentTarget.hasClass("site-jable") ? url = `${jableUrl}/search/${carNum2}/` : $currentTarget.hasClass("site-avgle") ? url = `${avgleUrl}/vod/search.html?wd=${carNum2}` : $currentTarget.hasClass("site-miss-av") ? url = `${missAvUrl}/search/${carNum2}` : $currentTarget.hasClass("site-123-av") && (url = `${av123Url}/ja/search?keyword=${carNum2}`);
            event && (event.ctrlKey || event.metaKey) ? GM_openInTab(url, {
                insert: 0
            }) : window.open(url);
        }));
        $(document).on("click", ".titleSvg, .carNumSvg, .downSvg", (event => {
            event.preventDefault();
            event.stopPropagation();
            const $box2 = $(event.currentTarget).closest(".item"), {carNum: carNum2, title: title} = this.getBoxCarInfo($box2), $img = $box2.find(isJavBus ? ".photo-frame img" : ".cover img");
            $(event.currentTarget).hasClass("titleSvg") ? utils.copyToClipboard("标题", title) : $(event.currentTarget).hasClass("carNumSvg") ? utils.copyToClipboard("番号", carNum2) : $(event.currentTarget).hasClass("downSvg") && fetch($img.attr("src")).then((response => response.blob())).then((blob => {
                utils.download(blob, carNum2 + " " + title + ".jpg");
            }));
        }));
        $(document).on("click", ".markDeleteSvg", (async event => {
            event.preventDefault();
            event.stopPropagation();
            const $btn = $(event.currentTarget);
            const $box2 = $btn.closest(".item");
            const {carNum: carNum2, title: title, publishTime: publishTime, url: url} = this.getBoxCarInfo($box2);
            const score = $box2.find(".score").text().trim() || "无评分";
            let markedList = await storageManager.forage.getItem("markedDeleteList") || [];
            const existingIndex = markedList.findIndex(item => item.carNum === carNum2);
            if (existingIndex > -1) {
                markedList.splice(existingIndex, 1);
                $btn.removeClass("marked");
                $btn.attr("title", "标记删除");
                show.ok(`已取消标记: ${title}`);
            } else {
                markedList.push({
                    carNum: carNum2,
                    title: title,
                    publishTime: publishTime,
                    score: score,
                    url: url,
                    markedTime: new Date().toISOString()
                });
                $btn.addClass("marked");
                $btn.attr("title", "取消标记删除");
                show.ok(`已标记删除: ${title}`);
            }
            await storageManager.forage.setItem("markedDeleteList", markedList);
        }));
        $(document).on("click", ".delete115Svg", (async event => {
            event.preventDefault();
            event.stopPropagation();
            const $btn = $(event.currentTarget);
            const matchData = $btn.attr("data-match");
            if (!matchData) {
                show.error("未找到115匹配数据");
                return;
            }
            const matchList = JSON.parse(matchData);
            const $box2 = $btn.closest(".item");
            const {carNum: carNum2} = this.getBoxCarInfo($box2);
            this.getBean("WangPan115MatchPlugin").showDeleteDialog(carNum2, matchList, (async newMatchList => {
                this.getBean("WangPan115MatchPlugin").updateMatchStatus($box2, carNum2, newMatchList);
            }));
        }));
    }
    showImg($svgElement, $img, carNum2) {
        $svgElement.html(this.videoSvg).attr("title", "播放视频");
        let $video = $(`#${`${carNum2}_preview_video`}`);
        if ($video.length > 0) {
            $video[0].pause();
            $video.parent().hide();
        }
        $img.show();
        $img.removeClass("loading");
        $img.next(".loading-spinner").remove();
    }
    async showVideo($svgElement, $img, carNum2) {
        const id = `${carNum2}_preview_video`;
        let $video = $(`#${id}`);
        if ($video.length > 0) {
            $video.parent().show();
            $video[0].play();
            $img.hide();
            return;
        }
        $img.addClass("loading");
        $img.after('<div class="loading-spinner"></div>');
        const poster = $img.attr("src"), dmmVideoMap = await getDmmVideo(carNum2);
        if (!dmmVideoMap) {
            show.error("未解析到视频");
            this.showImg($svgElement, $img, carNum2);
            return;
        }
        let defaultVideoQuality = await storageManager.getSetting("videoQuality");
        defaultVideoQuality = selectDefaultQuality(Object.keys(dmmVideoMap), defaultVideoQuality);
        let videoUrl = dmmVideoMap[defaultVideoQuality], videoHtml = `\n            <div style="display: flex; justify-content: center; align-items: center; position: absolute; top:0; left:0; height: 100%; width: 100%; z-index: 10; overflow: hidden">\n                <video \n                    src="${videoUrl}" \n                    poster="${poster}" \n                    id="${id}" \n                    controls \n                    loop \n                    muted \n                    playsinline\n                    style="max-height: 100%; max-width: 100%; object-fit: contain"\n                ></video>\n            </div>\n        `;
        isJavBus && (videoHtml = `\n                <div>\n                    <video \n                        src="${videoUrl}" \n                        poster="${poster}" \n                        id="${id}" \n                        controls \n                        loop \n                        muted \n                        playsinline\n                        style="max-height: 100%; max-width: 100%; object-fit: contain"\n                    ></video>\n                </div>\n            `);
        $img.parent().append(videoHtml);
        $img.hide();
        $img.removeClass("loading");
        $img.next(".loading-spinner").remove();
        $video = $(`#${id}`);
        let videoElement = $video[0];
        videoElement.load();
        videoElement.muted = !1;
        videoElement.play();
        $video.trigger("focus");
    }
}


export { CoverButtonPlugin };
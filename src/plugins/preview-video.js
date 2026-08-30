import { BasePlugin } from '../core/base-plugin.js';
import { __publicField, currentHref, NO, YES, qualityOptions } from '../core/constants.js';

class PreviewVideoPlugin extends BasePlugin {
    getName() {
        return "PreviewVideoPlugin";
    }
    async initCss() {
        return "\n            .video-control-btn {\n                min-width:120px;\n                padding: 7px 12px;\n                font-size: 12px;\n                background: rgba(0,0,0,0.7);\n                color: white;\n                border: none;\n                border-radius: 4px;\n                cursor: pointer;\n            }\n            .video-control-btn.active {\n                background-color: #1890ff;\n                color: white;\n                font-weight: bold;\n                border: 2px solid #096dd9;\n            }\n        ";
    }
    async handle() {
        if (!window.isDetailPage) return;
        let settingObj = await storageManager.getSetting();
        this.filterHotKey = settingObj.filterHotKey;
        this.favoriteHotKey = settingObj.favoriteHotKey;
        this.speedVideoHotKey = settingObj.speedVideoHotKey;
        let $preview = $(".preview-video-container");
        $preview.on("click", (event => {
            utils.loopDetector((() => $(".fancybox-content #preview-video").length > 0), (() => {
                this.handleVideo().then();
            }));
        }));
        await storageManager.getSetting("enableLoadPreviewVideo", YES) !== YES || currentHref.includes("autoPlay=1") || this.initDmm().then();
        let href = window.location.href;
        (href.includes("gallery-1") || href.includes("gallery-2")) && utils.loopDetector((() => $(".fancybox-content #preview-video").length > 0), (() => {
            $(".fancybox-content #preview-video").length > 0 && this.handleVideo().then();
        }));
        href.includes("autoPlay=1") && $preview.length > 0 && $preview[0].click();
    }
    async initDmm() {
        try {
            const dmmVideoMap = await getDmmVideo(this.getPageInfo().carNum, !1);
            if (!dmmVideoMap) return;
            let settingDefaultVideoQuality = await storageManager.getSetting("videoQuality");
            clog.debug("解析其它画质预览视频", "设置-期望画质", settingDefaultVideoQuality);
            const defaultVideoUrl = dmmVideoMap[selectDefaultQuality(Object.keys(dmmVideoMap), settingDefaultVideoQuality)];
            clog.log("切换其它画质预览视频: ", defaultVideoUrl);
            const $previewVideoEL = $("#preview-video"), videoEl = $previewVideoEL.length ? $previewVideoEL[0] : null, isVideoElementHidden = !videoEl || utils.isHidden($previewVideoEL);
            if ($previewVideoEL.length) {
                if (videoEl) {
                    const currentTime = videoEl.currentTime;
                    $previewVideoEL.attr("src", defaultVideoUrl);
                    if (!isVideoElementHidden) {
                        clog.debug("播放器已手动打开, 变更进度条");
                        videoEl.currentTime = currentTime;
                        videoEl.play();
                    }
                }
            } else {
                clog.debug("JavDB没有视频播放元素, 开始创建...");
                const videoCoverSrc = $(".column-video-cover img").attr("src");
                $(".preview-images").prepend(`\n                    <a class="preview-video-container" data-fancybox="gallery" href="#preview-video">\n                        <span>預告片</span>\n                        <img src="${videoCoverSrc}" class="video-cover" style="width: 150px; height: auto;" alt="">\n                    </a>\n                `);
                $(".preview-video-container").on("click", (event => {
                    utils.loopDetector((() => $(".fancybox-content #preview-video").length > 0), (async () => {
                        await this.handleVideo();
                    }));
                }));
            }
        } catch (error) {
            clog.error("预加载dmm失败:", error);
        }
    }
    async handleVideo() {
        if (await storageManager.getSetting("enableLoadPreviewVideo", YES) === NO) return;
        const $videoEl = $("#preview-video");
        if (!$videoEl.length) return;
        const $videoContainer = $videoEl.parent();
        $videoContainer.css("position", "relative");
        const videoEl = $videoEl[0], jhs_videoMuted = localStorage.getItem("jhs_videoMuted");
        jhs_videoMuted && (videoEl.muted = "yes" === jhs_videoMuted);
        videoEl.addEventListener("volumechange", (function() {
            localStorage.setItem("jhs_videoMuted", videoEl.muted ? "yes" : "no");
        }));
        let carNum2 = this.getPageInfo().carNum;
        const CACHE_KEY = "jhs_dmm_video";
        let dmmErrorRetryCount = 0;
        const attachVideoErrorHandler = () => {
            videoEl.addEventListener("error", async function onVideoError(e) {
                if (dmmErrorRetryCount >= 2) return;
                dmmErrorRetryCount++;
                clog.warn(`预览视频加载失败(第${dmmErrorRetryCount}次)，清除缓存后重试...`);
                const cachedData = localStorage.getItem(CACHE_KEY) ? JSON.parse(localStorage.getItem(CACHE_KEY)) : {};
                delete cachedData[carNum2];
                localStorage.setItem(CACHE_KEY, JSON.stringify(cachedData));
                const freshMap = await getDmmVideo(carNum2);
                if (!freshMap) {
                    show.error("预览视频获取失败，请稍后重试");
                    return;
                }
                const storedQuality = await storageManager.getSetting("videoQuality");
                const quality = selectDefaultQuality(Object.keys(freshMap), storedQuality);
                const freshUrl = freshMap[quality];
                $videoEl.attr("src", freshUrl);
                videoEl.load();
                videoEl.play();
            }, {once: false});
        };
        attachVideoErrorHandler();
        videoEl.play();
        const dmmVideoMap = await getDmmVideo(carNum2);
        let $bottomToolbar = $("<div></div>").attr("id", "video-bottom-toolbar").css({
            display: "flex",
            gap: "5px",
            "align-items": "center",
            "flex-wrap": "wrap"
        }), $qualityButtonGroup = $("<div></div>").css({
            display: "flex",
            gap: "5px",
            "align-items": "center"
        }), defaultVideoQuality = null;
        if (dmmVideoMap) {
            let storedQuality = await storageManager.getSetting("videoQuality");
            defaultVideoQuality = selectDefaultQuality(Object.keys(dmmVideoMap), storedQuality);
            let defaultVideoUrl = dmmVideoMap[defaultVideoQuality];
            if ($videoEl.attr("src") !== defaultVideoUrl) {
                $videoEl.attr("src", defaultVideoUrl);
                videoEl.load();
                videoEl.play();
            }
            qualityOptions.forEach((option => {
                let dmmVideoUrl = dmmVideoMap[option.quality];
                if (dmmVideoUrl) {
                    const isActive = defaultVideoQuality === option.quality;
                    let qualityButton = $(`\n                    <button class="video-control-btn${isActive ? " active" : ""}" \n                            id="${option.id}" \n                            data-quality="${option.quality}"\n                            data-video-src="${dmmVideoUrl}"\n                            style="min-width: 40px; border: 1px solid #ccc; background-color: ${isActive ? "#007bff" : "#fff"}; color: ${isActive ? "white" : "black"};">\n                        ${option.text}\n                    </button>\n                `);
                    $qualityButtonGroup.append(qualityButton);
                }
            }));
        }
        $bottomToolbar.append($qualityButtonGroup);
        let $functionButtonGroup = $("<div></div>").css({
            display: "flex",
            gap: "5px",
            "align-items": "center",
            "margin-left": "auto"
        }), filterButton = $(`<button class="menu-btn" id="video-filterBtn" style="min-width: 120px; background-color:#de3333;">屏蔽 ${this.filterHotKey ? "(" + this.filterHotKey + ")" : ""}</button>`);
        $functionButtonGroup.append(filterButton);
        let favoriteButton = $(`<button class="menu-btn" id="video-favoriteBtn" style="min-width: 120px; background-color:#25b1dc;">收藏 ${this.favoriteHotKey ? "(" + this.favoriteHotKey + ")" : ""}</button>`);
        $functionButtonGroup.append(favoriteButton);
        let speedButton = $(`<button class="menu-btn" id="speed-btn" style="min-width: 120px; background-color:#76b45d;">快进 ${this.speedVideoHotKey ? "(" + this.speedVideoHotKey + ")" : ""}</button>`);
        $functionButtonGroup.append(speedButton);
        $bottomToolbar.append($functionButtonGroup);
        $videoContainer.append($bottomToolbar);
        $bottomToolbar.on("click", ".video-control-btn", (async e => {
            const $button = $(e.currentTarget), videoSrc = $button.data("video-src");
            if (!$button.hasClass("active")) try {
                const currentTime = videoEl.currentTime;
                $videoEl.attr("src", videoSrc);
                videoEl.load();
                videoEl.currentTime = currentTime;
                await videoEl.play();
                $bottomToolbar.find(".video-control-btn").removeClass("active").css({
                    "background-color": "#fff",
                    color: "black"
                });
                $button.addClass("active").css({
                    "background-color": "#007bff",
                    color: "white"
                });
            } catch (error) {
                console.error("切换画质失败:", error);
            }
        }));
        $("#speed-btn").on("click", (() => {
            this.getBean("DetailPageButtonPlugin").speedVideo();
        }));
        utils.rightClick(document.body, "#speed-btn", (event => {
            this.getBean("DetailPageButtonPlugin").filterOne(event);
        }));
        $("#video-filterBtn").on("click", (event => {
            this.getBean("DetailPageButtonPlugin").filterOne(event);
        }));
        $("#video-favoriteBtn").on("click", (event => {
            this.getBean("DetailPageButtonPlugin").favoriteOne(event);
        }));
    }
}

const _HotkeyManager = class _HotkeyManager {
    constructor() {
        if (new.target === _HotkeyManager) throw new Error("HotkeyManager cannot be instantiated.");
    }
    static registerHotkey(hotkeyString, callback, keyupCallback = null) {
        if (Array.isArray(hotkeyString)) {
            let id_list = [];
            hotkeyString.forEach((hotkey => {
                if (!this.isHotkeyFormat(hotkey)) throw new Error("快捷键格式错误");
                let id = this.recordHotkey(hotkey, callback, keyupCallback);
                id_list.push(id);
            }));
            return id_list;
        }
        if (!this.isHotkeyFormat(hotkeyString)) throw new Error("快捷键格式错误");
        return this.recordHotkey(hotkeyString, callback, keyupCallback);
    }
    static recordHotkey(hotkeyString, callback, keyupCallback) {
        let id = Math.random().toString(36).substr(2);
        this.registerHotKeyMap.set(id, {
            hotkeyString: hotkeyString,
            callback: callback,
            keyupCallback: keyupCallback
        });
        return id;
    }
    static unregisterHotkey(id) {
        this.registerHotKeyMap.has(id) && this.registerHotKeyMap.delete(id);
    }
    static isHotkeyFormat(hotkeyString) {
        return hotkeyString.toLowerCase().split("+").map((k => k.trim())).every((k => [ "ctrl", "shift", "alt" ].includes(k) || 1 === k.length));
    }
    static judgeHotkey(hotkeyString, event) {
        const keyList = hotkeyString.toLowerCase().split("+").map((k => k.trim())), ctrl = keyList.includes("ctrl"), shift = keyList.includes("shift"), alt = keyList.includes("alt"), key = keyList.find((k => "ctrl" !== k && "shift" !== k && "alt" !== k));
        return (this.isMac ? event.metaKey : event.ctrlKey) === ctrl && event.shiftKey === shift && event.altKey === alt && event.key.toLowerCase() === key;
    }
};

__publicField(_HotkeyManager, "isMac", 0 === navigator.platform.indexOf("Mac"));

__publicField(_HotkeyManager, "registerHotKeyMap", new Map);

__publicField(_HotkeyManager, "handleKeydown", (event => {
    for (const [id, data] of _HotkeyManager.registerHotKeyMap) {
        let hotkeyString = data.hotkeyString, callback = data.callback;
        _HotkeyManager.judgeHotkey(hotkeyString, event) && callback(event);
    }
}));

__publicField(_HotkeyManager, "handleKeyup", (event => {
    for (const [id, data] of _HotkeyManager.registerHotKeyMap) {
        let hotkeyString = data.hotkeyString, keyupCallback = data.keyupCallback;
        keyupCallback && (_HotkeyManager.judgeHotkey(hotkeyString, event) && keyupCallback(event));
    }
}));

let HotkeyManager = _HotkeyManager;

document.addEventListener("keydown", (event => {
    HotkeyManager.handleKeydown(event);
}));

document.addEventListener("keyup", (event => {
    HotkeyManager.handleKeyup(event);
}));


export { PreviewVideoPlugin, HotkeyManager };
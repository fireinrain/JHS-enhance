import './core/globals.js';
import './lib/gm-xhr-parallel.js';
import { __defProp, __typeError, __publicField, __privateMethod, currentHref, isJavDb, isJavBus, isSearchPage, Status_RUNNING, Status_SUCCESS, Status_FAIL, Status_LOADING, Status_FILTER, Status_FAVORITE, Status_HAS_DOWN, Status_HAS_WATCH, NO, YES, qualityOptions, detailPageCss$1, javBusStyle, detailPageCss, javdbStyle, mainCss, insertStyle } from './core/constants.js';
import { StorageManager } from './core/storage.js';
import { Utils } from './core/utils.js';
import { GmHttp } from './core/gmHttp.js';
import { PluginManager } from './core/plugin-manager.js';
import { BasePlugin } from './core/base-plugin.js';

import { javDbApi, buildSignature, apiUrl } from './api/javdb.js';
window.javDbApi = javDbApi;
import { DmmVideoFetcher, getDmmVideo, selectDefaultQuality } from './api/dmm.js';
import { SettingPlugin } from './plugins/setting.js';
import { NewVideoPlugin } from './plugins/new-video.js';
import { HistoryPlugin } from './plugins/history.js';
import { DetailPagePlugin } from './plugins/detail-page.js';
import { PreviewVideoPlugin } from './plugins/preview-video.js';
import { JavTrailersPlugin } from './plugins/jav-trailers.js';
import { SubTitleCatPlugin } from './plugins/subtitle-cat.js';
import {JavPackSubtitle} from './plugins/subtitles.js';
import {Req115} from './plugins/req115.js';
import { Fc2Plugin } from './plugins/fc2.js';
import { HighlightMagnetPlugin } from './plugins/highlight-magnet.js';
import { FoldCategoryPlugin } from './plugins/fold-category.js';
import { ActressInfoPlugin } from './plugins/actress-info.js';
import { AliyunPanPlugin } from './plugins/aliyun-pan.js';
import { HitShowPlugin } from './plugins/hit-show.js';
import { TOP250Plugin } from './plugins/top250.js';
import { NavBarPlugin } from './plugins/nav-bar.js';
import { BusDetailPagePlugin } from './plugins/bus-detail-page.js';
import { BusPreviewVideoPlugin } from './plugins/bus-preview-video.js';
import {JavopenPreviewVideoPlugin} from './plugins/javopen-preview-video.js';
import { ImageRecognitionPlugin } from './plugins/image-recognition.js';
import { BusNavBarPlugin } from './plugins/bus-nav-bar.js';
import { RelatedPlugin } from './plugins/related.js';
import { WantAndWatchedVideosPlugin } from './plugins/want-watched.js';
import { MagnetHubPlugin } from './plugins/magnet-hub.js';
import { ScreenShotPlugin } from './plugins/screenshot.js';
import { WangPan115TaskPlugin } from './plugins/wangpan-115-task.js';
import { WangPan115Plugin, WangPan115MatchPlugin } from './plugins/wangpan-115.js';
import { FavoriteActressesPlugin } from './plugins/favorite-actresses.js';
import { BusImgPlugin } from './plugins/bus-img.js';
import { TranslatePlugin } from './plugins/translate.js';
import { OtherSitePlugin } from './plugins/other-site.js';
import { ReviewPlugin } from './plugins/review.js';
import { FilterTitleKeywordPlugin } from './plugins/filter-title-keyword.js';
import { ListPageButtonPlugin } from './plugins/list-page-button.js';
import { CoverButtonPlugin } from './plugins/cover-button.js';
import { Fc2By123AvPlugin } from './plugins/fc2-by123av.js';
import { TaskPlugin } from './plugins/task.js';
import { DetailPageButtonPlugin } from './plugins/detail-page-button.js';
import { BlacklistPlugin } from './plugins/blacklist.js';
import { ListPagePlugin } from './plugins/list-page.js';
import { AutoPagePlugin } from './plugins/auto-page.js';

const _unsafeWindow = (() => typeof unsafeWindow !== 'undefined' ? unsafeWindow : window)();

_unsafeWindow.utils = window.utils = new Utils();
_unsafeWindow.gmHttp = window.gmHttp = new GmHttp();
_unsafeWindow.storageManager = window.storageManager = new StorageManager();


const senderChannel = new BroadcastChannel("jhs-channel");

window.refresh = function() {
    senderChannel.postMessage({
        type: "refresh"
    });
};

window.clean_cacheBlacklistCarList = function() {
    storageManager.cacheBlacklistCarList && (storageManager.cacheBlacklistCarList = null);
    senderChannel.postMessage({
        type: "clean_cacheBlacklistCarList"
    });
};

window.clean_cacheSettingObj = function() {
    storageManager.cacheSettingObj && (storageManager.cacheSettingObj = null);
    senderChannel.postMessage({
        type: "clean_cacheSettingObj"
    });
};

window.clean_cacheFavoriteActressList = function() {
    storageManager.cacheFavoriteActressList && (storageManager.cacheFavoriteActressList = null);
    senderChannel.postMessage({
        type: "clean_cacheFavoriteActressList"
    });
};

window.clean_cacheCarList = function() {
    storageManager.cacheCarList && (storageManager.cacheCarList = null);
    senderChannel.postMessage({
        type: "clean_cacheCarList"
    });
};

new BroadcastChannel("jhs-channel").addEventListener("message", (async event => {
    let dataType = event.data.type;
    if ("refresh" === dataType) {
        const listPagePlugin = window.pluginManager.getBean("ListPagePlugin");
        await listPagePlugin.doFilter();
        const historyPlugin = window.pluginManager.getBean("HistoryPlugin");
        historyPlugin.tableObj && historyPlugin.tableObj.setData();
        const newVideoPlugin = window.pluginManager.getBean("NewVideoPlugin");
        if (newVideoPlugin) {
            newVideoPlugin.showNewVideoCount().then();
            newVideoPlugin.loadData();
        }
    } else "clean_cacheBlacklistCarList" === dataType ? storageManager.cacheBlacklistCarList && (storageManager.cacheBlacklistCarList = null) : "clean_cacheSettingObj" === dataType ? storageManager.cacheSettingObj && (storageManager.cacheSettingObj = null) : "clean_cacheFavoriteActressList" === dataType ? storageManager.cacheFavoriteActressList && (storageManager.cacheFavoriteActressList = null) : "clean_cacheCarList" === dataType && storageManager.cacheCarList && (storageManager.cacheCarList = null);
}));

!function() {
    document.head.insertAdjacentHTML("beforeend", '\n        <style>\n            .loading-container {\n                position: fixed;\n                top: 0;\n                left: 0;\n                width: 100%;\n                height: 100%;\n                display: flex;\n                flex-direction: column; /* 垂直排列 */\n                justify-content: center;\n                align-items: center;\n                background-color: rgba(0, 0, 0, 0.1);\n                z-index: 99999999;\n            }\n    \n            .loading-animation {\n                position: relative;\n                width: 60px;\n                height: 12px;\n                background: linear-gradient(90deg, #4facfe 0%, #00f2fe 100%);\n                border-radius: 6px;\n                animation: loading-animate 1.8s ease-in-out infinite;\n                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);\n                margin-bottom: 30px; /* 和按钮之间留出间距 */\n            }\n    \n            .loading-animation:before,\n            .loading-animation:after {\n                position: absolute;\n                display: block;\n                content: "";\n                animation: loading-animate 1.8s ease-in-out infinite;\n                height: 12px;\n                border-radius: 6px;\n                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);\n            }\n    \n            .loading-animation:before {\n                top: -20px;\n                left: 10px;\n                width: 40px;\n                background: linear-gradient(90deg, #ff758c 0%, #ff7eb3 100%);\n            }\n    \n            .loading-animation:after {\n                bottom: -20px;\n                width: 35px;\n                background: linear-gradient(90deg, #ff9a9e 0%, #fad0c4 100%);\n            }\n            \n            /* 新增按钮样式 */\n            .loading-close-btn {\n                padding: 8px 15px;\n                border: none;\n                border-radius: 4px;\n                background-color: #f44336; /* 红色背景 */\n                color: white;\n                cursor: pointer;\n                font-size: 14px;\n                opacity: 0; /* 默认隐藏 */\n                transition: opacity 0.3s ease; /* 渐变效果 */\n            }\n\n            .loading-close-btn.visible {\n                opacity: 1; /* 3秒后显示 */\n            }\n    \n            @keyframes loading-animate {\n                0% {\n                    transform: translateX(40px);\n                }\n                50% {\n                    transform: translateX(-30px);\n                }\n                100% {\n                    transform: translateX(40px);\n                }\n            }\n        </style>\n    ');
    _unsafeWindow.loading = window.loading = function() {
        const container = document.createElement("div");
        container.className = "loading-container";
        const animation = document.createElement("div");
        animation.className = "loading-animation";
        const closeBtn = document.createElement("button");
        closeBtn.className = "loading-close-btn";
        closeBtn.textContent = "关闭";
        closeBtn.addEventListener("click", (() => {
            close();
        }));
        setTimeout((() => {
            closeBtn.classList.add("visible");
        }), 3e3);
        container.appendChild(animation);
        container.appendChild(closeBtn);
        document.body.appendChild(container);
        const close = () => {
            container && container.parentNode && container.parentNode.removeChild(container);
        };
        return {
            close: close
        };
    };
}();

!function() {
    const showMessage = (msg, type, gravityOrOptions, positionOrOptions, options) => {
        let finalOptions;
        if ("object" == typeof gravityOrOptions) finalOptions = gravityOrOptions; else {
            finalOptions = "object" == typeof positionOrOptions ? positionOrOptions : options || {};
            finalOptions.gravity = gravityOrOptions || "top";
            finalOptions.position = "string" == typeof positionOrOptions ? positionOrOptions : "center";
        }
        finalOptions.gravity && "center" !== finalOptions.gravity || (finalOptions.offset = {
            y: "calc(50vh - 150px)"
        });
        const colors_infoStart = "#60A5FA", colors_infoEnd = "#93C5FD", colors_successStart = "#10B981", colors_successEnd = "#6EE7B7", colors_errorStart = "#EF4444", colors_errorEnd = "#FCA5A5", commonStyles = {
            borderRadius: "12px",
            color: "white",
            padding: "12px 16px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            minWidth: "150px",
            textAlign: "center",
            zIndex: 999999999
        }, defaultConfig = {
            text: msg,
            duration: 1e3,
            close: !1,
            gravity: "top",
            position: "center",
            style: {
                info: {
                    ...commonStyles,
                    background: `linear-gradient(to right, ${colors_infoStart}, ${colors_infoEnd})`
                },
                success: {
                    ...commonStyles,
                    background: `linear-gradient(to right, ${colors_successStart}, ${colors_successEnd})`
                },
                error: {
                    ...commonStyles,
                    background: `linear-gradient(to right, ${colors_errorStart}, ${colors_errorEnd})`
                }
            }[type],
            stopOnFocus: !0,
            oldestFirst: !1,
            ...finalOptions
        };
        -1 === defaultConfig.duration && (defaultConfig.close = !0);
        const toast = Toastify(defaultConfig);
        toast.showToast();
        toast.closeShow = () => {
            toast.toastElement.remove();
        };
        return toast;
    };
    _unsafeWindow.show = window.show = {
        ok: (msg, gravityOrOptions = "center", positionOrOptions, options) => showMessage(msg, "success", gravityOrOptions, positionOrOptions, options),
        error: (msg, gravityOrOptions = "center", positionOrOptions, options) => showMessage(msg, "error", gravityOrOptions, positionOrOptions, options),
        info: (msg, gravityOrOptions = "center", positionOrOptions, options) => showMessage(msg, "info", gravityOrOptions, positionOrOptions, options)
    };
}();

!function() {
    document.head.insertAdjacentHTML("beforeend", "\n        <style>\n            .viewer-canvas {\n                overflow: auto !important;\n            }\n            \n            .viewer-close {\n                background: rgba(255,0,0,0.6) !important;\n            }\n            .viewer-close:hover {\n                background: rgba(255,0,0,0.8) !important;\n            }\n        </style>\n    ");
    function smartToggleBodyScroll2(waitTime = 10) {
        setTimeout((() => {
            const openLayerCount = document.querySelectorAll(".layui-layer-shade").length;
            document.documentElement.style.overflow = openLayerCount > 0 ? "hidden" : "";
        }), waitTime);
    }
    window.showImageViewer = function(imgUrlOrContainer, altText = "") {
        let $container = null, isTempContainer = !1;
        if ("string" == typeof imgUrlOrContainer || imgUrlOrContainer instanceof String) {
            $container = $('<div class="temporary-container" style="display:none;">').append(`<img src="${imgUrlOrContainer}" alt="${altText}">`).appendTo("body");
            isTempContainer = !0;
        } else $container = $(imgUrlOrContainer);
        const options = {
            zIndex: 999999990,
            navbar: !1,
            zoomOnWheel: !1,
            zoomRatio: .1,
            toggleOnDblclick: !1,
            toolbar: {
                zoomIn: 1,
                zoomOut: 1,
                reset: 1,
                rotateLeft: 0,
                rotateRight: 0,
                flipHorizontal: 0,
                flipVertical: 0
            },
            title: !1,
            keyboard: !1,
            viewed() {
                viewerInstance.zoomTo(1.4);
                let left = (viewerInstance.viewerData.width - viewerInstance.imageData.width) / 2;
                viewerInstance.moveTo(left, 0);
            },
            shown() {
                isTempContainer && $container.remove();
                document.documentElement.style.overflow = "hidden";
                document.body.style.overflow = "hidden";
                viewerInstance.handleKeydown = function(e) {
                    if ("Escape" === e.key || " " === e.key) {
                        e.preventDefault();
                        e.stopPropagation();
                        viewerInstance.destroy();
                        document.removeEventListener("keydown", viewerInstance.handleKeydown);
                        document.documentElement.style.overflow = "";
                        document.body.style.overflow = "";
                        smartToggleBodyScroll2();
                    }
                };
                document.addEventListener("keydown", viewerInstance.handleKeydown);
            },
            hidden() {
                viewerInstance && viewerInstance.handleKeydown && document.removeEventListener("keydown", viewerInstance.handleKeydown);
                viewerInstance.destroy();
                document.documentElement.style.overflow = "";
                document.body.style.overflow = "";
                smartToggleBodyScroll2();
            }
        }, viewerInstance = new Viewer($container[0], options);
        viewerInstance.show();
    };
}();

window.ImageHoverPreview = class {
    constructor(options = {}) {
        this.config = {
            selector: ".hover-preview",
            dataAttribute: "data-full",
            maxWidth: 1e3,
            maxHeight: 1e3,
            offsetX: 20,
            offsetY: 20,
            zIndex: 9999999999,
            transition: .2,
            autoAdjustPosition: !0,
            ...options
        };
        this.preview = null;
        this.currentTarget = null;
        this.timer = null;
        this.imgElement = null;
        this.boundElements = new WeakSet;
        this.init();
    }
    init() {
        this.injectStyles();
        this.createPreviewElement();
        this.bindEvents();
    }
    injectStyles() {
        const css = `\n                <style>\n                    .image-hover-preview {\n                        position: fixed;\n                        display: none;\n                        z-index: ${this.config.zIndex};\n                        border-radius: 4px;\n                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);\n                        overflow: hidden;\n                        pointer-events: none;\n                        opacity: 0;\n                        transition: opacity ${this.config.transition}s ease;\n                        background-color: #fff;\n                    }\n                    \n                    .image-hover-preview.active {\n                        opacity: 1;\n                    }\n                    \n                    .image-hover-preview img {\n                        max-width: ${this.config.maxWidth + "px"};\n                        max-height: ${this.config.maxHeight + "px"};\n                        display: block;\n                        object-fit: contain;\n                    }\n                    \n                    .image-hover-preview::after {\n                        content: '';\n                        position: absolute;\n                        top: 0;\n                        left: 0;\n                        right: 0;\n                        bottom: 0;\n                        background: rgba(0, 0, 0, 0.03);\n                        pointer-events: none;\n                    }\n                    \n                    .image-hover-preview.loading::before {\n                        content: '加载中...';\n                        position: absolute;\n                        top: 50%;\n                        left: 50%;\n                        transform: translate(-50%, -50%);\n                        color: #666;\n                        font-size: 14px;\n                    }\n                </style>\n            `;
        document.head.insertAdjacentHTML("beforeend", css);
    }
    createPreviewElement() {
        this.preview = document.createElement("div");
        this.preview.className = "image-hover-preview";
        document.body.appendChild(this.preview);
    }
    bindEvents() {
        document.querySelectorAll(this.config.selector).forEach((el => {
            if (!this.boundElements.has(el)) {
                el.addEventListener("mouseenter", (e => this.handleMouseEnter(e)));
                el.addEventListener("mouseleave", (e => this.handleMouseLeave(e)));
                el.addEventListener("mousemove", (e => this.handleMouseMove(e)));
                this.boundElements.add(el);
            }
        }));
    }
    handleMouseEnter(e) {
        clearTimeout(this.timer);
        this.currentTarget = e.currentTarget;
        const imgUrl = this.currentTarget.getAttribute(this.config.dataAttribute) || this.currentTarget.src;
        if (!imgUrl) return;
        this.preview.innerHTML = "";
        this.preview.classList.add("loading");
        this.preview.style.display = "block";
        this.preview.classList.remove("active");
        const img = new Image;
        img.onload = () => {
            this.preview.classList.remove("loading");
            this.preview.innerHTML = `<img src="${imgUrl}" alt="预览图">`;
            this.imgElement = this.preview.querySelector("img");
            const {width: width, height: height} = this.calculateImageSize(img);
            this.preview.style.width = `${width}px`;
            this.preview.style.height = `${height}px`;
            this.preview.offsetHeight;
            this.preview.classList.add("active");
            this.handleMouseMove(e);
        };
        img.onerror = () => {
            this.preview.classList.remove("loading");
            this.preview.innerHTML = '<div style="padding:10px;color:#f00;">图片加载失败</div>';
        };
        img.src = imgUrl;
    }
    calculateImageSize(img) {
        let width = img.naturalWidth, height = img.naturalHeight;
        if (width > this.config.maxWidth || height > this.config.maxHeight) {
            const ratio = Math.min(this.config.maxWidth / width, this.config.maxHeight / height);
            width *= ratio;
            height *= ratio;
        }
        return {
            width: width,
            height: height
        };
    }
    handleMouseMove(e) {
        if (!this.currentTarget || !this.preview.classList.contains("active")) return;
        let {offsetX: offsetX, offsetY: offsetY} = this.config, left = e.clientX + offsetX, top = e.clientY + offsetY;
        if (this.config.autoAdjustPosition) {
            const previewWidth = this.preview.offsetWidth, previewHeight = this.preview.offsetHeight;
            left + previewWidth > window.innerWidth && (left = e.clientX - previewWidth - offsetX);
            top + previewHeight > window.innerHeight && (top = e.clientY - previewHeight - offsetY);
            left = Math.max(0, left);
            top = Math.max(0, top);
        }
        this.preview.style.left = `${left}px`;
        this.preview.style.top = `${top}px`;
    }
    handleMouseLeave() {
        this.preview.classList.remove("active");
        this.preview.style.display = "none";
        this.currentTarget = null;
        this.imgElement = null;
    }
    destroy() {
        document.querySelectorAll(this.config.selector).forEach((el => {
            if (this.boundElements.has(el)) {
                el.removeEventListener("mouseenter", this.handleMouseEnter);
                el.removeEventListener("mouseleave", this.handleMouseLeave);
                el.removeEventListener("mousemove", this.handleMouseMove);
                this.boundElements.delete(el);
            }
        }));
        this.preview && this.preview.parentNode && this.preview.parentNode.removeChild(this.preview);
    }
};

!async function() {
    document.head.insertAdjacentHTML("beforeend", "\n        <style>\n            .console-logger-container {\n                position: fixed;\n                bottom: 0;\n                right: 0;\n                z-index: 99999999;\n                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;\n                display: flex;\n                flex-direction: column; \n                align-items: flex-end;\n                width: fit-content;\n            }\n\n            .console-logger-toggle {\n                width: 40px;\n                height: 30px;\n                background: #2c3e50;\n                border-radius: 120px 10px 0 0;\n                display: flex;\n                align-items: center;\n                justify-content: center;\n                cursor: pointer;\n                box-shadow: -2px 0 5px rgba(0, 0, 0, 0.1);\n                transition: all 0.3s ease;\n                color: white;\n                font-size: 16px;\n            }\n\n            .console-logger-toggle:hover {\n                background: #34495e;\n            }\n\n            .console-logger-toggle::after {\n                content: '▼';\n                transition: transform 0.3s ease;\n            }\n\n            .console-logger-toggle.collapsed::after {\n                content: '▲';\n            }\n\n            .console-logger-window {\n                width: 400px;\n                height: 400px;\n                background: white;\n                border-radius: 10px 0 10px 10px;\n                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);\n                display: flex;\n                flex-direction: column;\n                overflow: hidden;\n                transform: translateY(0);\n                opacity: 1;\n                /* 简化过渡属性 */\n                transition: width 0.3s ease, height 0.3s ease, opacity 0.3s ease, transform 0.3s ease;\n            }\n\n            .console-logger-window.maximized {\n                width: 600px !important;\n                height: 85vh !important;\n                border-radius: 10px 0 0 10px; /* 调整圆角以匹配右下角 */\n            }\n\n            .console-logger-window.collapsed {\n                height: 0 !important;\n                min-height: 0 !important; \n                opacity: 0;\n            }\n\n            .console-logger-header {\n                background: #2c3e50;\n                color: white;\n                padding: 12px 15px;\n                display: flex;\n                justify-content: space-between;\n                align-items: center;\n                flex-shrink: 0;\n            }\n\n            .console-logger-title {\n                font-weight: 600;\n                font-size: 16px;\n            }\n\n            .console-logger-controls {\n                display: flex;\n                gap: 10px;\n            }\n\n            .console-logger-controls button {\n                background: transparent;\n                border: 1px solid rgba(255, 255, 255, 0.3);\n                padding: 5px 10px;\n                font-size: 12px;\n                color: white;\n                border-radius: 4px;\n                cursor: pointer;\n                transition: background 0.3s;\n            }\n\n            .console-logger-controls button:hover {\n                background: rgba(255, 255, 255, 0.1);\n            }\n\n            /* 新增的按钮样式 */\n            .console-logger-maximize-toggle {\n                line-height: 1;\n                font-size: 14px !important; /* 使箭头看起来更大 */\n                padding: 5px 8px !important;\n            }\n            .console-logger-maximize-toggle::before {\n                content: '⇱'; /* Unicode symbol for maximized */\n            }\n            .console-logger-maximize-toggle.active::before {\n                content: '⇲'; /* Unicode symbol for minimized */\n            }\n\n\n            .console-logger-filters {\n                display: flex;\n                align-items: center;\n                gap: 5px;\n                padding: 10px;\n                background: #f8f9fa;\n                border-bottom: 1px solid #e9ecef;\n                flex-shrink: 0;\n                overflow-x: hidden; \n            }\n\n            /* 新增: 过滤器按钮组的容器，负责滚动 */\n            .console-logger-filter-group {\n                display: flex;\n                gap: 5px;\n                overflow-x: auto; /* 允许过滤器按钮滚动 */\n                flex-grow: 1; /* 占据剩余空间 */\n                padding-right: 10px; /* 避免滚动条影响按钮 */\n            }\n\n            .console-logger-filter {\n                padding: 5px 10px;\n                font-size: 12px;\n                border-radius: 15px;\n                background: #ecf0f1;\n                color: #7f8c8d;\n                border: 1px solid #ddd;\n                cursor: pointer;\n                transition: all 0.3s;\n                white-space: nowrap;\n                flex-shrink: 0; /* 确保不被压缩 */\n            }\n\n            .console-logger-filter.active {\n                background: #3498db;\n                color: white;\n                border-color: #3498db;\n            }\n\n            /* 新增: 滚动到底部按钮的样式 (位于 filtersContainer 内部右侧) */\n            .console-logger-scroll-to-bottom {\n                background: #3498db;\n                border: none;\n                padding: 5px 10px;\n                font-size: 12px;\n                color: white;\n                border-radius: 4px;\n                cursor: pointer;\n                transition: background 0.3s;\n                line-height: 1;\n                height: fit-content;\n                white-space: nowrap;\n                margin-left: auto; /* 将按钮推到最右侧 */\n                flex-shrink: 0; /* 确保不被压缩 */\n            }\n\n            .console-logger-scroll-to-bottom:hover {\n                background: #2980b9;\n            }\n\n\n            .console-logger-content {\n                flex: 1;\n                overflow-y: auto;\n                padding: 10px;\n                background: #ffffff;\n                word-wrap: break-word;\n                text-align: left;\n            }\n\n            .console-logger-entry {\n                padding: 8px 10px;\n                margin-bottom: 3px;\n                border-radius: 4px;\n                font-size: 12px;\n                line-height: 1.4;\n                /*animation: consoleFadeIn 0.3s ease;*/\n                border-left: 3px solid transparent;\n            }\n\n            @keyframes consoleFadeIn {\n                from { opacity: 0; transform: translateY(5px); }\n                to { opacity: 1; transform: translateY(0); }\n            }\n\n            .console-logger-timestamp {\n                color: #7f8c8d;\n                font-size: 11px;\n                margin-right: 2px;\n            }\n\n            @media (max-width: 768px) {\n                .console-logger-container {\n                    right: 10px;\n                    bottom: 10px;\n                }\n\n                .console-logger-window {\n                    width: calc(100vw - 20px);\n                    height: 300px;\n                }\n            }\n            \n            .console-logger-message[data-type=\"json\"] {\n                white-space: pre-wrap; \n            }\n        </style>\n    ");
    const groupTypes = {
        base: {
            label: "信息",
            background: "#e8f4fd",
            borderLeftColor: "#3498db"
        },
        warn: {
            label: "警告",
            background: "#fef9e7",
            borderLeftColor: "#f39c12"
        },
        error: {
            label: "错误",
            background: "#fdedec",
            borderLeftColor: "#e74c3c"
        },
        debug: {
            label: "调试",
            background: "#f4f6f6",
            borderLeftColor: "#95a5a6"
        }
    }, filterMap = {
        base: [ "base", "warn", "error" ],
        warn: [ "warn" ],
        error: [ "error" ],
        debug: [ "base", "warn", "error", "debug" ]
    }, maxEntries = await storageManager.getSetting("clogMsgCount", 2e3);
    class CLog {
        constructor() {
            const storedFilter = localStorage.getItem("jhs_clog_filter");
            this.currentFilter = storedFilter && groupTypes[storedFilter] ? storedFilter : "base";
            this.logs = [];
            this.isInitialized = !1;
            this.userScrolledUp = !1;
        }
        tryInitialize() {
            if ("loading" === document.readyState) return !1;
            if (this.isInitialized) return !0;
            this.init();
            this.isInitialized = !0;
            return !0;
        }
        init() {
            this.createContainer();
            this.bindEvents();
            this.checkInitialMaximizeState();
            this.checkInitialCollapseState();
        }
        createContainer() {
            this.container = document.createElement("div");
            this.container.className = "console-logger-container";
            this.container.style.display = "none";
            this.toggleBtn = document.createElement("div");
            this.toggleBtn.className = "console-logger-toggle collapsed";
            this.container.appendChild(this.toggleBtn);
            this.window = document.createElement("div");
            this.window.className = "console-logger-window collapsed";
            const header = document.createElement("div");
            header.className = "console-logger-header";
            const title = document.createElement("div");
            title.className = "console-logger-title";
            title.textContent = "JHS V3.3.6";
            const controls = document.createElement("div");
            controls.className = "console-logger-controls";
            this.maximizeBtn = document.createElement("button");
            this.maximizeBtn.textContent = "";
            this.maximizeBtn.classList.add("console-logger-maximize-toggle");
            controls.appendChild(this.maximizeBtn);
            const clearBtn = document.createElement("button");
            clearBtn.textContent = "清空";
            clearBtn.addEventListener("click", (() => this.clear()));
            controls.appendChild(clearBtn);
            header.appendChild(title);
            header.appendChild(controls);
            this.filtersContainer = document.createElement("div");
            this.filtersContainer.className = "console-logger-filters";
            this.filterButtonGroup = document.createElement("div");
            this.filterButtonGroup.className = "console-logger-filter-group";
            this.filtersContainer.appendChild(this.filterButtonGroup);
            this.scrollToBottomBtn = document.createElement("button");
            this.scrollToBottomBtn.className = "console-logger-scroll-to-bottom";
            this.scrollToBottomBtn.textContent = "到底部";
            this.filtersContainer.appendChild(this.scrollToBottomBtn);
            this.content = document.createElement("div");
            this.content.className = "console-logger-content jhs-scrollbar";
            this.window.appendChild(header);
            this.window.appendChild(this.filtersContainer);
            this.window.appendChild(this.content);
            this.container.appendChild(this.window);
            document.body.appendChild(this.container);
            Object.keys(groupTypes).forEach((type => {
                const filterBtn = document.createElement("div");
                filterBtn.className = "console-logger-filter";
                type === this.currentFilter && filterBtn.classList.add("active");
                filterBtn.textContent = groupTypes[type].label;
                filterBtn.dataset.type = type;
                filterBtn.addEventListener("click", (() => this.setFilter(type)));
                this.filterButtonGroup.appendChild(filterBtn);
            }));
        }
        bindEvents() {
            this.toggleBtn.addEventListener("click", (() => {
                this.toggleExpandCollapsed();
            }));
            this.maximizeBtn.addEventListener("click", (() => this.toggleMaximize()));
            this.scrollToBottomBtn.addEventListener("click", (() => {
                this.content.scrollTop = this.content.scrollHeight;
                this.userScrolledUp = !1;
            }));
            this.content.addEventListener("scroll", (() => {
                const isAtBottom = this.content.scrollHeight - this.content.clientHeight <= this.content.scrollTop + 5;
                this.userScrolledUp = !isAtBottom;
            }));
            this.content.addEventListener("wheel", (e => {
                const isAtTop = 0 === this.content.scrollTop, isAtBottom = this.content.scrollHeight - this.content.clientHeight <= this.content.scrollTop + 1;
                if (isAtTop && e.deltaY < 0 || isAtBottom && e.deltaY > 0) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            }), {
                passive: !1
            });
        }
        toggleExpandCollapsed() {
            const isCollapsed = this.window.classList.toggle("collapsed");
            this.toggleBtn.classList.toggle("collapsed");
            if (isCollapsed) localStorage.setItem("jhs_clog_expand", "no"); else {
                localStorage.setItem("jhs_clog_expand", "yes");
                this.reRenderAllLogs();
            }
        }
        checkInitialCollapseState() {
            const expandStatus = localStorage.getItem("jhs_clog_expand");
            if (expandStatus && "no" !== expandStatus) {
                this.window.classList.toggle("collapsed");
                this.toggleBtn.classList.toggle("collapsed");
                setTimeout((() => {
                    this.content.scrollTop = this.content.scrollHeight;
                }), 0);
            } else {
                this.window.classList.add("collapsed");
                this.toggleBtn.classList.add("collapsed");
            }
        }
        checkInitialMaximizeState() {
            if ("maximized" === localStorage.getItem("jhs_clog_maximize")) {
                this.window.classList.add("maximized");
                this.maximizeBtn.classList.add("active");
            }
        }
        toggleMaximize() {
            const isMaximized = this.window.classList.toggle("maximized");
            this.maximizeBtn.classList.toggle("active", isMaximized);
            isMaximized ? localStorage.setItem("jhs_clog_maximize", "maximized") : localStorage.setItem("jhs_clog_maximize", "minimized");
            this.window.classList.contains("collapsed") || (this.content.scrollTop = this.content.scrollHeight);
        }
        addLog(primaryContent, type = "base", ...optionalParams) {
            const initialized = this.tryInitialize();
            let logType, extraParams = [];
            if (groupTypes[type]) {
                logType = type;
                extraParams = optionalParams;
            } else {
                logType = "base";
                extraParams = [ type, ...optionalParams ];
            }
            logType = groupTypes[logType] ? logType : "base";
            const allContents = [ primaryContent, ...extraParams ];
            let messageType = "msg";
            const processedParts = [];
            allContents.forEach((content => {
                if ("[object Error]" === Object.prototype.toString.call(content)) processedParts.push(String(content)); else if ("object" == typeof content && null !== content) try {
                    processedParts.push("<br/>" + JSON.stringify(content, null, 2));
                    messageType = "json";
                } catch (e) {
                    processedParts.push(String(content));
                    messageType = "msg";
                } else processedParts.push(String(content));
            }));
            let formattedMessage = processedParts.join("  ");
            formattedMessage = formattedMessage.replace(/(?:(?:https?|ftp):\/\/|www\.|(?:\/\/))[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|]/gi, (url => {
                const isFullProtocol = url.startsWith("http") || url.startsWith("ftp"), isProtocolRelative = url.startsWith("//"), isWww = url.startsWith("www.");
                let fullUrl = url;
                isProtocolRelative ? fullUrl = `http:${url}` : !isFullProtocol && isWww && (fullUrl = `http://${url}`);
                return `<a href="${fullUrl}" target="_blank">${url}</a>`;
            }));
            const logEntry = {
                message: formattedMessage,
                messageType: messageType,
                type: logType,
                timestamp: new Date,
                id: Date.now() + Math.random()
            };
            this.logs.push(logEntry);
            if (this.logs.length > maxEntries) {
                const firstLog = this.logs[0];
                if (initialized) {
                    const elementToRemove = this.content.querySelector(`.console-logger-entry[data-id="${firstLog.id}"]`);
                    if (elementToRemove) {
                        this.logs.shift();
                        this.content.removeChild(elementToRemove);
                    }
                }
            }
            initialized && this.renderLog(logEntry);
        }
        log(...message) {
            const [mainMessage, ...optionalParams] = message;
            setTimeout((() => {
                this.addLog(mainMessage, "base", ...optionalParams);
            }), 0);
        }
        error(...message) {
            const [mainMessage, ...optionalParams] = message;
            console.error(...message);
            setTimeout((() => {
                this.addLog(mainMessage, "error", ...optionalParams);
            }), 0);
        }
        warn(...message) {
            const [mainMessage, ...optionalParams] = message;
            setTimeout((() => {
                this.addLog(mainMessage, "warn", ...optionalParams);
            }), 0);
        }
        debug(...message) {
            const [mainMessage, ...optionalParams] = message;
            setTimeout((() => {
                this.addLog(mainMessage, "debug", ...optionalParams);
            }), 0);
        }
        renderLog(logEntry) {
            if ("none" === this.container.style.display) return;
            if (this.window.classList.contains("collapsed")) return;
            if (!(filterMap[this.currentFilter] || []).includes(logEntry.type)) return;
            const entryEl = this._createLogElement(logEntry);
            this.content.appendChild(entryEl);
            this.window.classList.contains("collapsed") || this.userScrolledUp || (this.content.scrollTop = this.content.scrollHeight);
        }
        reRenderAllLogs() {
            "none" !== this.container.style.display && (this.window.classList.contains("collapsed") || setTimeout((() => {
                this.content.innerHTML = "";
                if (0 === this.logs.length) return;
                const allowedTypes = filterMap[this.currentFilter] || [], fragment = document.createDocumentFragment();
                this.logs.forEach((logEntry => {
                    if (allowedTypes.includes(logEntry.type)) {
                        const entryEl = this._createLogElement(logEntry);
                        fragment.appendChild(entryEl);
                    }
                }));
                this.content.appendChild(fragment);
                this.content.scrollTop = this.content.scrollHeight;
            }), 0));
        }
        _createLogElement(logEntry) {
            const entryEl = document.createElement("div");
            entryEl.className = "console-logger-entry";
            entryEl.dataset.type = logEntry.type;
            entryEl.dataset.id = logEntry.id;
            const config = groupTypes[logEntry.type] || groupTypes.base;
            entryEl.style.borderLeft = "3px solid " + config.borderLeftColor;
            entryEl.style.background = config.background;
            const timeStr = (logEntry.timestamp instanceof Date ? logEntry.timestamp : new Date(logEntry.timestamp)).toTimeString().split(" ")[0];
            entryEl.innerHTML = `\n                <span class="console-logger-timestamp">[${timeStr}]</span>\n                <span class="console-logger-message" data-type="${logEntry.messageType}">${logEntry.message}</span>\n            `;
            return entryEl;
        }
        setFilter(type) {
            if (this.currentFilter === type) return;
            this.currentFilter = type;
            localStorage.setItem("jhs_clog_filter", type);
            this.filterButtonGroup.querySelectorAll(".console-logger-filter").forEach((btn => {
                btn.dataset.type === type ? btn.classList.add("active") : btn.classList.remove("active");
            }));
            this.reRenderAllLogs();
        }
        clear() {
            this.logs = [];
            this.content.innerHTML = "";
        }
        show() {
            if (this.isInitialized && this.container) {
                this.container.style.display = "";
                this.reRenderAllLogs();
            } else if (this.tryInitialize() && this.container) {
                this.container.style.display = "";
                this.reRenderAllLogs();
            }
        }
        hide() {
            this.isInitialized && this.container && (this.container.style.display = "none");
        }
        lowZIndex() {
            this.isInitialized && this.container && (this.container.style.zIndex = "12345678");
        }
        highZIndex() {
            this.isInitialized && this.container && (this.container.style.zIndex = "999999999");
        }
    }
    if (isJavBus || isJavDb) {
        try {
            _unsafeWindow.parent.clog && "function" == typeof _unsafeWindow.parent.clog.log ? window.clog = _unsafeWindow.clog = _unsafeWindow.parent.clog : window.clog = _unsafeWindow.clog = new CLog;
        } catch (e) {
            console.error("创建日志控制台出现异常", e);
            window.clog = _unsafeWindow.clog = new CLog;
        }
        !function() {
            const clog2 = window.clog || console;
            window.addEventListener("error", (function(errorEvent) {
                const filename = errorEvent.filename, message = errorEvent.message;
                filename.includes("javdb") || filename.includes("javbus") || clog2.error(`[全局 Error 异常捕获] ${message} 来源: ${filename}`);
            }));
            window.addEventListener("unhandledrejection", (function(event) {
                const reason = event.reason, message = (null == reason ? void 0 : reason.message) ?? "";
                if (message.includes("play()")) return;
                if (message.includes("The element has no supported sources")) {
                    show.error("播放失败, 请检查是否已对节点分流?");
                    clog2.error("播放失败, 请检查是否已对节点分流?");
                    return;
                }
                if (message.includes("<span>1005</span>") && message.includes("fc2ppvdb")) return;
                const errorMessage = `[全局 Promise 异常捕获] ${reason.message || reason}`;
                clog2.error(errorMessage, reason);
                event.preventDefault();
            }));
        }();
        document.addEventListener("mousedown", (event => {
            const clog2 = window.clog;
            if (!clog2.isInitialized || !clog2.container) return;
            const target = event.target, whitelistSelector = [ ".console-logger-container", ".layui-layer-shade", ".loading-container" ].join(",");
            target.closest(whitelistSelector) ? clog2.highZIndex() : clog2.lowZIndex();
        }));
    }
}();

!function() {
    document.head.insertAdjacentHTML("beforeend", "\n        <style>\n            .js-tooltip {\n                /* 通用样式 */\n                position: fixed;\n                padding: 8px 12px; \n                border-radius: 6px; \n                white-space: normal;\n                max-width: 600px; \n                \n                pointer-events: none;\n                font-size: 14px;\n                line-height: 1.5;\n                z-index: 9999999999;\n                \n                background: #F0FDF4; \n                color: #166534;      \n                border: none; \n                box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3); \n                \n                display: none; \n            }\n            .js-tooltip.is-active {\n                display: block !important;\n            }\n\n        </style>\n    ");
    function positionTooltip(target, content, preferredPosition) {
        const el = function(content) {
            const el = document.createElement("div");
            el.classList.add("js-tooltip");
            const contentEl = document.createElement("div");
            contentEl.innerHTML = content;
            el.appendChild(contentEl);
            document.body.appendChild(el);
            return el;
        }(content);
        el.style.display = "block";
        const targetRect = target.getBoundingClientRect(), tooltipRect = el.getBoundingClientRect();
        el.style.display = "none";
        const viewportWidth = window.innerWidth, viewportHeight = window.innerHeight;
        let finalLeft, finalTop, finalPosition = preferredPosition;
        const fitsVertical = y => y >= 8 && y + tooltipRect.height <= viewportHeight - 8, fitsHorizontal = x => x >= 8 && x + tooltipRect.width <= viewportWidth - 8, centerHorizontal = targetRect.left + targetRect.width / 2 - tooltipRect.width / 2, centerVertical = targetRect.top + targetRect.height / 2 - tooltipRect.height / 2;
        switch (preferredPosition) {
            case "top":
                finalTop = targetRect.top - tooltipRect.height - 0;
                if (finalTop < 8 && fitsVertical(targetRect.bottom + 0)) {
                    finalTop = targetRect.bottom + 0;
                    finalPosition = "bottom";
                }
                break;

            case "bottom":
                finalTop = targetRect.bottom + 0;
                if (finalTop + tooltipRect.height > viewportHeight - 8 && fitsVertical(targetRect.top - tooltipRect.height - 0)) {
                    finalTop = targetRect.top - tooltipRect.height - 0;
                    finalPosition = "top";
                }
                break;

            case "left":
                finalLeft = targetRect.left - tooltipRect.width - 0;
                if (finalLeft < 8 && fitsHorizontal(targetRect.right + 0)) {
                    finalLeft = targetRect.right + 0;
                    finalPosition = "right";
                }
                break;

            case "right":
                finalLeft = targetRect.right + 0;
                if (finalLeft + tooltipRect.width > viewportWidth - 8 && fitsHorizontal(targetRect.left - tooltipRect.width - 0)) {
                    finalLeft = targetRect.left - tooltipRect.width - 0;
                    finalPosition = "left";
                }
        }
        const isHorizontal = "left" === finalPosition || "right" === finalPosition;
        if ("top" === finalPosition || "bottom" === finalPosition) {
            finalLeft = centerHorizontal;
            finalLeft < 8 ? finalLeft = 8 : finalLeft + tooltipRect.width > viewportWidth - 8 && (finalLeft = viewportWidth - tooltipRect.width - 8);
        } else if (isHorizontal) {
            finalTop = centerVertical;
            finalTop < 8 ? finalTop = 8 : finalTop + tooltipRect.height > viewportHeight - 8 && (finalTop = viewportHeight - tooltipRect.height - 8);
        }
        el.style.left = `${finalLeft}px`;
        el.style.top = `${finalTop}px`;
        el.classList.add("is-active");
        target.tooltipElement = el;
    }
    const selector = "[data-tip-top], [data-tip-bottom], [data-tip-left], [data-tip-right], [data-tip]";
    document.addEventListener("mouseover", (event => {
        const target = event.target.closest(selector);
        if (target && !target.tooltipElement) {
            let tipContent, preferredPosition = "top";
            if (target.hasAttribute("data-tip-bottom")) {
                tipContent = target.getAttribute("data-tip-bottom");
                preferredPosition = "bottom";
            } else if (target.hasAttribute("data-tip-left")) {
                tipContent = target.getAttribute("data-tip-left");
                preferredPosition = "left";
            } else if (target.hasAttribute("data-tip-right")) {
                tipContent = target.getAttribute("data-tip-right");
                preferredPosition = "right";
            } else if (target.hasAttribute("data-tip-top")) {
                tipContent = target.getAttribute("data-tip-top");
                preferredPosition = "top";
            } else if (target.hasAttribute("data-tip")) {
                tipContent = target.getAttribute("data-tip");
                preferredPosition = "top";
            }
            if (!tipContent) return;
            target.hoverTimeout = setTimeout((() => {
                target.matches(":hover") && !target.tooltipElement && positionTooltip(target, tipContent, preferredPosition);
            }), 50);
        }
    }));
    document.addEventListener("mouseout", (event => {
        const target = event.target.closest(selector);
        if (target) {
            if (target.hoverTimeout) {
                clearTimeout(target.hoverTimeout);
                target.hoverTimeout = null;
            }
            if (!target.contains(event.relatedTarget) && target.tooltipElement) {
                (el = target.tooltipElement) && el.parentNode && el.remove();
                target.tooltipElement = null;
            }
        }
        var el;
    }));
}();

if (typeof layer !== 'undefined') {
    const originalLayerClose = layer.close;

    layer.close = function (index) {
        const result = originalLayerClose.call(this, index);
        !function (waitTime = 10) {
            setTimeout((() => {
                const openLayerCount = document.querySelectorAll(".layui-layer-shade").length;
                document.documentElement.style.overflow = openLayerCount > 0 ? "hidden" : "";
            }), waitTime);
        }();
        return result;
    };

    const originalLayerOpen = layer.open;

    layer.open = function (options) {
        const originalSuccess = (options = options || {}).success;
        options.success = function (layero, index) {
            "function" == typeof originalSuccess && originalSuccess.call(this, layero, index);
            utils.setupEscClose(index);
        };
        return originalLayerOpen.call(this, options);
    };
}

utils.importResource("https://cdn.jsdelivr.net/npm/layui-layer@1.0.9/layer.min.css");

utils.importResource("https://cdn.jsdelivr.net/npm/toastify-js@1.12.0/src/toastify.min.css");

utils.importResource("https://cdn.jsdelivr.net/npm/viewerjs@1.11.1/dist/viewer.min.css");

utils.importResource("https://cdn.jsdelivr.net/npm/tabulator-tables@6.5.2/dist/css/tabulator_semanticui.min.css");

const pluginManager = function() {
    const pluginManager2 = new PluginManager;
    _unsafeWindow.pluginManager = window.pluginManager = pluginManager2;
    let hostname = window.location.hostname;
    if (isJavDb) {
        pluginManager2.register(ListPagePlugin);
        pluginManager2.register(AutoPagePlugin);
        pluginManager2.register(Fc2Plugin);
        pluginManager2.register(FoldCategoryPlugin);
        pluginManager2.register(ListPageButtonPlugin);
        pluginManager2.register(HistoryPlugin);
        pluginManager2.register(SettingPlugin);
        pluginManager2.register(NavBarPlugin);
        pluginManager2.register(HitShowPlugin);
        pluginManager2.register(TOP250Plugin);
        pluginManager2.register(CoverButtonPlugin);
        pluginManager2.register(ImageRecognitionPlugin);
        pluginManager2.register(Fc2By123AvPlugin);
        pluginManager2.register(WangPan115MatchPlugin);
        pluginManager2.register(DetailPagePlugin);
        pluginManager2.register(ReviewPlugin);
        pluginManager2.register(RelatedPlugin);
        pluginManager2.register(DetailPageButtonPlugin);
        pluginManager2.register(HighlightMagnetPlugin);
        pluginManager2.register(PreviewVideoPlugin);
        pluginManager2.register(JavopenPreviewVideoPlugin);
        pluginManager2.register(FilterTitleKeywordPlugin);
        pluginManager2.register(ActressInfoPlugin);
        pluginManager2.register(OtherSitePlugin);
        pluginManager2.register(WangPan115TaskPlugin);
        pluginManager2.register(TranslatePlugin);
        pluginManager2.register(WantAndWatchedVideosPlugin);
        pluginManager2.register(MagnetHubPlugin);
        pluginManager2.register(ScreenShotPlugin);
        pluginManager2.register(BlacklistPlugin);
        pluginManager2.register(FavoriteActressesPlugin);
        pluginManager2.register(NewVideoPlugin);
        pluginManager2.register(TaskPlugin);
    }
    if (isJavBus) {
        pluginManager2.register(ListPagePlugin);
        pluginManager2.register(ListPageButtonPlugin);
        pluginManager2.register(SettingPlugin);
        pluginManager2.register(HistoryPlugin);
        pluginManager2.register(AutoPagePlugin);
        pluginManager2.register(ImageRecognitionPlugin);
        pluginManager2.register(BusNavBarPlugin);
        pluginManager2.register(CoverButtonPlugin);
        pluginManager2.register(WangPan115MatchPlugin);
        pluginManager2.register(BusImgPlugin);
        pluginManager2.register(BusDetailPagePlugin);
        pluginManager2.register(DetailPageButtonPlugin);
        pluginManager2.register(ReviewPlugin);
        pluginManager2.register(FilterTitleKeywordPlugin);
        pluginManager2.register(HighlightMagnetPlugin);
        pluginManager2.register(BusPreviewVideoPlugin);
        pluginManager2.register(JavopenPreviewVideoPlugin);
        pluginManager2.register(MagnetHubPlugin);
        pluginManager2.register(ScreenShotPlugin);
        pluginManager2.register(OtherSitePlugin);
        pluginManager2.register(WangPan115TaskPlugin);
        pluginManager2.register(TranslatePlugin);
        pluginManager2.register(BlacklistPlugin);
        pluginManager2.register(TaskPlugin);
    }
    hostname.includes("javtrailers") && pluginManager2.register(JavTrailersPlugin);
    hostname.includes("subtitlecat") && pluginManager2.register(SubTitleCatPlugin);
    (hostname.includes("aliyundrive") || hostname.includes("alipan")) && pluginManager2.register(AliyunPanPlugin);
    hostname.includes("115.com") && pluginManager2.register(WangPan115Plugin);
    return pluginManager2;
}();

pluginManager.processCss().then();

!async function() {
    window.isDetailPage = function() {
        let href = window.location.href;
        return isJavDb ? href.split("?")[0].includes("/v/") : !!isJavBus && $("#magnet-table").length > 0;
    }();
    window.isListPage = function() {
        let href = window.location.href;
        return isJavDb ? $(".movie-list").length > 0 || href.includes("advanced_search") : !!isJavBus && $(".masonry > div .item").length > 0;
    }();
    window.isFc2Page = function() {
        let href = window.location.href;
        return href.includes("advanced_search?type=3") || href.includes("advanced_search?type=100");
    }();
    isJavDb && /(^|;)\s*locale\s*=\s*en\s*($|;)/i.test(document.cookie) && show.error("请切换到中文语言下才可正常使用本脚本", {
        duration: -1
    });
    pluginManager.processPlugins().then();
}();
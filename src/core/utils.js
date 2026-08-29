import { __publicField } from './constants.js';
import { javDbApi } from '../api/javdb.js';
import { GM_openInTab } from 'vite-plugin-monkey/dist/client';

class Utils {
    constructor() {
        __publicField(this, "intervalContainer", {});
        __publicField(this, "mimeTypes", {
            txt: "text/plain",
            html: "text/html",
            css: "text/css",
            csv: "text/csv",
            json: "application/json",
            xml: "application/xml",
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
            png: "image/png",
            gif: "image/gif",
            webp: "image/webp",
            svg: "image/svg+xml",
            pdf: "application/pdf",
            doc: "application/msword",
            docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            xls: "application/vnd.ms-excel",
            xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            ppt: "application/vnd.ms-powerpoint",
            pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            zip: "application/zip",
            rar: "application/x-rar-compressed",
            "7z": "application/x-7z-compressed",
            mp3: "audio/mpeg",
            wav: "audio/wav",
            mp4: "video/mp4",
            webm: "video/webm",
            ogg: "audio/ogg"
        });
        __publicField(this, "timers", new Map);
        __publicField(this, "insertStyle", (css => {
            if (css) {
                -1 === css.indexOf("<style>") && (css = "<style>" + css + "</style>");
                $("head").append(css);
            }
        }));
        __publicField(this, "layerIndexStack", []);
        Utils.instance || (Utils.instance = this);
        return Utils.instance;
    }
    importResource(url) {
        let tag;
        if (url.indexOf("css") >= 0) {
            tag = document.createElement("link");
            tag.setAttribute("rel", "stylesheet");
            tag.href = url;
        } else {
            tag = document.createElement("script");
            tag.setAttribute("type", "text/javascript");
            tag.src = url;
        }
        document.documentElement.appendChild(tag);
    }
    openPage(url, title, shadeClose, event) {
        if (!url) throw new Error("未传入url");
        shadeClose = shadeClose ?? !0;
        if (event && (event.ctrlKey || event.metaKey)) {
            GM_openInTab(url.includes("http") ? url : window.location.origin + url, {
                insert: 0
            });
            return;
        }
        let finalUrl = url;
        url.includes("/actors/") || url.includes("/star/") || (finalUrl = url.includes("?") ? `${url}&hideNav=1` : `${url}?hideNav=1`);
        layer.open({
            type: 2,
            title: title,
            content: finalUrl,
            scrollbar: !1,
            shadeClose: shadeClose,
            area: this.getResponsiveArea([ "85%", "90%" ]),
            isOutAnim: !1,
            anim: -1,
            success: (layero, index) => {
                this.setupEscClose(index);
            }
        });
    }
    _handleGlobalEscKey(e) {
        if ("Escape" !== e.key && 27 !== e.keyCode) return;
        if (0 === this.layerIndexStack.length) return;
        const topLayerIndex = this.layerIndexStack[this.layerIndexStack.length - 1], $layer = $(`#layui-layer${topLayerIndex}`);
        let viewerExists = !1;
        if ($layer.find(".viewer-container").length > 0) viewerExists = !0; else {
            const iframe = $layer.find(`#layui-layer-iframe${topLayerIndex}`)[0];
            if (iframe && iframe.contentDocument) try {
                $(iframe.contentDocument).find(".viewer-container").length > 0 && (viewerExists = !0);
            } catch (error) {
                clog.warn("无法检查跨域 iframe 内的 .viewer-container");
            }
        }
        if (!viewerExists) {
            this.layerIndexStack.pop();
            layer.close(topLayerIndex);
        }
    }
    setupEscClose(layerIndex) {
        var _a2;
        if (!this._boundHandler) {
            this._boundHandler = this._handleGlobalEscKey.bind(this);
            $(document).off("keydown.globalLayerEsc");
            $(document).on("keydown.globalLayerEsc", this._boundHandler);
        }
        -1 === this.layerIndexStack.indexOf(layerIndex) && this.layerIndexStack.push(layerIndex);
        const $iframe = $(`#layui-layer-iframe${layerIndex}`), eventNamespace = `keydown.layerEsc${layerIndex}`;
        try {
            const iframeDocument = null == (_a2 = $iframe[0]) ? void 0 : _a2.contentDocument;
            if (iframeDocument) {
                if ("yes" === $iframe.attr("data-esc-bound")) return;
                $(iframeDocument).off(eventNamespace);
                $(iframeDocument).on(eventNamespace, this._boundHandler);
                $iframe.attr("data-esc-bound", "yes");
            }
        } catch (e) {
            clog.error("iframe监听失败 (跨域或未加载完毕):", e);
        }
    }
    closePage() {
        storageManager.getSetting("needClosePage", "yes").then((needClosePage => {
            if ("yes" !== needClosePage) return;
            parent.document.documentElement.style.overflow = "auto";
            [ ".layui-layer-shade", ".layui-layer-move", ".layui-layer" ].forEach((function(selector) {
                const elements = parent.document.querySelectorAll(selector);
                if (elements.length > 0) {
                    const elementToRemove = elements.length > 1 ? elements[elements.length - 1] : elements[0];
                    elementToRemove.parentNode.removeChild(elementToRemove);
                }
            }));
            window.close();
        }));
    }
    loopDetector(condition, after, detectInterval = 20, timeout = 1e4, runWhenTimeout = !0) {
        const uuid = Math.random(), start = (new Date).getTime(), stopAndRun = shouldRun => {
            clearInterval(this.intervalContainer[uuid]);
            shouldRun && after && after();
            delete this.intervalContainer[uuid];
        };
        this.intervalContainer[uuid] = setInterval((() => {
            const timeElapsed = (new Date).getTime() - start;
            condition() ? stopAndRun(!0) : timeElapsed >= timeout && stopAndRun(runWhenTimeout);
        }), detectInterval);
    }
    rightClick(container, targetSelector, callback) {
        let containerElement;
        "string" == typeof container ? containerElement = document.querySelector(container) : container instanceof HTMLElement && (containerElement = container);
        if (!containerElement) {
            console.warn("rightClick(), 容器无效或未提供，将使用 document.body 进行全局委托。");
            containerElement = document.body;
        }
        "string" == typeof targetSelector && "" !== targetSelector.trim() ? containerElement.addEventListener("contextmenu", (event => {
            const targetElement = event.target.closest(targetSelector);
            targetElement && callback(event, targetElement);
        })) : console.error("rightClick(), 必须提供有效的 targetSelector。");
    }
    q(event, msg, fun, cancelFun) {
        let x, y;
        if (event) {
            x = event.clientX - 130;
            y = event.clientY - 120;
        } else {
            x = window.innerWidth / 2 - 120;
            y = window.innerHeight / 2 - 120;
        }
        let confirmIndex = layer.confirm(msg, {
            offset: [ y, x ],
            title: "提示",
            btn: [ "确定", "取消" ],
            shade: 0,
            zIndex: 999999991
        }, (function() {
            fun && fun();
            layer.close(confirmIndex);
        }), (function() {
            cancelFun && cancelFun();
        }));
    }
    alert(event, msg, yesFun) {
        let offset;
        event && (offset = [ event.clientX - 200, event.clientY - 120 ]);
        let confirmIndex = layer.alert(msg, {
            offset: offset,
            shade: 0,
            zIndex: 999999991
        }, (function() {
            yesFun && yesFun();
            layer.close(confirmIndex);
        }));
    }
    getNowStr(dateSplitStr = "-", timeSplitStr = ":", dateString = null) {
        let now;
        now = dateString ? new Date(dateString) : new Date;
        const year = now.getFullYear(), month = String(now.getMonth() + 1).padStart(2, "0"), day = String(now.getDate()).padStart(2, "0"), hours = String(now.getHours()).padStart(2, "0"), minutes = String(now.getMinutes()).padStart(2, "0"), seconds = String(now.getSeconds()).padStart(2, "0");
        return `${[ year, month, day ].join(dateSplitStr)} ${[ hours, minutes, seconds ].join(timeSplitStr)}`;
    }
    formatDate(date, dateSplitStr = "-", timeSplitStr = ":") {
        let targetDate;
        if (date instanceof Date) targetDate = date; else {
            if ("string" != typeof date) throw new Error("Invalid date input: must be Date object or date string");
            targetDate = new Date(date);
            if (isNaN(targetDate.getTime())) throw new Error("Invalid date string");
        }
        const year = targetDate.getFullYear(), month = String(targetDate.getMonth() + 1).padStart(2, "0"), day = String(targetDate.getDate()).padStart(2, "0"), hours = String(targetDate.getHours()).padStart(2, "0"), minutes = String(targetDate.getMinutes()).padStart(2, "0"), seconds = String(targetDate.getSeconds()).padStart(2, "0");
        return `${[ year, month, day ].join(dateSplitStr)} ${[ hours, minutes, seconds ].join(timeSplitStr)}`;
    }
    getHourDifference(date1, date2) {
        const timestamp1 = date1.getTime(), timestamp2 = date2.getTime(), differenceInHours = Math.abs(timestamp2 - timestamp1) / 36e5;
        return Math.floor(differenceInHours);
    }
    download(data, fileName) {
        show.info("开始请求下载...");
        const fileExtension = fileName.split(".").pop().toLowerCase();
        let blob, mimeType = this.mimeTypes[fileExtension] || "application/octet-stream";
        if (data instanceof Blob) blob = data; else if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) blob = new Blob([ data ], {
            type: mimeType
        }); else if ("string" == typeof data && data.startsWith("data:")) {
            const byteString = atob(data.split(",")[1]), arrayBuffer = new ArrayBuffer(byteString.length), uintArray = new Uint8Array(arrayBuffer);
            for (let i = 0; i < byteString.length; i++) uintArray[i] = byteString.charCodeAt(i);
            blob = new Blob([ uintArray ], {
                type: mimeType
            });
        } else blob = new Blob([ data ], {
            type: mimeType
        });
        const url = URL.createObjectURL(blob), a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        setTimeout((() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }), 100);
    }
    smoothScrollToTop(duration = 500) {
        return new Promise((resolve => {
            const start = performance.now(), startPosition = window.pageYOffset;
            window.requestAnimationFrame((function scrollStep(timestamp) {
                const elapsed = timestamp - start, progress = Math.min(elapsed / duration, 1), easeInOutCubic = progress < .5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
                window.scrollTo(0, startPosition * (1 - easeInOutCubic));
                progress < 1 ? window.requestAnimationFrame(scrollStep) : resolve();
            }));
        }));
    }
    simpleId() {
        return crypto.randomUUID().replace("-", "");
    }
    isUrl(urlString) {
        try {
            new URL(urlString);
            return !0;
        } catch (_) {
            return !1;
        }
    }
    setHrefParam(key, val) {
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.set(key, val);
        window.history.pushState({}, "", newUrl.toString());
    }
    getUrlParam(url, key) {
        const searchString = url.split("?")[1];
        if (!searchString) return null;
        const regex = new RegExp(`(?:^|&)${key}=([^&]*)`), match = searchString.match(regex);
        let value = "";
        match && match[1] && (value = decodeURIComponent(match[1].replace(/\+/g, " ")));
        return value ? "true" === value || "false" === value ? "true" === value.toLowerCase() : "string" != typeof value || "" === value.trim() || isNaN(Number(value)) ? value : Number(value) : value;
    }
    reBuildSignature() {
        return javDbApi.buildSignature();
    }
    getResponsiveArea(defaultArea) {
        const screenWidth = window.innerWidth;
        return screenWidth >= 1200 ? defaultArea || this.getDefaultArea() : screenWidth >= 768 ? [ "70%", "90%" ] : [ "95%", "95%" ];
    }
    getDefaultArea() {
        return [ "85%", "90%" ];
    }
    isMobile() {
        const userAgent = navigator.userAgent.toLowerCase();
        return [ "iphone", "ipod", "ipad", "android", "blackberry", "windows phone", "nokia", "webos", "opera mini", "mobile", "mobi", "tablet" ].some((keyword => userAgent.includes(keyword)));
    }
    copyToClipboard(type, text) {
        navigator.clipboard.writeText(text).then((() => show.info(`${type}已复制到剪切板, ${text}`))).catch((err => console.error("复制失败: ", err)));
    }
    htmlTo$dom(html) {
        const parser = new DOMParser;
        return $(parser.parseFromString(html, "text/html"));
    }
    addCookie(cookieStr, options = {}) {
        const {maxAge: maxAge = 604800, path: path = "/", domain: domain = "", secure: secure = !1, sameSite: sameSite = "Lax"} = options;
        cookieStr.split(";").forEach((cookie => {
            const trimmed = cookie.trim();
            if (trimmed) {
                const parts = trimmed.split("=");
                if (parts.length >= 2 && parts[0].trim()) {
                    let cookieParts = [ `${parts[0].trim()}=${parts.slice(1).join("=")}` ];
                    maxAge > 0 && cookieParts.push(`max-age=${maxAge}`);
                    cookieParts.push(`path=${path}`);
                    domain && cookieParts.push(`domain=${domain}`);
                    secure && cookieParts.push("Secure");
                    sameSite && cookieParts.push(`SameSite=${sameSite}`);
                    console.log("document.cookie = '" + cookieParts.join("; ") + "'");
                    document.cookie = cookieParts.join("; ");
                }
            }
        }));
    }
    isHidden(el) {
        const element = el.jquery ? el[0] : el;
        return !element || (element.offsetWidth <= 0 && element.offsetHeight <= 0 || "none" === window.getComputedStyle(element).display);
    }
    time(label = "default", unit = "s", precision = 2) {
        if (this.timers.has(label)) {
            const timer = this.timers.get(label), elapsedTime = performance.now() - timer.startTime;
            let formattedTime, unitLabel;
            if ("s" === timer.unit) {
                formattedTime = (elapsedTime / 1e3).toFixed(timer.precision);
                unitLabel = "秒";
            } else {
                formattedTime = elapsedTime.toFixed(timer.precision);
                unitLabel = "毫秒";
            }
            this.timers.delete(label);
            return `${label}: ${formattedTime}${unitLabel}`;
        }
        this.timers.set(label, {
            startTime: performance.now(),
            unit: unit,
            precision: precision
        });
    }
    sleep(ms = 1e3) {
        return new Promise((resolve => setTimeout(resolve, ms)));
    }
    genericSort(arr, sortRules, emptyLast = !0) {
        if (!Array.isArray(arr) || 0 === arr.length) return [];
        if (!Array.isArray(sortRules) || 0 === sortRules.length) return [ ...arr ];
        const sortedArr = [ ...arr ], safeDateConvert = value => {
            if (value instanceof Date) return value;
            if ("string" == typeof value) {
                const date = new Date(value);
                if (!isNaN(date.getTime())) return date;
            }
            return value;
        };
        return sortedArr.sort(((a, b) => {
            for (const rule of sortRules) {
                const {key: key, order: order = "asc"} = rule;
                let valA = a, valB = b;
                if (null != key) if ("function" == typeof key) {
                    valA = key(a);
                    valB = key(b);
                } else {
                    valA = a && "object" == typeof a ? a[key] : void 0;
                    valB = b && "object" == typeof b ? b[key] : void 0;
                }
                const dateA = safeDateConvert(valA), dateB = safeDateConvert(valB);
                let comparison = 0;
                const aIsNull = null == valA, bIsNull = null == valB;
                if (aIsNull && bIsNull) return 0;
                if (aIsNull) return emptyLast ? 1 : -1;
                if (bIsNull) return emptyLast ? 1 : -1;
                comparison = dateA instanceof Date && dateB instanceof Date ? dateA.getTime() - dateB.getTime() : "number" == typeof valA && "number" == typeof valB ? valA - valB : "string" == typeof valA && "string" == typeof valB ? valA.localeCompare(valB) : String(valA).localeCompare(String(valB));
                "desc" === order && (comparison *= -1);
                if (0 !== comparison) return comparison;
            }
            return 0;
        }));
    }
    async retry(fun, tryCount = 3) {
        let runCount = 0;
        for (;runCount < tryCount; ) try {
            const result = await fun();
            runCount > 0 && clog.debug(`[重试] 成功，共发起 ${runCount + 1} 次。`);
            return result;
        } catch (e) {
            let errorString = String(e);
            errorString.startsWith("Error: ") && (errorString = errorString.replace("Error: ", ""));
            if (errorString.includes("Just a moment") || errorString.includes("重定向") || errorString.toLowerCase().includes("404 page not found") || errorString.toLowerCase().includes("404 not found")) throw e;
            runCount++;
            if (runCount === tryCount) {
                clog.debug(`[重试] 达到最大重试次数 (${tryCount})，最终失败：`, e);
                throw e;
            }
            clog.debug(`[重试] 准备第 ${runCount + 1} 次重试, 错误信息: ${errorString}`);
        }
    }
    copyObj(data) {
        return JSON.parse(JSON.stringify(data));
    }
    deepFreeze(obj) {
        if (null === obj || "object" != typeof obj || Object.isFrozen(obj)) return obj;
        const propNames = Object.getOwnPropertyNames(obj);
        for (const name2 of propNames) {
            const value = obj[name2];
            value && "object" == typeof value && this.deepFreeze(value);
        }
        return Object.freeze(obj);
    }
}

class AsyncQueue {
    constructor() {
        this.queue = Promise.resolve();
    }
    addTask(fun) {
        this.queue = this.queue.then((() => fun())).catch((e => {
            console.error("执行异步队列任务失败:", e);
        }));
    }
    async waitAllFinished() {
        return this.queue;
    }
}

export { Utils, AsyncQueue };
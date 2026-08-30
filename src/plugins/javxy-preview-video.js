import {BasePlugin} from '../core/base-plugin.js';
import {__publicField, isJavBus, isJavDb, qualityOptions} from '../core/constants.js';
import {isM3U8Url, attachHlsToVideo, destroyHls, loadHlsLibrary, getHlsClass} from '../lib/hls-runtime.js';
import {getJavxyVideoUrls} from '../api/javxy.js';

class JavxyPreviewVideoPlugin extends BasePlugin {
    getName() {
        return "JavxyPreviewVideoPlugin";
    }

    _attachVideoSrc(videoEl, src) {
        if (!videoEl || !src) return;
        destroyHls(videoEl);

        if (isM3U8Url(src)) {
            const HlsClass = getHlsClass();
            if (HlsClass) {
                attachHlsToVideo(videoEl, src).catch((err) => {
                    clog.error('视频预览 HLS 加载失败:', err);
                    videoEl.src = src;
                    videoEl.load && videoEl.load();
                });
            } else {
                loadHlsLibrary().then((HlsClass) => {
                    if (videoEl && videoEl.isConnected && HlsClass) {
                        attachHlsToVideo(videoEl, src).catch((err) => {
                            clog.error('视频预览 HLS 延迟加载失败:', err);
                            videoEl.src = src;
                            videoEl.load && videoEl.load();
                        });
                    } else if (videoEl && videoEl.isConnected) {
                        videoEl.src = src;
                        videoEl.load && videoEl.load();
                    }
                });
            }
        } else {
            videoEl.src = src;
            videoEl.load && videoEl.load();
        }
    }

    _selectDefaultQuality(qualityList, intendedDefault) {
        if (!qualityList || qualityList.length === 0) return null;
        const availableSet = new Set(qualityList);
        if (availableSet.has(intendedDefault)) return intendedDefault;
        const priorityOrder = qualityOptions.map(o => o.quality).reverse();
        for (const q of priorityOrder) if (availableSet.has(q)) return q;
        return qualityList[0];
    }

    async initCss() {
        return `
            .jhs-javxy-video-modal {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.95); z-index: 12345700;
                display: flex; justify-content: center; align-items: center;
                opacity: 0; visibility: hidden; transition: opacity 0.2s;
            }
            .jhs-javxy-video-modal.is-open { opacity: 1; visibility: visible; }
            .jhs-javxy-video-modal-inner {
                display: flex; flex-direction: column; align-items: center;
                gap: 12px; max-width: 90vw; max-height: 90vh;
            }
            .jhs-javxy-video-wrapper {
                width: 80vw; max-height: 80vh; aspect-ratio: 16/9;
                background: #000; position: relative;
            }
            .jhs-javxy-video-wrapper video {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            }
            .jhs-javxy-quality-bar {
                display: flex; gap: 8px; flex-wrap: wrap; justify-content: center;
            }
            .jhs-javxy-quality-btn {
                min-width: 60px; padding: 5px 10px; font-size: 13px;
                background: rgba(255,255,255,0.2); color: #fff;
                border: 1px solid rgba(255,255,255,0.5); border-radius: 4px;
                cursor: pointer; transition: background 0.2s;
            }
            .jhs-javxy-quality-btn:hover { background: rgba(255,255,255,0.4); }
            .jhs-javxy-quality-btn.active {
                background: #1890ff; border-color: #096dd9; font-weight: bold;
            }
            .jhs-javxy-loading {
                color: #fff; font-size: 16px; text-align: center;
            }
        `;
    }

    async handle() {
        if (!window.isDetailPage) return;

        const carNum = this.getPageInfo().carNum;
        if (!carNum) return;

        this._addJavxyButton(carNum);
    }

    _addJavxyButton(carNum) {
        let $target = null;

        if (isJavDb) {
            $target = $('a[title="複製番號"]');
        } else if (isJavBus) {
            const headerSpans = document.querySelectorAll("span.header");
            for (const span of headerSpans) {
                if (span.textContent.trim() === "識別碼:") {
                    const nextSpan = span.nextElementSibling;
                    if (nextSpan && nextSpan.tagName === "SPAN") {
                        const copyBtn = nextSpan.nextElementSibling;
                        if (copyBtn && copyBtn.tagName === "BUTTON" && copyBtn.textContent.trim() === "复制") {
                            $target = $(copyBtn);
                        } else {
                            $target = $(nextSpan);
                        }
                    }
                    break;
                }
            }
        }

        if (!$target || !$target.length) return;

        const $btn = $(`<a class="site-btn" style="min-width: auto; padding: 0 5px; margin-left: 6px; margin-bottom: 0; background-color: #1890ff; vertical-align: middle; cursor: pointer; font-size: 11px;"><span>视频预览</span></a>`);
        $btn.on("click", async (e) => {
            e.preventDefault();
            e.stopPropagation();
            $btn.css("pointer-events", "none").find("span").text("...");
            try {
                await this._openJavxyPlayer(carNum);
            } finally {
                $btn.css("pointer-events", "").find("span").text("视频预览");
            }
        });
        $target.after($btn);
    }

    async _openJavxyPlayer(carNum) {
        if ($("#jhs-javxy-video-modal").length === 0) {
            $("body").append(`
                <div id="jhs-javxy-video-modal" class="jhs-javxy-video-modal">
                    <div class="jhs-javxy-video-modal-inner">
                        <div class="jhs-javxy-video-wrapper">
                            <video id="jhs-javxy-video" controls playsinline></video>
                        </div>
                        <div class="jhs-javxy-quality-bar"></div>
                    </div>
                </div>
            `);
            const $modal = $("#jhs-javxy-video-modal");
            $modal.on("click", (e) => {
                if (e.target.id === "jhs-javxy-video-modal") {
                    $modal.removeClass("is-open");
                    const videoEl = document.getElementById("jhs-javxy-video");
                    if (videoEl) {
                        destroyHls(videoEl);
                        videoEl.pause();
                    }
                }
            });
            $(document).on("keydown", (e) => {
                if (e.key === "Escape" && $modal.hasClass("is-open")) {
                    $modal.removeClass("is-open");
                    const videoEl = document.getElementById("jhs-javxy-video");
                    if (videoEl) {
                        destroyHls(videoEl);
                        videoEl.pause();
                    }
                }
            });
        }

        const $modal = $("#jhs-javxy-video-modal");
        const $wrapper = $modal.find(".jhs-javxy-video-wrapper");
        const $qualityBar = $modal.find(".jhs-javxy-quality-bar");
        $wrapper.html('<div class="jhs-javxy-loading">视频预览加载中...</div>');
        $qualityBar.empty();
        $modal.addClass("is-open");

        let videoMap = null;
        try {
            videoMap = await getJavxyVideoUrls(carNum);
        } catch (err) {
            $wrapper.html(`<div class="jhs-javxy-loading">视频预览请求失败: ${err.message}</div>`);
            return;
        }

        if (!videoMap || Object.keys(videoMap).length === 0) {
            $wrapper.html('<div class="jhs-javxy-loading">未找到可用的视频源</div>');
            return;
        }

        const qualityList = Object.keys(videoMap);
        const defaultQuality = this._selectDefaultQuality(qualityList, '720p');
        const defaultUrl = videoMap[defaultQuality];

        $wrapper.html(`<video id="jhs-javxy-video" controls playsinline>
            <source src="${defaultUrl}" />
        </video>`);
        const videoEl = document.getElementById("jhs-javxy-video");
        if (!videoEl) return;

        if (isM3U8Url(defaultUrl)) {
            this._attachVideoSrc(videoEl, defaultUrl);
        }

        let buttonsHtml = "";
        qualityOptions.forEach((option) => {
            const url = videoMap[option.quality];
            if (url) {
                buttonsHtml += `<button class="jhs-javxy-quality-btn${option.quality === defaultQuality ? ' active' : ''}"
                    data-quality="${option.quality}" data-video-src="${url}">${option.text}</button>`;
            }
        });
        $qualityBar.html(buttonsHtml);

        $qualityBar.off("click").on("click", ".jhs-javxy-quality-btn", (e) => {
            const $btn = $(e.currentTarget);
            if ($btn.hasClass("active")) return;
            const src = $btn.attr("data-video-src");
            const currentTime = videoEl.currentTime;
            destroyHls(videoEl);
            this._attachVideoSrc(videoEl, src);
            videoEl.load();
            if (currentTime > 0 && Number.isFinite(currentTime)) {
                videoEl.currentTime = currentTime;
            }
            videoEl.play().catch(() => {
            });
            $qualityBar.find(".jhs-javxy-quality-btn").removeClass("active");
            $btn.addClass("active");
        });

        videoEl.play().catch((e) => console.warn("视频预览播放失败:", e));
    }
}

export {JavxyPreviewVideoPlugin};
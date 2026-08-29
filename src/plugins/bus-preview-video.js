import { BasePlugin } from '../core/base-plugin.js';
import { __publicField, qualityOptions } from '../core/constants.js';

class BusPreviewVideoPlugin extends BasePlugin {
    getName() {
        return "BusPreviewVideoPlugin";
    }
    async initCss() {
        return "\n            /* 弹窗/Modal 样式 */\n            .bus-preview-modal {\n                position: fixed;\n                top: 0;\n                left: 0;\n                width: 100%;\n                height: 100%;\n                background-color: rgba(0, 0, 0, 0.95); \n                /* 关键修改：更新 z-index */\n                z-index: 12345699; \n                display: flex;\n                justify-content: center;\n                align-items: center;\n                opacity: 0; \n                visibility: hidden; \n                transition: opacity 0.2s ease;\n            }\n            .bus-preview-modal.is-open {\n                opacity: 1;\n                visibility: visible;\n            }\n            /* 垂直排列视频和按钮，并居中 */\n            .bus-preview-modal-content {\n                position: relative;\n                max-width: 95%; \n                max-height: 95%;\n                display: flex; \n                flex-direction: column; \n                align-items: center; \n                gap: 15px; \n            }\n            \n            /* 移除 .bus-preview-close-btn 的样式 */\n\n            /* 视频播放器容器 */\n            .video-player-wrapper {\n                /* 关键修改：更新 width 和 max-height */\n                width: 80vw; \n                max-height: 85vh; \n                aspect-ratio: 16 / 9; \n                position: relative; \n                background-color: black; \n                max-width: 100%; \n            }\n            /* 视频元素 */\n            .video-player-wrapper #preview-video {\n                position: absolute; \n                top: 0;\n                left: 0;\n                width: 100%;\n                height: 100%;\n                display: block;\n            }\n\n            /* 画质控制盒 (底部按钮) */\n            .video-control-box {\n                display: flex;\n                flex-direction: row; \n                justify-content: center; \n                flex-wrap: wrap; \n                gap: 10px;\n                padding: 10px 0; \n            }\n\n            /* 按钮样式 (保留) */\n            .video-control-btn {\n                min-width:80px;\n                padding: 6px 12px;\n                background: rgba(255,255,255,0.2);\n                color: white;\n                border: 1px solid rgba(255,255,255,0.5);\n                border-radius: 4px;\n                cursor: pointer;\n                text-align: center;\n                font-size: 14px;\n                transition: background-color 0.2s, border-color 0.2s;\n            }\n            .video-control-btn:hover {\n                background: rgba(255,255,255,0.4);\n            }\n            .video-control-btn.active {\n                background-color: #1890ff; \n                color: white;\n                font-weight: bold;\n                border: 1px solid #096dd9;\n            }\n        ";
    }
    initModal() {
        if (0 === $("#bus-preview-modal").length) {
            $("body").append('\n                <div id="bus-preview-modal" class="bus-preview-modal">\n                    <div class="bus-preview-modal-content">\n                        </div>\n                </div>\n            ');
            const $modal = $("#bus-preview-modal");
            $modal.on("click", (e => {
                "bus-preview-modal" === e.target.id && this.closeVideoModal();
            }));
            $(document).on("keydown", (e => {
                "Escape" === e.key && $modal.hasClass("is-open") && this.closeVideoModal();
            }));
        }
    }
    closeVideoModal() {
        const $previewVideo = $("#preview-video");
        $previewVideo.length > 0 && $previewVideo[0].pause();
        $("#bus-preview-modal").removeClass("is-open");
    }
    async handle() {
        if (!window.isDetailPage) return;
        this.initModal();
        const firstImageSrc = $("#sample-waterfall .sample-box .photo-frame img:first").attr("src"), videoPreview = $(`\n            <a class="preview-video-container sample-box" style="cursor: pointer">\n                <div class="photo-frame" style="position:relative;">\n                    <img src="${firstImageSrc}" class="video-cover" alt="">\n                    <div class="play-icon" style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); \n                                color:white; font-size:40px; text-shadow:0 0 10px rgba(0,0,0,0.5);">\n                        ▶\n                    </div>\n                </div>\n            </a>`);
        $("#sample-waterfall").prepend(videoPreview);
        "yes" === await storageManager.getSetting("enableLoadPreviewVideo", "yes") && getDmmVideo(this.getPageInfo().carNum, !1).then();
        let isHandlingVideo = !1, $preview = $(".preview-video-container");
        $preview.on("click", (async event => {
            event.preventDefault();
            event.stopPropagation();
            if (isHandlingVideo) show.info("正在加载中, 勿重复点击"); else {
                isHandlingVideo = !0;
                try {
                    await this.handleVideo();
                } finally {
                    isHandlingVideo = !1;
                }
            }
        }));
        window.location.href.includes("autoPlay=1") && $preview.trigger("click");
    }
    async handleVideo() {
        const $modal = $("#bus-preview-modal"), $modalContent = $modal.find(".bus-preview-modal-content");
        let $previewVideo = $("#preview-video");
        if ($previewVideo.length > 0) {
            $modal.addClass("is-open");
            $previewVideo[0].play().catch((e => console.warn("尝试播放失败 (可能被浏览器阻止):", e)));
            return;
        }
        let carNum2 = this.getPageInfo().carNum;
        const dmmVideoMap = await getDmmVideo(carNum2);
        if (dmmVideoMap && 0 !== Object.keys(dmmVideoMap).length) {
            await this.createVideoPlayerAndControls(dmmVideoMap, $modalContent);
            $previewVideo = $("#preview-video");
            if ($previewVideo.length > 0) {
                $modal.addClass("is-open");
                $previewVideo[0].play().catch((e => console.warn("尝试播放失败 (可能被浏览器阻止):", e)));
            } else show.error("视频播放器创建失败。");
        } else show.error("未找到可用的视频源。");
    }
    async createVideoPlayerAndControls(dmmVideoMap, $container) {
        let defaultVideoQuality = await storageManager.getSetting("videoQuality");
        defaultVideoQuality = selectDefaultQuality(Object.keys(dmmVideoMap), defaultVideoQuality);
        let defaultVideoUrl = dmmVideoMap[defaultVideoQuality];
        $container.html(`\n            <div class="video-player-wrapper">\n                <video id="preview-video" controls playsinline>\n                    <source src="${defaultVideoUrl}" />\n                </video>\n            </div>\n            <div class="video-control-box">\n                </div>\n        `);
        const $videoEl = $("#preview-video"), $previewSource = $videoEl.find("source"), $qualityControlsBox = $container.find(".video-control-box");
        if (!$videoEl.length || !$previewSource.length) return;
        const videoEl = $videoEl[0], jhs_videoMuted = localStorage.getItem("jhs_videoMuted");
        videoEl.muted = !jhs_videoMuted || "yes" === jhs_videoMuted;
        videoEl.addEventListener("volumechange", (function() {
            localStorage.setItem("jhs_videoMuted", videoEl.muted ? "yes" : "no");
        }));
        let buttonsHtml = "";
        qualityOptions.forEach((option => {
            let dmmVideoUrl = dmmVideoMap[option.quality];
            if (dmmVideoUrl) {
                const isActive = defaultVideoQuality === option.quality;
                buttonsHtml += `\n                    <button class="video-control-btn${isActive ? " active" : ""}" \n                            data-quality="${option.quality}"\n                            data-video-src="${dmmVideoUrl}">\n                        ${option.text}\n                    </button>\n                `;
            }
        }));
        $qualityControlsBox.html(buttonsHtml);
        const $buttons = $qualityControlsBox.find(".video-control-btn");
        $qualityControlsBox.off("click").on("click", ".video-control-btn", (async e => {
            try {
                const $button = $(e.currentTarget);
                if ($button.hasClass("active")) return;
                let videoSrc = $button.attr("data-video-src");
                $previewSource.attr("src", videoSrc);
                const currentTime = videoEl.currentTime;
                videoEl.load();
                videoEl.currentTime = currentTime;
                await videoEl.play();
                $buttons.removeClass("active");
                $button.addClass("active");
            } catch (error) {
                console.error("切换画质失败:", error);
            }
        }));
    }
}


export { BusPreviewVideoPlugin };
import { BasePlugin } from '../core/base-plugin.js';
import { __publicField } from '../core/constants.js';
import { HotkeyManager } from './preview-video.js';

class JavTrailersPlugin extends BasePlugin {
    getName() {
        return "JavTrailersPlugin";
    }
    constructor() {
        super();
        this.hasBand = !1;
    }
    handle() {
        let href = window.location.href;
        if (!href.includes("handle=1")) return;
        if ($("h1:contains('Page not found')").length) {
            console.log("番号无法匹配, 跳搜索");
            let keyword = href.split("?")[0].split("video/")[1].toLowerCase().replace("00", "-");
            window.location.href = "/search/" + encodeURIComponent(keyword) + window.location.search;
            return;
        }
        let findList = $(".videos-list .video-link").toArray();
        if (findList.length) {
            const keyword = href.split("?")[0].split("search/")[1].toLowerCase(), matchedLink = findList.find((el => $(el).find(".vid-title").text().toLowerCase().includes(keyword)));
            if (matchedLink) {
                window.location.href = $(matchedLink).attr("href") + window.location.search;
                return;
            }
        }
        this.handlePlayJavTrailers();
        $("#videoPlayerContainer").on("click", (() => {
            this.handlePlayJavTrailers();
        }));
        window.addEventListener("message", (event => {
            let videoEl = document.getElementById("vjs_video_3_html5_api");
            videoEl && (videoEl.currentTime += 5);
        }));
        const urlParams = new URLSearchParams(window.location.search), filterHotKey = urlParams.get("filterHotKey"), favoriteHotKey = urlParams.get("favoriteHotKey"), speedVideoHotKey = urlParams.get("speedVideoHotKey");
        filterHotKey && HotkeyManager.registerHotkey(filterHotKey, (() => window.parent.postMessage(filterHotKey, "*")));
        favoriteHotKey && HotkeyManager.registerHotkey(favoriteHotKey, (() => window.parent.postMessage(favoriteHotKey, "*")));
        speedVideoHotKey && HotkeyManager.registerHotkey(speedVideoHotKey, (() => {
            const videoEl = document.getElementById("vjs_video_3_html5_api");
            videoEl && (videoEl.currentTime += 5);
        }));
    }
    handlePlayJavTrailers() {
        if (!this.hasBand) {
            utils.loopDetector((() => 0 !== $("#vjs_video_3_html5_api").length), (() => {
                setTimeout((() => {
                    this.hasBand = !0;
                    let videoEl = document.getElementById("vjs_video_3_html5_api");
                    console.log(videoEl);
                    videoEl.play();
                    videoEl.currentTime = 5;
                    videoEl.addEventListener("timeupdate", (function() {
                        videoEl.currentTime >= 14 && videoEl.currentTime < 16 && (videoEl.currentTime += 2);
                    }));
                    $("#vjs_video_3_html5_api").css({
                        position: "fixed",
                        width: "100vw",
                        height: "100vh",
                        objectFit: "cover",
                        zIndex: "999999999"
                    });
                    $(".vjs-control-bar").css({
                        position: "fixed",
                        bottom: "20px",
                        zIndex: "999999999"
                    });
                }), 100);
            }));
            utils.loopDetector((() => $("#vjs_video_3 canvas").length > 0), (() => {
                0 !== $("#vjs_video_3 canvas").length && $("#vjs_video_3 canvas").css({
                    position: "fixed",
                    width: "100vw",
                    height: "100vh",
                    objectFit: "cover",
                    top: "0",
                    right: "0",
                    zIndex: "999999998"
                });
            }));
        }
    }
}


export { JavTrailersPlugin };

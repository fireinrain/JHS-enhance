import { BasePlugin } from '../core/base-plugin.js';
import { __publicField, isJavBus, isJavDb } from '../core/constants.js';
import { searchFiles } from './wangpan-115-task.js';

class ScreenShotPlugin extends BasePlugin {
    getName() {
        return "ScreenShotPlugin";
    }
    async handle() {
        this.loadScreenShot().then();
    }
    async loadScreenShot() {
        if (!window.isDetailPage) return;
        if ("yes" !== await storageManager.getSetting("enableLoadScreenShot", "yes")) return;
        let carNum2 = this.getPageInfo().carNum;
        isJavDb && $(".preview-images .tile-item").first().before(' <a class="tile-item screen-container" style="overflow:hidden;max-height: 215px;text-align:center;"><div style="margin-top: 50px;color: #000;cursor: auto">正在加载缩略图</div></a> ');
        isJavBus && $("#sample-waterfall .sample-box:first").after(' <a class="sample-box screen-container" style="overflow:hidden; height: 110px; text-align:center;"><div style="margin-top: 30px;color: #000;cursor: auto">正在加载缩略图</div></a> ');
        try {
            const imgUrl = await this.getScreenshot(carNum2);
            this.addImg("缩略图", imgUrl);
            clog.log("加载缩略图:", imgUrl);
        } catch (e) {
            this.showErrorFallback(carNum2, e);
        }
    }
    async getScreenshot(carNum2) {
        const cacheData = localStorage.getItem("jhs_screenShot") ? JSON.parse(localStorage.getItem("jhs_screenShot")) : {};
        if (cacheData[carNum2]) {
            clog.debug("缓存中存在缩略图:", carNum2, cacheData[carNum2]);
            return cacheData[carNum2];
        }
        let imgUrl;
        try {
            imgUrl = await Promise.any([ this.getJavStoreScreenShot(carNum2) ]);
        } catch (e) {
            clog.error("获取缩略图资源失败:", imgUrl, e);
            throw e;
        }
        if (!imgUrl) {
            this.showErrorFallback(carNum2, null);
            return null;
        }
        const httpsIndex = imgUrl.indexOf("https://");
        -1 !== httpsIndex && (imgUrl = imgUrl.substring(httpsIndex));
        cacheData[carNum2] = imgUrl;
        clog.log("缩略图获取成功:", imgUrl);
        localStorage.setItem("jhs_screenShot", JSON.stringify(cacheData));
        return imgUrl;
    }
    async getJavStoreScreenShot(carNum2) {
        let url = `https://javstore.net/search/${carNum2}.html`;
        clog.log("正在解析缩略图:", url);
        let html = await gmHttp.get(url);
        const $dom = utils.htmlTo$dom(html);
        let detailPageUrl = null;
        $dom.find("#content_news h3 span a").each((function() {
            if ($(this).attr("title").toLowerCase().includes(carNum2.toLowerCase())) {
                detailPageUrl = $(this).attr("href");
                return !1;
            }
        }));
        if (!detailPageUrl) {
            clog.error("JavStore, 查询番号失败:", url);
            return null;
        }
        let detailPageHtml = await gmHttp.get(detailPageUrl);
        const $detailPageDom = utils.htmlTo$dom(detailPageHtml);
        let imgUrl = $detailPageDom.find("a:contains('CLICK HERE')").attr("href") || $detailPageDom.find("img[src*='_s.jpg']").attr("src");
        if (!imgUrl) {
            clog.error("JavStore, 解析预览图失败:", url);
            return null;
        }
        return imgUrl.replace(".th", "");
    }
    async getJavBestScreenShot(carNum2) {
        let url = `https://javbest.net/?s=${carNum2}`;
        clog.log("正在解析缩略图:", url);
        let html = await gmHttp.get(url);
        const $dom = utils.htmlTo$dom(html), href = $dom.find(".app_loop_thumb a").first().attr("href");
        if (!href) {
            clog.error("解析JavBest搜索页失败:", url);
            throw new Error("解析JavBest搜索页失败");
        }
        const title = $dom.find(".app_loop_thumb a").first().attr("title");
        if (!title.toLowerCase().includes(carNum2.toLowerCase())) {
            clog.error("解析JavBest搜索页失败:", title);
            throw new Error("解析JavBest搜索页失败");
        }
        const detailPageHtml = await gmHttp.get(href);
        let imgUrl = $(detailPageHtml).find('#content a img[src*="_t.jpg"]').attr("src");
        if (!imgUrl) {
            clog.error("解析JavBest缩略图失败:", url);
            throw new Error("解析JavBest缩略图失败");
        }
        imgUrl = imgUrl.replace("_t", "").replace("http:", "https:");
        return imgUrl;
    }
    async getJavFreeScreenShot(carNum2) {
        let url = `https://javfree.me/search/${carNum2}/`, html = await gmHttp.get(url);
        const $itemList = utils.htmlTo$dom(html).find("article h2.entry-title a");
        if (!$itemList || 0 === $itemList.length) {
            clog.error("解析JavFree搜索页失败:", url);
            throw new Error("解析JavFree搜索页失败");
        }
        let detailPageUrl = $($itemList[0]).attr("href"), detailPageHtml = await gmHttp.get(detailPageUrl);
        const $imgList = utils.htmlTo$dom(detailPageHtml).find("#main > article > .entry-content > p img");
        if (!$imgList || 0 === $imgList.length) {
            clog.error("解析JavFree详情页失败:", detailPageUrl);
            throw new Error("解析JavFree详情页失败");
        }
        const srcList = $imgList.filter((function() {
            const src = $(this).attr("src");
            return src && src.toLowerCase().endsWith(".jpeg");
        })).map((function() {
            return $(this).attr("src");
        })).get();
        console.log(srcList);
        return srcList.at(-1);
    }
    addImg(title, imgUrl) {
        if (imgUrl) {
            isJavDb && $(".screen-container").html(`<img src="${imgUrl}" alt="${title}" loading="lazy" style="width: 100%;">`);
            isJavBus && $(".screen-container").html(`<div class="photo-frame"><img src="${imgUrl}" style="height: inherit;width: 100%;" title="${title}" alt="${title}"></div>`);
            $(".screen-container").on("click", (event => {
                event.stopPropagation();
                event.preventDefault();
                showImageViewer(event.currentTarget);
            }));
        }
    }
    showErrorFallback(carNum2, error) {
        var _a2;
        console.error("获取缩略图失败:", null == (_a2 = null == error ? void 0 : error.message) ? void 0 : _a2.substring(0, 100));
        let differentCss = isJavBus ? "margin-top: 30px" : "margin-top: 50px";
        $(".screen-container").html(`<div style="${differentCss}; cursor:auto;color:#000;">获取缩略图失败</div><br/><a href='#' class='retry-link'>点击重试</a> 或 <a class="check-link" href='https://javstore.net/search/${carNum2}.html' target='_blank'>前往确认</a>`).off("click", ".retry-link").off("click", ".check-link").on("click", ".retry-link", (async e => {
            e.stopPropagation();
            e.preventDefault();
            $(".screen-container").html(`<div style="${differentCss};cursor:auto;color:#000;">正在重新加载...</div>`);
            try {
                const imgUrl = await this.getScreenshot(carNum2);
                this.addImg("缩略图", imgUrl);
            } catch (err) {
                this.showErrorFallback(carNum2, err);
            }
        })).on("click", ".check-link", (async e => {
            e.stopPropagation();
            e.preventDefault();
            window.open(`https://javstore.net/search/${carNum2}.html`, "_blank");
        }));
    }
}

export { ScreenShotPlugin };
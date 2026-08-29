import { BasePlugin } from '../core/base-plugin.js';
import { __publicField } from '../core/constants.js';
import { javDbApi } from '../api/javdb.js';

class HitShowPlugin extends BasePlugin {
    constructor() {
        super();
        __publicField(this, "$contentBox", $(".section .container"));
    }
    getName() {
        return "HitShowPlugin";
    }
    handle() {
        $('a[href*="rankings/playback"]').on("click", (event => {
            event.preventDefault();
            event.stopPropagation();
            window.location.href = "/advanced_search?handlePlayback=1&period=daily";
        }));
        this.handlePlayback().then();
    }
    hookPage() {
        let $h2 = $("h2.section-title");
        $h2.contents().first().replaceWith("热播");
        $h2.css("marginBottom", "0");
        $(".empty-message").remove();
        $(".section .container .box").remove();
        $("#sort-toggle-btn").remove();
        this.$contentBox.append('<div class="tool-box" style="margin-top: 10px"></div>');
        this.$contentBox.append('<div class="movie-list h cols-4 vcols-8" style="margin-top: 10px"></div>');
    }
    async handlePlayback() {
        if (!window.location.href.includes("handlePlayback=1")) return;
        let period = new URLSearchParams(window.location.search).get("period");
        this.toolBar(period);
        this.hookPage();
        let $movieBox = $(".movie-list");
        $movieBox.html("");
        let loadObj = loading();
        try {
            const movies = await javDbApi.playback(period);
            let moviesHtml = javDbApi.markDataListHtml(movies);
            $movieBox.html(moviesHtml);
        } catch (e) {
            clog.error("发生错误:", e);
        } finally {
            loadObj.close();
        }
    }
    toolBar(period) {
        let conditionHtml = `\n            <div class="button-group" style="margin-top:18px">\n                <div class="buttons has-addons" id="conditionBox">\n                    <a style="padding:18px 18px !important;" class="button is-small ${"daily" === period ? "is-info" : ""}" href="/advanced_search?handlePlayback=1&period=daily">日榜</a>\n                    <a style="padding:18px 18px !important;" class="button is-small ${"weekly" === period ? "is-info" : ""}" href="/advanced_search?handlePlayback=1&period=weekly">周榜</a>\n                    <a style="padding:18px 18px !important;" class="button is-small ${"monthly" === period ? "is-info" : ""}" href="/advanced_search?handlePlayback=1&period=monthly">月榜</a>\n                </div>\n            </div>\n        `;
        this.$contentBox.append(conditionHtml);
    }
    getStarRating(score) {
        let stars = "";
        const fullStars = Math.floor(score);
        for (let i = 0; i < fullStars; i++) stars += '<i class="icon-star"></i>';
        for (let i = 0; i < 5 - fullStars; i++) stars += '<i class="icon-star gray"></i>';
        return stars;
    }
    loadScore(movies) {
        if (0 === movies.length) return;
        (async () => {
            for (const movie of movies) try {
                const movieId = movie.id;
                if (!$(`#score_${movieId}`).length) return;
                if ($(`#${movieId}`).is(":hidden")) continue;
                const cacheData = localStorage.getItem("jhs_score_info") ? JSON.parse(localStorage.getItem("jhs_score_info")) : {}, cached = cacheData[movieId];
                if (cached) {
                    this.appendScoreHtml(movieId, cached);
                    continue;
                }
                for (;!document.hasFocus(); ) await new Promise((r => setTimeout(r, 500)));
                const res = await javDbApi.getMovieDetail(movieId);
                let score = res.score, watchedCount = res.watchedCount, html = `\n                        <span class="value">\n                            <span class="score-stars">${this.getStarRating(score)}</span> \n                            &nbsp; ${score}分，由${watchedCount}人評價\n                        </span>\n                    `;
                this.appendScoreHtml(movieId, html);
                cacheData[movieId] = html;
                localStorage.setItem("jhs_score_info", JSON.stringify(cacheData));
                await new Promise((r => setTimeout(r, 500)));
            } catch (err) {
                clog.error(`🚨 解析评分数据失败 | 编号: ${movie.number}\n`, `错误详情: ${err.message}\n`, err.stack ? `调用栈:\n${err.stack}` : "");
            }
        })();
    }
    appendScoreHtml(movieId, scoreHtml) {
        let $scoreBox = $(`#score_${movieId}`);
        $scoreBox.length && "" === $scoreBox.html().trim() && $scoreBox.slideUp(0, (function() {
            $(this).html(scoreHtml).slideDown(500);
        }));
    }
}


export { HitShowPlugin };
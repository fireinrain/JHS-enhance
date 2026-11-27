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
            window.location.href = "/rankings/playback";
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
        if (!window.location.href.includes("rankings/playback")) return;
        let period = new URLSearchParams(window.location.search).get("period");
        this.toolBar(period);
        this.hookPage();
        let $movieBox = $(".movie-list");
        $movieBox.html("");
        let loadObj = loading();
        try {
            const res = await javDbApi.playback(period);
            if (1 === res.success) {
                let movies = res.data.movies;
                let moviesHtml = javDbApi.markDataListHtml(movies);
                $movieBox.html(moviesHtml);
                this.pluginManager.getBean("ListPagePlugin").doFilter();
            } else {
                clog.error(res);
                $movieBox.html(`<h3>${res.message}</h3>`);
                show.error(res.message);
                if ("JWTVerificationError" === res.action) {
                    await localStorage.removeItem("jhs_appAuthorization");
                    this.openLoginDialog();
                }
            }
        } catch (e) {
            clog.error("发生错误:", e);
        } finally {
            loadObj.close();
        }
    }
    toolBar(period) {
        let conditionHtml = `\n            <div class="button-group" style="margin-top:18px">\n                <div class="buttons has-addons" id="conditionBox">\n                    <a style="padding:18px 18px !important;" class="button is-small ${"daily" === period ? "is-info" : ""}" href="/rankings/playback?period=daily">日榜</a>\n                    <a style="padding:18px 18px !important;" class="button is-small ${"weekly" === period ? "is-info" : ""}" href="/rankings/playback?period=weekly">周榜</a>\n                    <a style="padding:18px 18px !important;" class="button is-small ${"monthly" === period ? "is-info" : ""}" href="/rankings/playback?period=monthly">月榜</a>\n                </div>\n            </div>\n        `;
        this.$contentBox.append(conditionHtml);
    }

    openLoginDialog() {
        layer.open({
            type: 1,
            title: "JavDB",
            closeBtn: 1,
            area: ["360px", "auto"],
            shadeClose: !1,
            content: '\n                <div style="padding: 30px; font-family: \'Helvetica Neue\', Arial, sans-serif;">\n                    <div style="margin-bottom: 25px;">\n                        <input type="text" id="username" name="username" \n                            style="width: 100%; padding: 12px 15px; border: 1px solid #e0e0e0; border-radius: 4px; \n                                   box-sizing: border-box; transition: all 0.3s; font-size: 14px;\n                                   background: #f9f9f9; color: #333;"\n                            placeholder="用户名 | 邮箱"\n                            onfocus="this.style.borderColor=\'#4a8bfc\'; this.style.background=\'#fff\'"\n                            onblur="this.style.borderColor=\'#e0e0e0\'; this.style.background=\'#f9f9f9\'">\n                    </div>\n                    \n                    <div style="margin-bottom: 15px;">\n                        <input type="password" id="password" name="password" \n                            style="width: 100%; padding: 12px 15px; border: 1px solid #e0e0e0; border-radius: 4px; \n                                   box-sizing: border-box; transition: all 0.3s; font-size: 14px;\n                                   background: #f9f9f9; color: #333;"\n                            placeholder="密码"\n                            onfocus="this.style.borderColor=\'#4a8bfc\'; this.style.background=\'#fff\'"\n                            onblur="this.style.borderColor=\'#e0e0e0\'; this.style.background=\'#f9f9f9\'">\n                    </div>\n                    \n                    <button id="loginBtn" \n                            style="width: 100%; padding: 12px; background: #4a8bfc; color: white; \n                                   border: none; border-radius: 4px; font-size: 15px; cursor: pointer;\n                                   transition: background 0.3s;"\n                            onmouseover="this.style.background=\'#3a7be0\'"\n                            onmouseout="this.style.background=\'#4a8bfc\'">\n                        登录\n                    </button>\n                </div>\n            ',
            success: (layero, index) => {
                $("#loginBtn").click((function () {
                    const username = $("#username").val(), password = $("#password").val();
                    if (!username || !password) {
                        show.error("请输入用户名和密码");
                        return;
                    }
                    let loadObj = loading();
                    javDbApi.login(username, password).then((async res => {
                        let success = res.success;
                        if (0 === success) show.error(res.message); else {
                            if (1 !== success) {
                                clog.error("登录失败", res);
                                throw new Error(res.message);
                            }
                            {
                                let token = res.data.token;
                                await localStorage.setItem("jhs_appAuthorization", token);
                                show.ok("登录成功");
                                layer.close(index);
                                window.location.href = "/rankings/playback" + window.location.search;
                            }
                        }
                    })).catch((err => {
                        clog.error("登录异常:", err);
                        show.error(err.message);
                    })).finally((() => {
                        loadObj.close();
                    }));
                }));
            }
        });
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
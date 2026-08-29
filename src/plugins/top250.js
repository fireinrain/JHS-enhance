import { BasePlugin } from '../core/base-plugin.js';
import { __publicField } from '../core/constants.js';
import { javDbApi } from '../api/javdb.js';
import { GM_openInTab } from 'vite-plugin-monkey/dist/client';

class TOP250Plugin extends BasePlugin {
    constructor() {
        super();
        __publicField(this, "has_cnsub", "");
        __publicField(this, "$contentBox", $(".section .container"));
        __publicField(this, "movies", []);
    }
    getName() {
        return "TOP250Plugin";
    }
    handle() {
        $('.main-tabs ul li:contains("猜你喜歡")').html('<a href="/rankings/top"><span>Top250</span></a>');
        $('a[href*="rankings/top"]').on("click", (event => {
            event.preventDefault();
            event.stopPropagation();
            const $target = $(event.target), href = ($target.is("a") ? $target : $target.closest("a")).attr("href");
            let queryString = href.includes("?") ? href.split("?")[1] : href;
            const urlParams = new URLSearchParams(queryString);
            this.checkLogin(event, urlParams);
        }));
        this.handleTop().then();
    }
    hookPage() {
        $("h2.section-title").contents().first().replaceWith("Top250");
        $(".empty-message").remove();
        $(".section .container .box").remove();
        $("#sort-toggle-btn").remove();
        this.$contentBox.append('<div class="tool-box" style="margin-top: 10px"></div>');
        this.$contentBox.append('<div class="movie-list h cols-4 vcols-8" style="margin-top: 10px"></div>');
        this.renderPagination();
    }
    renderPagination() {
        const urlParams = new URLSearchParams(window.location.search);
        let currentPage = parseInt(urlParams.get("page")) || 1;
        this.$contentBox.append((page => {
            const isNextDisabled = page >= 5;
            let paginationListHTML = "";
            for (let i = 1; i <= 5; i++) {
                paginationListHTML += `<li><a class="pagination-link ${page === i ? "is-current" : ""}" data-page="${i}">${i}</a></li>`;
            }
            return `\n                <nav class="pagination">\n                    <a class="pagination-previous ${page <= 1 ? "do-hide" : ""}" data-page="${page - 1}">上一頁</a>\n                    <a class="pagination-next ${isNextDisabled ? "do-hide" : ""}" data-page="${page + 1}">下一頁</a>\n                    \n                    <ul class="pagination-list">\n                        ${paginationListHTML}\n                    </ul>\n                </nav>\n            `;
        })(currentPage));
        this.$contentBox.on("click", ".pagination-link, .pagination-previous, .pagination-next", (event => {
            event.preventDefault();
            const newPage = parseInt($(event.currentTarget).data("page"));
            !isNaN(newPage) && newPage > 0 && (newPage => {
                urlParams.set("page", newPage);
                window.history.pushState({}, "", "?" + urlParams.toString());
                window.location.reload();
            })(newPage);
        }));
    }
    async handleTop() {
        if (!window.location.href.includes("handleTop=1")) return;
        const urlParams = new URLSearchParams(window.location.search);
        let type = urlParams.get("handleType") || "all", type_value = urlParams.get("type_value") || "";
        this.has_cnsub = urlParams.get("has_cnsub") || "";
        let page = urlParams.get("page") || 1;
        this.toolBar(type, type_value, page);
        this.hookPage();
        let $movieBox = $(".movie-list");
        $movieBox.html("");
        let loadObj = loading();
        try {
            const res = await javDbApi.top250(type, type_value, page, 50);
            let successFlag = res.success, message = res.message, action = res.action;
            if (1 === successFlag) {
                let dataList = res.data.movies;
                if (0 === dataList.length) {
                    show.error("无数据");
                    loadObj.close();
                    return;
                }
                this.movies = dataList;
                const filter_movies = dataList.filter((item => "1" === this.has_cnsub ? item.has_cnsub : "0" !== this.has_cnsub || !item.has_cnsub));
                let moviesHtml = javDbApi.markDataListHtml(filter_movies);
                $movieBox.html(moviesHtml);
            } else {
                clog.error(res);
                $movieBox.html(`<h3>${message}</h3>`);
                show.error(message);
                if ("JWTVerificationError" === action) {
                    await localStorage.removeItem("jhs_appAuthorization");
                    await this.checkLogin(null, new URLSearchParams(window.location.search));
                }
            }
        } catch (e) {
            clog.error("发生错误:", e);
        } finally {
            loadObj.close();
        }
    }
    toolBar(type, type_value, currentPage) {
        "5" === currentPage.toString() && $(".pagination-next").remove();
        $(".pagination-ellipsis").closest("li").remove();
        $(".pagination-list li a").each((function() {
            parseInt($(this).text()) > 5 && $(this).closest("li").remove();
        }));
        let yearHtml = "";
        for (let year = (new Date).getFullYear(); year >= 2008; year--) yearHtml += `\n                <a style="padding:18px 18px !important;" \n                   class="button is-small ${type_value === year.toString() ? "is-info" : ""}" \n                   href="/advanced_search?handleTop=1&handleType=year&type_value=${year}&has_cnsub=${this.has_cnsub}">\n                  ${year}\n                </a>\n            `;
        let conditionHtml = `\n            <div class="button-group">\n                <div class="buttons has-addons" id="conditionBox" style="margin-bottom: 0!important;">\n                    <a style="padding:18px 18px !important;" class="button is-small ${"all" === type ? "is-info" : ""}" href="/advanced_search?handleTop=1&handleType=all&type_value=&has_cnsub=${this.has_cnsub}">全部</a>\n                    <a style="padding:18px 18px !important;" class="button is-small ${"0" === type_value ? "is-info" : ""}" href="/advanced_search?handleTop=1&handleType=video_type&type_value=0&has_cnsub=${this.has_cnsub}">有码</a>\n                    <a style="padding:18px 18px !important;" class="button is-small ${"1" === type_value ? "is-info" : ""}" href="/advanced_search?handleTop=1&handleType=video_type&type_value=1&has_cnsub=${this.has_cnsub}">无码</a>\n                    <a style="padding:18px 18px !important;" class="button is-small ${"2" === type_value ? "is-info" : ""}" href="/advanced_search?handleTop=1&handleType=video_type&type_value=2&has_cnsub=${this.has_cnsub}">欧美</a>\n                    <a style="padding:18px 18px !important;" class="button is-small ${"3" === type_value ? "is-info" : ""}" href="/advanced_search?handleTop=1&handleType=video_type&type_value=3&has_cnsub=${this.has_cnsub}">Fc2</a>\n                    \n                    <a style="padding:18px 18px !important;margin-left: 50px" class="button is-small ${"1" === this.has_cnsub ? "is-info" : ""}" data-cnsub-value="1">含中字磁鏈</a>\n                    <a style="padding:18px 18px !important;" class="button is-small ${"0" === this.has_cnsub ? "is-info" : ""}" data-cnsub-value="0">无字幕</a>\n                    <a style="padding:18px 18px !important;" class="button is-small" data-cnsub-value="">重置</a>\n                </div>\n                \n                <div class="buttons has-addons" id="conditionBox">\n                    ${yearHtml}\n                </div>\n            </div>\n        `;
        this.$contentBox.append(conditionHtml);
        $("a[data-cnsub-value]").on("click", (event => {
            const cnsubValue = $(event.currentTarget).data("cnsub-value");
            this.has_cnsub = cnsubValue.toString();
            $("a[data-cnsub-value]").removeClass("is-info");
            $(event.currentTarget).addClass("is-info");
            $(".toolbar a.button").not("[data-cnsub-value]").each(((index, element) => {
                const $link = $(element), url = new URL($link.attr("href"), window.location.origin);
                url.searchParams.set("has_cnsub", cnsubValue);
                $link.attr("href", url.toString());
            }));
            const filter_movies = this.movies.filter((item => "1" === this.has_cnsub ? item.has_cnsub : "0" !== this.has_cnsub || !item.has_cnsub));
            let moviesHtml = javDbApi.markDataListHtml(filter_movies);
            $(".movie-list").html(moviesHtml);
        }));
    }
    async checkLogin(event, urlParams) {
        if (!localStorage.getItem("jhs_appAuthorization")) {
            show.error("该类别依赖移动端接口，请先完成登录");
            this.openLoginDialog();
            return;
        }
        let type = "all", type_value = "", t = urlParams.get("t") || "";
        if (/^y\d+$/.test(t)) {
            type = "year";
            type_value = t.substring(1);
        } else if ("" !== t) {
            type = "video_type";
            type_value = t;
        }
        let url = `/advanced_search?handleTop=1&handleType=${type}&type_value=${type_value}`;
        event && (event.ctrlKey || event.metaKey) ? GM_openInTab(window.location.origin + url, {
            insert: 0
        }) : window.location.href = url;
    }
    openLoginDialog() {
        layer.open({
            type: 1,
            title: "JavDB",
            closeBtn: 1,
            area: [ "360px", "auto" ],
            shadeClose: !1,
            content: '\n                <div style="padding: 30px; font-family: \'Helvetica Neue\', Arial, sans-serif;">\n                    <div style="margin-bottom: 25px;">\n                        <input type="text" id="username" name="username" \n                            style="width: 100%; padding: 12px 15px; border: 1px solid #e0e0e0; border-radius: 4px; \n                                   box-sizing: border-box; transition: all 0.3s; font-size: 14px;\n                                   background: #f9f9f9; color: #333;"\n                            placeholder="用户名 | 邮箱"\n                            onfocus="this.style.borderColor=\'#4a8bfc\'; this.style.background=\'#fff\'"\n                            onblur="this.style.borderColor=\'#e0e0e0\'; this.style.background=\'#f9f9f9\'">\n                    </div>\n                    \n                    <div style="margin-bottom: 15px;">\n                        <input type="password" id="password" name="password" \n                            style="width: 100%; padding: 12px 15px; border: 1px solid #e0e0e0; border-radius: 4px; \n                                   box-sizing: border-box; transition: all 0.3s; font-size: 14px;\n                                   background: #f9f9f9; color: #333;"\n                            placeholder="密码"\n                            onfocus="this.style.borderColor=\'#4a8bfc\'; this.style.background=\'#fff\'"\n                            onblur="this.style.borderColor=\'#e0e0e0\'; this.style.background=\'#f9f9f9\'">\n                    </div>\n                    \n                    <button id="loginBtn" \n                            style="width: 100%; padding: 12px; background: #4a8bfc; color: white; \n                                   border: none; border-radius: 4px; font-size: 15px; cursor: pointer;\n                                   transition: background 0.3s;"\n                            onmouseover="this.style.background=\'#3a7be0\'"\n                            onmouseout="this.style.background=\'#4a8bfc\'">\n                        登录\n                    </button>\n                </div>\n            ',
            success: (layero, index) => {
                $("#loginBtn").click((function() {
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
                                window.location.href = "/advanced_search?handleTop=1&period=daily";
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
}


export { TOP250Plugin };
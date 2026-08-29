import { BasePlugin } from '../core/base-plugin.js';
import { __publicField, currentHref, Status_FILTER, Status_FAVORITE, Status_HAS_DOWN, Status_HAS_WATCH, YES } from '../core/constants.js';

class Fc2By123AvPlugin extends BasePlugin {
    constructor() {
        super(...arguments);
        __publicField(this, "$contentBox", $(".section .container"));
        __publicField(this, "urlParams", new URLSearchParams(window.location.search));
        __publicField(this, "sortVal", this.urlParams.get("sort") || "release_date");
        __publicField(this, "currentPage", this.urlParams.get("page") ? parseInt(this.urlParams.get("page")) : 1);
        __publicField(this, "maxPage", null);
        __publicField(this, "keyword", this.urlParams.get("keyword") || null);
    }
    getName() {
        return "Fc2By123AvPlugin";
    }
    async getBaseUrl() {
        const otherSitePlugin = this.getBean("OtherSitePlugin");
        return await otherSitePlugin.getAv123Url() + "/ja";
    }
    handle() {
        $("#navbar-menu-hero > div > div:nth-child(1) > div > a:nth-child(4)").after('<a class="navbar-item" href="/advanced_search?type=100&released_start=2099-09">123Av-Fc2</a>');
        $('.tabs li:contains("FC2")').after('<li><a href="/advanced_search?type=100&released_start=2099-09"><span>123Av-Fc2</span></a></li>');
        if (currentHref.includes("/advanced_search?type=100")) {
            this.hookPage();
            this.handleQuery().then();
        }
    }
    hookPage() {
        let $h2 = $("h2.section-title");
        $h2.contents().first().replaceWith("123Av");
        $h2.css("marginBottom", "0");
        $h2.append('\n            <div style="margin-left: 100px; width: 400px;">\n                <input id="search-123av-keyword" type="text" placeholder="搜索123Av Fc2ppv内容" style="padding: 4px 5px;margin-right: 0">\n                <a id="search-123av-btn" class="a-primary" style="margin-left: 0">搜索</a>\n                <a id="clear-123av-btn" class="a-info" style="margin-left: 0">重置</a>\n            </div>\n        ');
        $("#search-123av-keyword").val(this.keyword);
        $("#search-123av-btn").on("click", (async () => {
            let keyword = $("#search-123av-keyword").val().trim();
            if (keyword) {
                this.keyword = keyword;
                utils.setHrefParam("keyword", keyword);
                await this.handleQuery();
            }
        }));
        $("#clear-123av-btn").on("click", (async () => {
            $("#search-123av-keyword").val("");
            this.keyword = "";
            utils.setHrefParam("keyword", "");
            $(".page-box").show();
            $(".tool-box").show();
            await this.handleQuery();
        }));
        $(".empty-message").remove();
        $("#foldCategoryBtn").remove();
        $(".section .container .box").remove();
        $("#sort-toggle-btn").remove();
        this.$contentBox.append('<div class="tool-box" style="margin-top: 10px"></div>');
        this.$contentBox.append('<div class="movie-list h cols-4 vcols-8" style="margin-top: 10px"></div>');
        this.$contentBox.append('<div class="page-box"></div>');
        $(".tool-box").append('\n            <div class="button-group">\n                <div class="buttons has-addons" id="conditionBox">\n                    <a style="padding:18px 18px !important;" class="button is-small" data-sort="release_date">发布日期</a>\n                    <a style="padding:18px 18px !important;" class="button is-small" data-sort="recent_update">最近更新</a>\n                    <a style="padding:18px 18px !important;" class="button is-small" data-sort="trending">热门</a>\n                    <a style="padding:18px 18px !important;" class="button is-small" data-sort="most_viewed_today">今天最多观看</a>\n                    <a style="padding:18px 18px !important;" class="button is-small" data-sort="most_viewed_week">本周最多观看</a>\n                    <a style="padding:18px 18px !important;" class="button is-small" data-sort="most_viewed_month">本月最多观看</a>\n                    <a style="padding:18px 18px !important;" class="button is-small" data-sort="most_viewed">最多观看</a>\n                    <a style="padding:18px 18px !important;" class="button is-small" data-sort="most_favourited">最受欢迎</a>\n                </div>\n            </div>\n        ');
        $(`#conditionBox a[data-sort="${this.sortVal}"]`).addClass("is-info");
        utils.setHrefParam("sort", this.sortVal);
        utils.setHrefParam("page", this.currentPage);
        $("#conditionBox").on("click", "a.button", (e => {
            let $target = $(e.target);
            this.sortVal = $target.data("sort");
            utils.setHrefParam("sort", this.sortVal);
            $target.siblings().removeClass("is-info");
            $target.addClass("is-info");
            this.handleQuery();
        }));
        $(".page-box").append('\n            <nav class="pagination">\n                <a class="pagination-previous">上一页</a>\n                <ul class="pagination-list"></ul>\n                <a class="pagination-next">下一页</a>\n            </nav>\n        ');
        $(document).on("click", ".pagination-link", (e => {
            e.preventDefault();
            this.currentPage = parseInt($(e.target).data("page"));
            utils.setHrefParam("page", this.currentPage);
            this.renderPagination();
            this.handleQuery();
        }));
        $(".pagination-previous").on("click", (e => {
            e.preventDefault();
            if (this.currentPage > 1) {
                this.currentPage--;
                utils.setHrefParam("page", this.currentPage);
                this.renderPagination();
                this.handleQuery();
            }
        }));
        $(".pagination-next").on("click", (e => {
            e.preventDefault();
            if (this.currentPage < this.maxPage) {
                this.currentPage++;
                utils.setHrefParam("page", this.currentPage);
                this.renderPagination();
                this.handleQuery();
            }
        }));
    }
    renderPagination() {
        const $paginationList = $(".pagination-list");
        $paginationList.empty();
        let startPage = Math.max(1, this.currentPage - 2), endPage = Math.min(this.maxPage, this.currentPage + 2);
        this.currentPage <= 3 ? endPage = Math.min(6, this.maxPage) : this.currentPage >= this.maxPage - 2 && (startPage = Math.max(this.maxPage - 5, 1));
        if (startPage > 1) {
            $paginationList.append('<li><a class="pagination-link" data-page="1">1</a></li>');
            startPage > 2 && $paginationList.append('<li><span class="pagination-ellipsis">…</span></li>');
        }
        for (let i = startPage; i <= endPage; i++) {
            const activeClass = i === this.currentPage ? " is-current" : "";
            $paginationList.append(`<li><a class="pagination-link${activeClass}" data-page="${i}">${i}</a></li>`);
        }
        if (endPage < this.maxPage) {
            endPage < this.maxPage - 1 && $paginationList.append('<li><span class="pagination-ellipsis">…</span></li>');
            $paginationList.append(`<li><a class="pagination-link" data-page="${this.maxPage}">${this.maxPage}</a></li>`);
        }
    }
    async handleQuery() {
        let loadObj = loading();
        try {
            let pagesToFetch = [];
            pagesToFetch = 1 === this.currentPage ? [ 1, 2 ] : [ 2 * this.currentPage - 1, 2 * this.currentPage ];
            if (this.keyword) {
                pagesToFetch = [ 1 ];
                $(".page-box").hide();
                $(".tool-box").hide();
            }
            const baseUrl = await this.getBaseUrl(), fetchPromises = pagesToFetch.map((page => {
                let url = `${baseUrl}/tags/fc2?sort=${this.sortVal}&page=${page}`;
                this.keyword && (url = `${baseUrl}/search?keyword=${this.keyword}`);
                return gmHttp.get(url);
            })), htmlResults = await Promise.all(fetchPromises);
            let dataList = [];
            for (const html of htmlResults) {
                let $dom = $(html);
                $dom.find(".box-item").each(((index, element) => {
                    const $item = $(element), imgSrc = $item.find("img").attr("data-src");
                    let carNum2 = $item.find("img").attr("title");
                    const detailLink = $item.find(".detail a"), link = detailLink.attr("href"), href = baseUrl + (link.startsWith("/") ? link : "/" + link), title = detailLink.text().trim().replace(carNum2 + " - ", "");
                    carNum2 = carNum2.replace("FC2-PPV", "FC2");
                    dataList.push({
                        imgSrc: imgSrc,
                        carNum: carNum2,
                        href: href,
                        title: title
                    });
                }));
                if (!this.maxPage) {
                    let rawMaxPage, lastPageItem = $dom.find(".page-item:not(.disabled)").last();
                    if (lastPageItem.find("a.page-link").length) {
                        let href = lastPageItem.find("a.page-link").attr("href");
                        rawMaxPage = parseInt(href.split("page=")[1]);
                    } else rawMaxPage = parseInt(lastPageItem.find("span.page-link").text());
                    this.maxPage = Math.ceil(rawMaxPage / 2);
                    this.renderPagination();
                }
            }
            if (0 === dataList.length) {
                console.log(dataList);
                show.error("无结果");
                let errorUrl = `${baseUrl}/dm4/tags/fc2?sort=${this.sortVal}`;
                this.keyword && (errorUrl = `${baseUrl}/search?keyword=${this.keyword}`);
                console.error("获取数据失败!", errorUrl);
            }
            let movieHtml = this.markDataListHtml(dataList);
            $(".movie-list").html(movieHtml);
            await utils.smoothScrollToTop();
        } catch (e) {
            console.error(e);
        } finally {
            loadObj.close();
        }
    }
    async open123AvFc2Dialog(carNum2, href) {
        let otherHtml = "";
        await storageManager.getSetting("enableLoadOtherSite", YES) === YES && (otherHtml = '<div class="movie-panel-info fc2-movie-panel-info" style="margin-top:20px"><strong>第三方站点: </strong></div>');
        let pageHtml = `\n            <div class="movie-detail-container">\n               \x3c!-- <div class="movie-poster-container">\n                    <iframe class="movie-trailer" frameborder="0" allowfullscreen scrolling="no"></iframe>\n                </div>\n                <div class="right-box">--\x3e\n                    <div class="movie-info-container">\n                        <div class="search-loading">加载中...</div>\n                    </div>\n                    \n                    ${otherHtml}\n                    \n                    <div style="margin: 10px 0">\n                        <a id="filterBtn" class="menu-btn" style="background-color:#de3333"><span>🚫 屏蔽</span></a>\n                        <a id="favoriteBtn" class="menu-btn" style="background-color:#25b1dc"><span>⭐ 收藏</span></a>\n                        <a id="hasDownBtn" class="menu-btn" style="background-color:#7bc73b"><span>📥️ 已下载</span></a>\n                        <a id="hasWatchBtn" class="menu-btn" style="background-color:#d7a80c;"><span>🔍 已观看</span></a>\n                        \n                        <a id="subtitleSearchBtn" class="menu-btn fr-btn" style="background:linear-gradient(to left, #375f7c, #2196F3)">\n                            <span>字幕搜索</span>\n                        </a>\n                        <!--\n                        <a id="search-subtitle-btn" class="menu-btn fr-btn" style="background:linear-gradient(to bottom, #8d5656, rgb(196,159,91))">\n                            <span>字幕 (SubTitleCat)</span>\n                        </a>\n                        <a id="xunLeiSubtitleBtn" class="menu-btn fr-btn" style="background:linear-gradient(to left, #375f7c, #2196F3)">\n                            <span>字幕 (迅雷)</span>\n                        </a>\n                        -->\n                    </div>\n                    <div class="message video-panel" style="margin-top:20px">\n                        <div id="magnets-content" class="magnet-links">\n                        </div>\n                    </div>\n                    <div id="reviews-content">\n                    </div>\n                    <div id="related-content">\n                    </div>\n                    <span id="data-actress" style="display: none"></span>\n               \x3c!-- </div>--\x3e\n            </div>\n        `;
        layer.open({
            type: 1,
            title: carNum2,
            content: pageHtml,
            area: utils.getDefaultArea(),
            skin: "movie-detail-layer",
            scrollbar: !1,
            success: (layero, index) => {
                utils.setupEscClose(index);
                this.loadData(carNum2, href);
                let keyword = carNum2.replace("FC2-", "");
                $("#magnets-content").append(this.getBean("MagnetHubPlugin").createMagnetHub(keyword));
                $("#favoriteBtn").on("click", (async event => {
                    const actress = $("#data-actress").text(), publishTime = $("#data-publishTime").text();
                    await storageManager.saveCar({
                        carNum: carNum2,
                        url: href,
                        names: actress,
                        actionType: Status_FAVORITE,
                        publishTime: publishTime
                    });
                    window.refresh();
                    layer.closeAll();
                }));
                $("#filterBtn").on("click", (event => {
                    utils.q(event, `是否屏蔽${carNum2}?`, (async () => {
                        const actress = $("#data-actress").text(), publishTime = $("#data-publishTime").text();
                        await storageManager.saveCar({
                            carNum: carNum2,
                            url: href,
                            names: actress,
                            actionType: Status_FILTER,
                            publishTime: publishTime
                        });
                        window.refresh();
                        layer.closeAll();
                        window.location.href.includes("collection_codes?movieId") && utils.closePage();
                    }));
                }));
                $("#hasDownBtn").on("click", (async event => {
                    const actress = $("#data-actress").text(), publishTime = $("#data-publishTime").text();
                    await storageManager.saveCar({
                        carNum: carNum2,
                        url: href,
                        names: actress,
                        actionType: Status_HAS_DOWN,
                        publishTime: publishTime
                    });
                    window.refresh();
                    layer.closeAll();
                }));
                $("#hasWatchBtn").on("click", (async event => {
                    const actress = $("#data-actress").text(), publishTime = $("#data-publishTime").text();
                    await storageManager.saveCar({
                        carNum: carNum2,
                        url: href,
                        names: actress,
                        actionType: Status_HAS_WATCH,
                        publishTime: publishTime
                    });
                    window.refresh();
                    layer.closeAll();
                }));
                $("#subtitleSearchBtn").on("click", (() => {
                    window.JavPackSubtitle.openSearchModal({details: {code: carNum2}});
                }));
                window.JavPackSubtitle.preload115Matches(carNum2);
                // $("#search-subtitle-btn").on("click", (event => utils.openPage(`https://subtitlecat.com/index.php?search=${carNum2}`, carNum2, !1, event)));
                // $("#xunLeiSubtitleBtn").on("click", (() => this.getBean("DetailPageButtonPlugin").searchXunLeiSubtitle(carNum2)));
                let tempCarNum = carNum2.replace("FC2-", "");
                this.getBean("OtherSitePlugin").loadOtherSite(tempCarNum, carNum2).then();
            }
        });
    }
    async loadData(carNum2, href) {
        let loadObj = loading();
        try {
            const {id: id, publishDate: publishDate, title: title, moviePoster: moviePoster} = await this.get123AvVideoInfo(href);
            $(".movie-info-container").html(`\n                    <h3 class="movie-title" style="margin-bottom: 10px"><strong class="current-title">${title || "无标题"}</strong></h3>\n                    <div class="movie-meta" style="margin-bottom: 10px">\n                        <span><strong>番号: </strong>${carNum2 || "未知"}</span>\n                        <span><strong>年份: </strong>${publishDate || "未知"}</span>\n                        <span>\n                            <strong>站点: </strong>\n                            <a href="https://fc2ppvdb.com/articles/${carNum2.replace("FC2-", "")}" target="_blank">fc2ppvdb</a>\n                            <a style="margin-left: 5px;" href="https://adult.contents.fc2.com/article/${carNum2.replace("FC2-", "")}/" target="_blank">fc2电子市场</a>\n                        </span>\n                    </div>\n                    <div class="movie-actors" style="margin-bottom: 10px">\n                        <div class="actor-list"><strong>主演: </strong></div>\n                    </div>\n                    <div class="movie-seller" style="margin-bottom: 10px">\n                        <span><strong>販売者: </strong></span>\n                    </div>\n                    <div class="movie-gallery" style="margin-bottom: 10px">\n                        <strong>剧照: </strong>\n                        <div class="image-list"></div>\n                    </div>\n                    \n                    <div id="data-publishTime" style="display: none">${publishDate || ""}</div>\n\n                `);
            this.getImgList(carNum2).then();
            this.getActressInfo(carNum2).then();
            this.getBean("TranslatePlugin").translate(carNum2, !1).then();
        } catch (e) {
            console.error(e);
        } finally {
            loadObj.close();
        }
    }
    handleLongImg(carNum2) {
        utils.loopDetector((() => $(".movie-gallery .image-list").length > 0), (async () => {
            $(".movie-gallery .image-list").prepend(' <a class="tile-item screen-container" style="overflow:hidden;max-height: 150px;max-width:150px; text-align:center;"><div style="margin-top: 50px;color: #000;cursor: auto">正在加载缩略图</div></a> ');
            const imgUrl = await this.getBean("ScreenShotPlugin").getScreenshot(carNum2);
            if (imgUrl) {
                $(".screen-container").html(`<img src="${imgUrl}" alt="" loading="lazy" style="width: 100%;">`);
                $(".screen-container").on("click", (event => {
                    event.stopPropagation();
                    event.preventDefault();
                    showImageViewer(event.currentTarget);
                }));
            }
        }));
    }
    async get123AvVideoInfo(href) {
        const html = await gmHttp.get(href), match = html.match(/v-scope="Movie\({id:\s*(\d+),/), id = match ? match[1] : null, $dom = utils.htmlTo$dom(html);
        return {
            id: id,
            publishDate: $dom.find('span:contains("リリース日:")').next("span").text(),
            title: $dom.find("h1").text().trim(),
            moviePoster: $dom.find("#player").attr("data-poster")
        };
    }
    async getActressInfo(fc2Num) {
        let url = `https://fc2ppvdb.com/articles/${fc2Num.replace("FC2-", "")}`;
        const html = await gmHttp.get(url), $dom = $(html), actressNodeList = $dom.find("div").filter((function() {
            return 0 === $(this).text().trim().indexOf("女優：");
        }));
        if (0 === actressNodeList.length || actressNodeList.length > 1) {
            show.error("解析女优信息失败");
            return;
        }
        const $actress = $(actressNodeList[0]).find("a");
        let actorsHtml = "<strong>主演: </strong>";
        if ($actress.length > 0) {
            let actress = "";
            $actress.each(((index, ele) => {
                let $actor = $(ele), name2 = $actor.text(), actressHref = $actor.attr("href");
                actorsHtml += `<span class="actor-tag"><a href="https://fc2ppvdb.com${actressHref}" target="_blank">${name2}</a></span>`;
                actress += name2 + " ";
            }));
            $("#data-actress").text(actress);
        } else actorsHtml += "<span>暂无演员信息</span>";
        $(".actor-list").html(actorsHtml);
        const sellerNodeList = $dom.find("div").filter((function() {
            return 0 === $(this).text().trim().indexOf("販売者：");
        }));
        if (sellerNodeList.length > 0) {
            const $sellerA = $(sellerNodeList[0]).find("a");
            if ($sellerA.length > 0) {
                const $seller = $($sellerA[0]);
                let name2 = $seller.text(), sellerHref = $seller.attr("href");
                $(".movie-seller").html(`<span><strong>販売者: </strong><a href="https://fc2ppvdb.com${sellerHref}" target="_blank">${name2}</a></span>`);
            }
        }
    }
    async getImgList(fc2Num) {
        let tempCarNum = fc2Num.replace("FC2-", ""), url = `https://adult.contents.fc2.com/article/${fc2Num.replace("FC2-", "")}/`;
        const html = await gmHttp.get(url, null, {
            referer: url
        });
        let imgList = $(html).find(".items_article_SampleImagesArea img").map((function() {
            return $(this).attr("src");
        })).get(), imagesHtml = "";
        Array.isArray(imgList) && imgList.length > 0 ? imagesHtml = imgList.map(((img, index) => `\n                <a href="${img}" data-fancybox="movie-gallery" data-caption="剧照 ${index + 1}">\n                    <img src="${img}" class="movie-image-thumb"  alt=""/>\n                </a>\n            `)).join("") : $(".movie-gallery").html("<h4>剧照: 暂无剧照</h4>");
        $(".image-list").html(imagesHtml);
        this.handleLongImg(tempCarNum);
    }
    async getMovie(id, moviePoster) {
        let url = `${await this.getBaseUrl()}/ajax/v/${id}/videos`, loadObj = loading();
        try {
            let movieList = (await gmHttp.get(url)).result.watch;
            if (movieList.length > 0) {
                movieList.forEach((movieItem => {
                    movieItem.url = movieItem.url + "?poster=" + moviePoster;
                }));
                return movieList;
            }
            return null;
        } catch (e) {
            console.error(e);
        } finally {
            loadObj.close();
        }
    }
    markDataListHtml(movies) {
        let moviesHtml = "";
        movies.forEach((movie => {
            moviesHtml += `\n                <div class="item">\n                    <a href="${movie.href}" class="box" title="${movie.title}">\n                        <div class="cover ">\n                            <img loading="lazy" src="${movie.imgSrc.replace("/s360", "")}" alt="">\n                        </div>\n                        <div class="video-title"><strong>${movie.carNum}</strong> ${movie.title}</div>\n                        <div class="score">\n                        </div>\n                        <div class="meta">\n                        </div>\n                        <div class="tags has-addons">\n                        </div>\n                    </a>\n                </div>\n            `;
        }));
        return moviesHtml;
    }
}


export { Fc2By123AvPlugin };
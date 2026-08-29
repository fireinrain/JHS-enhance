import { BasePlugin } from '../core/base-plugin.js';
import { __publicField, currentHref, Status_FILTER, Status_FAVORITE, Status_HAS_DOWN, Status_HAS_WATCH } from '../core/constants.js';
import { javDbApi } from '../api/javdb.js';

class Fc2Plugin extends BasePlugin {
    getName() {
        return "Fc2Plugin";
    }
    async initCss() {
        return "\n            <style>\n                /* 弹层样式 */\n                .movie-detail-layer .layui-layer-title {\n                    font-size: 18px;\n                    color: #333;\n                    background: #f8f8f8;\n                }\n                \n                \n                /* 容器样式 */\n                .movie-detail-container {\n                    margin: 40px;\n                    height: 100%;\n                    background: #fff;\n                }\n                \n                .movie-poster-container {\n                    flex: 0 0 60%;\n                    padding: 15px;\n                }\n                \n                .right-box {\n                    flex: 1;\n                    padding: 20px;\n                    overflow-y: auto;\n                }\n                \n                /* 预告片iframe */\n                .movie-trailer {\n                    width: 100%;\n                    height: 100%;\n                    min-height: 400px;\n                    background: #000;\n                    border-radius: 4px;\n                }\n                \n                /* 电影信息样式 */\n                .movie-title {\n                    font-size: 24px;\n                    margin-bottom: 15px;\n                    color: #333;\n                }\n                \n                .movie-meta {\n                    margin-bottom: 20px;\n                    color: #666;\n                }\n                \n                .movie-meta span {\n                    margin-right: 15px;\n                }\n                \n                /* 演员列表 */\n                .actor-list {\n                    display: flex;\n                    flex-wrap: wrap;\n                    gap: 8px;\n                    margin-top: 10px;\n                }\n                \n                .actor-tag {\n                    padding: 4px 12px;\n                    background: #f0f0f0;\n                    border-radius: 15px;\n                    font-size: 12px;\n                    color: #555;\n                }\n                \n                /* 图片列表 */\n                .image-list {\n                    display: flex;\n                    flex-wrap: wrap;\n                    gap: 10px;\n                    margin-top: 10px;\n                }\n                \n                .movie-image-thumb {\n                    width: 120px;\n                    height: 80px;\n                    object-fit: cover;\n                    border-radius: 4px;\n                    cursor: pointer;\n                    transition: transform 0.3s;\n                }\n                \n                .movie-image-thumb:hover {\n                    transform: scale(1.05);\n                }\n                \n                /* 加载中和错误状态 */\n                .search-loading, .movie-error {\n                    padding: 40px;\n                    text-align: center;\n                    color: #999;\n                }\n                \n                .movie-error {\n                    color: #f56c6c;\n                }\n                \n                .fancybox-container{\n                    z-index:99999999\n                 }\n                 \n                 \n                 /* 错误提示样式 */\n                .movie-not-found, .movie-error {\n                    text-align: center;\n                    padding: 30px;\n                    color: #666;\n                }\n                \n                .movie-not-found h3, .movie-error h3 {\n                    color: #f56c6c;\n                    margin: 15px 0;\n                }\n                \n                .icon-warning, .icon-error {\n                    font-size: 50px;\n                    color: #e6a23c;\n                }\n                \n                .icon-error {\n                    color: #f56c6c;\n                }\n                \n                .fc2-movie-panel-info .panel-block {\n                    padding: 0 !important;\n                }\n            </style>\n        ";
    }
    handle() {
        let fc2Url = "/advanced_search?type=3&score_min=0&d=1";
        $('.navbar-item:contains("FC2")').attr("href", fc2Url);
        $('.tabs a:contains("FC2")').attr("href", fc2Url);
        if (currentHref.includes("advanced_search?type=3")) {
            $("h2.section-title").contents().first().replaceWith("Fc2PPV");
            $(".section .container > .box").remove();
        }
        if (currentHref.includes("collection_codes?movieId")) {
            $("section").html("");
            const urlParams = new URLSearchParams(window.location.search);
            let movieId = urlParams.get("movieId"), carNum2 = urlParams.get("carNum"), url = urlParams.get("url");
            movieId && carNum2 && url && this.openFc2Dialog(movieId, carNum2, url);
        }
    }
    openFc2Dialog(movieId, carNum2, href) {
        let tempCarNum = carNum2.replace("FC2-", "");
        if (href.includes("123av")) {
            this.getBean("Fc2By123AvPlugin").open123AvFc2Dialog(carNum2, href);
            return;
        }
        layer.open({
            type: 1,
            title: carNum2,
            content: '\n            <div class="movie-detail-container">\n                \x3c!--<div class="movie-poster-container">\n                    <iframe class="movie-trailer" frameborder="0" allowfullscreen scrolling="no"></iframe>\n                </div>--\x3e\n               \x3c!-- <div class="right-box">--\x3e\n                    <div class="movie-info-container">\n                        <div class="search-loading">加载中...</div>\n                    </div>\n                    \n                    <div class="movie-panel-info fc2-movie-panel-info" style="margin-top:20px"><strong>第三方资源: </strong></div>\n                    \n                    <div style="margin: 30px 0">\n                        <a id="filterBtn" class="menu-btn" style="background-color:#de3333"><span>🚫 屏蔽</span></a>\n                        <a id="favoriteBtn" class="menu-btn" style="background-color:#25b1dc"><span>⭐ 收藏</span></a>\n                        <a id="hasDownBtn" class="menu-btn" style="background-color:#7bc73b"><span>📥️ 已下载</span></a>\n                        <a id="hasWatchBtn" class="menu-btn" style="background-color:#d7a80c;"><span>🔍 已观看</span></a>\n                        \n                        <a id="search-subtitle-btn" class="menu-btn fr-btn" style="background:linear-gradient(to bottom, #8d5656, rgb(196,159,91))">\n                            <span>字幕 (SubTitleCat)</span>\n                        </a>\n                        <a id="xunLeiSubtitleBtn" class="menu-btn fr-btn" style="background:linear-gradient(to left, #375f7c, #2196F3)">\n                            <span>字幕 (迅雷)</span>\n                        </a>\n                        <a id="magnetSearchBtn" class="menu-btn fr-btn" style="width: 120px; background: linear-gradient(to right, rgb(245,140,1), rgb(84,161,29)); color: white; text-align: center; padding: 8px 0;">\n                            <span>磁力搜索</span>\n                        </a>\n                    </div>\n                    <div class="message video-panel" style="margin-top:20px">\n                        <div id="magnets-content" class="magnet-links" style="margin: 0 0.75rem">\n                            <div class="search-loading">加载中...</div>\n                        </div>\n                    </div>\n                    <div id="reviews-content">\n                    </div>\n                    <div id="related-content">\n                    </div>\n                    <span id="data-actress" style="display: none"></span>\n                \x3c!--</div>--\x3e\n            </div>\n        ',
            area: utils.getResponsiveArea([ "70%", "90%" ]),
            skin: "movie-detail-layer",
            scrollbar: !1,
            success: (layero, index) => {
                this.loadData(movieId, carNum2);
                $("#favoriteBtn").on("click", (async event => {
                    const actress = $("#data-actress").text(), publishTime = $("#data-releaseDate").text();
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
                        const actress = $("#data-actress").text(), publishTime = $("#data-releaseDate").text();
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
                    const actress = $("#data-actress").text(), publishTime = $("#data-releaseDate").text();
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
                    const actress = $("#data-actress").text(), publishTime = $("#data-releaseDate").text();
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
                $("#search-subtitle-btn").on("click", (event => utils.openPage(`https://subtitlecat.com/index.php?search=${carNum2}`, carNum2, !1, event)));
                $("#xunLeiSubtitleBtn").on("click", (() => this.getBean("DetailPageButtonPlugin").searchXunLeiSubtitle(carNum2)));
                $("#magnetSearchBtn").on("click", (() => {
                    let magnetHub = this.getBean("MagnetHubPlugin").createMagnetHub(carNum2);
                    layer.open({
                        type: 1,
                        title: "磁力搜索",
                        content: '<div id="magnetHubBox"></div>',
                        area: utils.getResponsiveArea([ "60%", "80%" ]),
                        scrollbar: !1,
                        success: () => {
                            $("#magnetHubBox").append(magnetHub);
                        }
                    });
                }));
                this.getBean("OtherSitePlugin").loadOtherSite(tempCarNum, carNum2).then();
                utils.setupEscClose(index);
            },
            end() {
                window.location.href.includes("collection_codes?movieId") && utils.closePage();
            }
        });
    }
    loadData(movieId, carNum2) {
        let tempCarNum = carNum2.replace("FC2-", "");
        this.handleMovieDetail(movieId);
        this.handleLongImg(tempCarNum);
        this.handleMagnets(movieId);
        this.getBean("ReviewPlugin").showReview(movieId, $("#reviews-content")).then();
        this.getBean("RelatedPlugin").showRelated($("#related-content"), movieId).then();
    }
    handleMovieDetail(movieId) {
        javDbApi.getMovieDetail(movieId).then((res => {
            const actors = res.actors || [], imgList = res.imgList || [];
            let actorsHtml = "";
            if (actors.length > 0) {
                let actress = "";
                for (let i = 0; i < actors.length; i++) {
                    let actor = actors[i];
                    actorsHtml += `<span class="actor-tag"><a href="/actors/${actor.id}" target="_blank">${actor.name}</a></span>`;
                    0 === actor.gender && (actress += actor.name + " ");
                }
                $("#data-actress").text(actress);
            } else actorsHtml = '<span class="no-data">暂无演员信息</span>';
            let imagesHtml = "";
            imagesHtml = Array.isArray(imgList) && imgList.length > 0 ? imgList.map(((img, index) => `\n                <a href="${img}" data-fancybox="movie-gallery" data-caption="剧照 ${index + 1}">\n                    <img src="${img}" class="movie-image-thumb"  alt=""/>\n                </a>\n            `)).join("") : '<div class="no-data">暂无剧照</div>';
            $(".movie-info-container").html(`\n                <h3 class="movie-title"><strong class="current-title">${res.title || "无标题"}</strong></h3>\n                <div class="movie-meta">\n                    <span><strong>番号: </strong>${res.carNum || "未知"}</span>\n                    <span><strong>年份: </strong>${res.releaseDate || "未知"}</span>\n                    <span><strong>评分: </strong>${res.score || "无"}</span>\n                    <span><strong>时长: </strong>${res.duration + " m" || "无"}</span>\n                </div>\n                <div class="movie-meta">\n                    <span>\n                        <strong>站点: </strong>\n                        <a href="https://fc2ppvdb.com/articles/${res.carNum.replace("FC2-", "")}" target="_blank">fc2ppvdb</a>\n                        <a style="margin-left: 5px;" href="https://adult.contents.fc2.com/article/${res.carNum.replace("FC2-", "")}/" target="_blank">fc2电子市场</a>\n                    </span>\n                </div>\n                <div class="movie-actors">\n                    <div class="actor-list"><strong>主演: </strong>${actorsHtml}</div>\n                </div>\n                <div class="movie-gallery" style="margin-top:10px">\n                    <strong>剧照: </strong>\n                    <div class="image-list">${imagesHtml}</div>\n                </div>\n                <div id="data-releaseDate" style="display: none">${res.releaseDate || ""}</div>\n            `);
            this.getBean("TranslatePlugin").translate(res.carNum, !1).then();
        })).catch((err => {
            console.error(err);
            $(".movie-info-container").html(`\n                <div class="movie-error">加载失败: ${err.message}</div>\n            `);
        }));
    }
    handleLongImg(carNum2) {
        utils.loopDetector((() => $(".movie-gallery .image-list").length > 0), (async () => {
            $(".movie-gallery .image-list").prepend(' <a class="tile-item screen-container" style="overflow:hidden;max-height: 150px;max-width:150px; text-align:center;"><div style="margin-top: 50px;color: #000;cursor: auto">正在加载缩略图</div></a> ');
            const screenShotPlugin = this.getBean("ScreenShotPlugin"), imgUrl = await screenShotPlugin.getScreenshot(carNum2);
            imgUrl && await screenShotPlugin.addImg("缩略图", imgUrl);
        }));
    }
    handleMagnets(movieId) {
        javDbApi.getMagnets(movieId).then((magnetList => {
            let magnetsHtml = "";
            if (magnetList.length > 0) for (let i = 0; i < magnetList.length; i++) {
                let magnet = magnetList[i], oddClass = "";
                i % 2 == 0 && (oddClass = "odd");
                magnetsHtml += `\n                        <div class="item columns is-desktop ${oddClass}">\n                            <div class="magnet-name column is-four-fifths">\n                                <a href="magnet:?xt=urn:btih:${magnet.hash}" title="右鍵點擊並選擇「複製鏈接地址」">\n                                    <span class="name">${magnet.name}</span>\n                                    <br>\n                                    <span class="meta">\n                                        ${(magnet.size / 1024).toFixed(2)}GB, ${magnet.files_count}個文件 \n                                     </span>\n                                    <br>\n                                    <div class="tags">\n                                        ${magnet.hd ? '<span class="tag is-primary is-small is-light">高清</span>' : ""}\n                                        ${magnet.cnsub ? '<span class="tag is-warning is-small is-light">字幕</span>' : ""}\n                                    </div>\n                                </a>\n                            </div>\n                            <div class="buttons column">\n                                <button class="button is-info is-small copy-to-clipboard" data-clipboard-text="magnet:?xt=urn:btih:${magnet.hash}" type="button">&nbsp;複製&nbsp;</button>\n                            </div>\n                            <div class="date column"><span class="time">${magnet.created_at}</span></div>\n                        </div>\n                    `;
            } else magnetsHtml = '<span class="no-data">暂无磁力信息</span>';
            $("#magnets-content").html(magnetsHtml);
            $(".buttons button[data-clipboard-text*='magnet:']").each(((i, el) => {
                $(el).parent().append($("<button>").text("115离线下载").addClass("button is-info is-small").click((async event => {
                    event.stopPropagation();
                    event.preventDefault();
                    let loadObj = loading();
                    try {
                        await this.getBean("WangPan115TaskPlugin").handleAddTask($(el).attr("data-clipboard-text"));
                    } catch (e) {
                        show.error("发生错误:" + e);
                        console.error(e);
                    } finally {
                        loadObj.close();
                    }
                })));
            }));
        })).catch((err => {
            console.error(err);
            $("#magnets-content").html(`\n                <div class="movie-error">加载失败: ${err.message}</div>\n            `);
        }));
    }
    async openFc2Page(movieId, carNum2, url) {
        const otherSitePlugin = this.getBean("OtherSitePlugin");
        let javDbUrl = await otherSitePlugin.getJavDbUrl();
        window.open(`${javDbUrl}/users/collection_codes?movieId=${movieId}&carNum=${carNum2}&url=${url}`);
    }
}


export { Fc2Plugin };
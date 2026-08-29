import { BasePlugin } from '../core/base-plugin.js';
import { __publicField, isJavBus, isJavDb, NO, YES } from '../core/constants.js';
import { javDbApi } from '../api/javdb.js';

class ReviewPlugin extends BasePlugin {
    constructor() {
        super(...arguments);
        __publicField(this, "floorIndex", 1);
        __publicField(this, "isInit", !1);
    }
    getName() {
        return "ReviewPlugin";
    }
    async handle() {
        $(document).on("click", ".down-115", (async event => {
            const magnet = $(event.currentTarget).data("magnet");
            let loadObj = loading();
            try {
                await this.getBean("WangPan115TaskPlugin").handleAddTask(magnet);
            } catch (e) {
                show.error("发生错误:" + e);
                console.error(e);
            } finally {
                loadObj.close();
            }
        }));
        if (window.isDetailPage) {
            if (isJavDb) {
                const movieId = this.parseMovieId(window.location.href);
                await this.showReview(movieId);
                await this.getBean("RelatedPlugin").showRelated($("#magnets-content"), movieId);
            }
            if (isJavBus) {
                let carNum2 = this.getPageInfo().carNum;
                const movies = await javDbApi.searchMovie(carNum2);
                let movieId = null;
                for (let i = 0; i < movies.length; i++) {
                    let item = movies[i];
                    if (item.number.toLowerCase() === carNum2.toLowerCase()) {
                        movieId = item.id;
                        break;
                    }
                }
                if (!movieId) return;
                this.showReview(movieId, $("#sample-waterfall")).then();
            }
        }
    }
    async showReview(movieId, $eleBox) {
        const enableLoadReview = await storageManager.getSetting("enableLoadReview", YES), $magnets = $eleBox || $("#magnets-content");
        $magnets.append(`\n            <div style="display: flex; align-items: center; margin: 16px 0; color: #666; font-size: 14px;">\n                <span style="flex: 1; height: 1px; background: linear-gradient(to right, transparent, #999, transparent);"></span>\n                <span style="padding: 0 10px;" data-tip="想要发表评论? 滑上去, 点击上面的按钮-看过">❓ 评论区</span>\n                <a id="reviewsFold" style="margin-left: 8px; color: #1890ff; text-decoration: none; display: flex; align-items: center;">\n                    <span class="toggle-text">${enableLoadReview === YES ? "折叠" : "展开"}</span>\n                    <span class="toggle-icon" style="margin-left: 4px;">${enableLoadReview === YES ? "▲" : "▼"}</span>\n                </a>\n                <span style="flex: 1; height: 1px; background: linear-gradient(to right, transparent, #999, transparent);"></span>\n            </div>\n        `);
        $("#reviewsFold").on("click", (event => {
            event.preventDefault();
            event.stopPropagation();
            const $text = $("#reviewsFold .toggle-text"), $icon = $("#reviewsFold .toggle-icon"), isFolded = "展开" === $text.text();
            $text.text(isFolded ? "折叠" : "展开");
            $icon.text(isFolded ? "▲" : "▼");
            if (isFolded) {
                $("#reviewsContainer").show();
                $("#reviewsFooter").show();
                if (!this.isInit) {
                    this.fetchAndDisplayReviews(movieId);
                    this.isInit = !0;
                }
                storageManager.saveSettingItem("enableLoadReview", YES);
            } else {
                $("#reviewsContainer").hide();
                $("#reviewsFooter").hide();
                storageManager.saveSettingItem("enableLoadReview", NO);
            }
        }));
        $magnets.append('<div id="reviewsContainer"></div>');
        $magnets.append('<div id="reviewsFooter"></div>');
        enableLoadReview === YES && await this.fetchAndDisplayReviews(movieId);
    }
    async fetchAndDisplayReviews(movieId) {
        const $reviewsContainer = $("#reviewsContainer"), $reviewsFooter = $("#reviewsFooter");
        $reviewsContainer.append('<div id="reviewsLoading" style="margin-top:15px;background-color:#ffffff;padding:10px;margin-left: -10px;">获取评论中...</div>');
        const reviewCount = await storageManager.getSetting("reviewCount", 20);
        let dataList = null;
        try {
            dataList = await javDbApi.getReviews(movieId, 1, reviewCount);
        } catch (e) {
            e.toString().includes("簽名已過期") && show.error("生成签名失败, 请检查系统时间及时区是否正确!");
            clog.error("获取评论失败:", e);
            console.error("获取评论失败:", e);
        } finally {
            $("#reviewsLoading").remove();
        }
        if (!dataList) {
            $reviewsContainer.append('\n                <div style="margin-top:15px;background-color:#ffffff;padding:10px;margin-left: -10px;">\n                    获取评论失败\n                    <a id="retryFetchReviews" href="javascript:;" style="margin-left: 10px; color: #1890ff; text-decoration: none;">重试</a>\n                </div>\n            ');
            $("#retryFetchReviews").on("click", (async () => {
                $("#retryFetchReviews").parent().remove();
                await this.fetchAndDisplayReviews(movieId);
            }));
            return;
        }
        if (0 === dataList.length) {
            $reviewsContainer.append('<div style="margin-top:15px;background-color:#ffffff;padding:10px;margin-left: -10px;">无评论</div>');
            return;
        }
        const reviewKeywordList = await storageManager.getReviewFilterKeywordList();
        this.displayReviews(dataList, $reviewsContainer, reviewKeywordList);
        if (dataList.length === reviewCount) {
            $reviewsFooter.html('\n                <button id="loadMoreReviews" style="width:100%; background-color: #e1f5fe; border:none; padding:10px; margin-top:10px; cursor:pointer; color:#0277bd; font-weight:bold; border-radius:4px;">\n                    加载更多评论\n                </button>\n                <div id="reviewsEnd" style="display:none; text-align:center; padding:10px; color:#666; margin-top:10px;">已加载全部评论</div>\n            ');
            let currentPage = 1, $loadMoreReviews = $("#loadMoreReviews");
            $loadMoreReviews.on("click", (async () => {
                $loadMoreReviews.text("加载中...").prop("disabled", !0);
                currentPage++;
                let moreData;
                try {
                    moreData = await javDbApi.getReviews(movieId, currentPage, reviewCount);
                } catch (e) {
                    console.error("加载更多评论失败:", e);
                } finally {
                    $loadMoreReviews.text("加载失败, 请点击重试").prop("disabled", !1);
                }
                if (moreData) {
                    this.displayReviews(moreData, $reviewsContainer, reviewKeywordList);
                    if (moreData.length < reviewCount) {
                        $loadMoreReviews.remove();
                        $("#reviewsEnd").show();
                    } else $loadMoreReviews.text("加载更多评论").prop("disabled", !1);
                }
            }));
        } else $reviewsFooter.html('<div style="text-align:center; padding:10px; color:#666; margin-top:10px;">已加载全部评论</div>');
    }
    displayReviews(dataList, $container, reviewKeywordList) {
        if (dataList.length) {
            dataList.forEach((item => {
                if (reviewKeywordList.some((keyword => item.content.includes(keyword)))) return;
                const starsHtml = Array(item.score).fill('<i class="icon-star"></i>').join(""), content = item.content.replace(/ed2k:\/\/\|file\|[^|]+\|\d+\|[a-fA-F0-9]{32}\|\/|magnet:\?[^\s"'<>`\u4e00-\u9fa5，。？！（）【】]+|https?:\/\/[^\s"'<>`\u4e00-\u9fa5，。？！（）【】]+/g, (match => match.startsWith("ed2k://") ? `\n                            <span style="word-break: break-all;background: #e0f2fe;color: #0369a1;">${match}</span>\n                            <button class="button is-info down-115" data-magnet="${match}" style="font-size: 11px">115离线下载</button>\n                        ` : match.startsWith("magnet:") ? `\n                            <a href="${match}" class="a-primary" style="padding:0; word-break: break-all; white-space: pre-wrap;" target="_blank" rel="noopener noreferrer">${match}</a>\n                            <button class="button is-info down-115" data-magnet="${match}" style="font-size: 11px">115离线下载</button>\n                        ` : match.startsWith("http://") || match.startsWith("https://") ? `\n                            <a href="${match}" class="a-primary" style="padding:0; word-break: break-all; white-space: pre-wrap;" target="_blank" rel="noopener noreferrer">${match}</a>\n                        ` : match)), commentHtml = `\n                <div class="item columns is-desktop" style="display:block;margin-top:6px;background-color:#ffffff;padding:10px;margin-left: -10px;word-break: break-word;position:relative;">\n                    <span style="position:absolute;top:5px;right:10px;color:#999;font-size:12px;">#${this.floorIndex++}楼</span>\n                    ${item.username} &nbsp;&nbsp; <span class="score-stars">${starsHtml}</span> \n                    <span class="time">${utils.formatDate(item.created_at)}</span> \n                    &nbsp;&nbsp; 点赞:${item.likes_count}\n                    <p class="review-content" style="margin-top: 5px;"> ${content} </p>\n                </div>\n            `;
                $container.append(commentHtml);
            }));
            this.rightClickFilter();
        }
    }
    async rightClickFilter() {
        await storageManager.getSetting("enableTitleSelectFilter", YES) === YES && utils.rightClick(document.body, ".review-content", (async event => {
            const selectedText = window.getSelection().toString();
            if (selectedText) {
                event.preventDefault();
                await utils.q(event, `是否将 '${selectedText}' 加入评论区关键词?`, (async () => {
                    await storageManager.saveReviewFilterKeyword(selectedText);
                    show.ok("操作成功, 刷新页面后生效");
                }));
            }
        }));
    }
}


export { ReviewPlugin };
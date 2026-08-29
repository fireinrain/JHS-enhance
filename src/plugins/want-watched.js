import { BasePlugin } from '../core/base-plugin.js';
import { __publicField, Status_FAVORITE, Status_HAS_DOWN } from '../core/constants.js';

class WantAndWatchedVideosPlugin extends BasePlugin {
    constructor() {
        super(...arguments);
        __publicField(this, "type", null);
    }
    getName() {
        return "WantAndWatchedVideosPlugin";
    }
    async handle() {
        if (window.location.href.includes("/want_watch_videos")) {
            $("h3").append('<a class="a-primary" id="wantWatchBtn" style="padding:10px;">导入至 JHS</a>');
            $("#wantWatchBtn").on("click", (event => {
                this.type = Status_FAVORITE;
                this.importWantWatchVideos(event, "是否将 想看的影片 导入到 JHS-收藏?");
            }));
        }
        if (window.location.href.includes("/watched_videos")) {
            $("h3").append('<a class="a-success" id="wantWatchBtn" style="padding:10px;">导入至 JHS</a>');
            $("#wantWatchBtn").on("click", (event => {
                this.type = Status_HAS_DOWN;
                this.importWantWatchVideos(event, "是否将 看过的影片 导入到 JHS-已下载?");
            }));
        }
    }
    importWantWatchVideos(event, title) {
        utils.q(null, `${title} <br/> <span style='color: #f40'>执行此功能前请记得备份数据</span>`, (async () => {
            let loadObj = loading();
            try {
                await this.parseMovieList();
            } catch (e) {
                console.error(e);
            } finally {
                loadObj.close();
            }
        }));
    }
    async parseMovieList($dom) {
        let movieList, nextPageLink;
        if ($dom) {
            movieList = $dom.find(this.getSelector().itemSelector);
            nextPageLink = $dom.find(".pagination-next").attr("href");
        } else {
            movieList = $(this.getSelector().itemSelector);
            nextPageLink = $(".pagination-next").attr("href");
        }
        for (const element of movieList) {
            const item = $(element), href = item.find("a").attr("href"), carNum2 = item.find(".video-title strong").text().trim(), publishTime = item.find(".meta").text().trim();
            if (href && carNum2) try {
                if (await storageManager.getCar(carNum2)) {
                    show.info(`${carNum2} 已存在, 跳过`);
                    continue;
                }
                await storageManager.saveCar({
                    carNum: carNum2,
                    url: href,
                    names: null,
                    actionType: this.type,
                    publishTime: publishTime
                });
            } catch (error) {
                console.error(`保存失败 [${carNum2}]:`, error);
            }
        }
        if (nextPageLink) {
            show.info("发现下一页，正在解析:", nextPageLink);
            await new Promise((resolve => setTimeout(resolve, 1e3)));
            $.ajax({
                url: nextPageLink,
                method: "GET",
                success: html => {
                    const parser = new DOMParser, next$dom = $(parser.parseFromString(html, "text/html"));
                    this.parseMovieList(next$dom);
                },
                error: function(err) {
                    console.error(err);
                    show.error("加载下一页失败:" + err.message);
                }
            });
        } else {
            show.ok("导入结束!");
            window.refresh();
        }
    }
}


export { WantAndWatchedVideosPlugin };

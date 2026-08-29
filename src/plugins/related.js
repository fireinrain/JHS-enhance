import { BasePlugin } from '../core/base-plugin.js';
import { __publicField, NO, YES } from '../core/constants.js';
import { javDbApi } from '../api/javdb.js';

class RelatedPlugin extends BasePlugin {
    constructor() {
        super(...arguments);
        __publicField(this, "floorIndex", 1);
        __publicField(this, "isInit", !1);
    }
    getName() {
        return "RelatedPlugin";
    }
    async showRelated($eleBox, movieId) {
        const enableLoadRelated = await storageManager.getSetting("enableLoadRelated", NO), $magnets = $eleBox;
        if (movieId) {
            $magnets.append(`\n            <div style="display: flex; align-items: center; margin: 16px 0; color: #666; font-size: 14px;">\n                <span style="flex: 1; height: 1px; background: linear-gradient(to right, transparent, #999, transparent);"></span>\n                <span style="padding: 0 10px;">相关清单</span>\n                <a id="relatedFold" style="margin-left: 8px; color: #1890ff; text-decoration: none; display: flex; align-items: center;">\n                    <span class="toggle-text">${enableLoadRelated === YES ? "折叠" : "展开"}</span>\n                    <span class="toggle-icon" style="margin-left: 4px;">${enableLoadRelated === YES ? "▲" : "▼"}</span>\n                </a>\n                <span style="flex: 1; height: 1px; background: linear-gradient(to right, transparent, #999, transparent);"></span>\n            </div>\n        `);
            $("#relatedFold").on("click", (event => {
                event.preventDefault();
                event.stopPropagation();
                const $text = $("#relatedFold .toggle-text"), $icon = $("#relatedFold .toggle-icon"), isFolded = "展开" === $text.text();
                $text.text(isFolded ? "折叠" : "展开");
                $icon.text(isFolded ? "▲" : "▼");
                if (isFolded) {
                    $("#relatedContainer").show();
                    $("#relatedFooter").show();
                    if (!this.isInit) {
                        this.fetchAndDisplayRelateds(movieId);
                        this.isInit = !0;
                    }
                    storageManager.saveSettingItem("enableLoadRelated", YES);
                } else {
                    $("#relatedContainer").hide();
                    $("#relatedFooter").hide();
                    storageManager.saveSettingItem("enableLoadRelated", NO);
                }
            }));
            $magnets.append('<div id="relatedContainer"></div>');
            $magnets.append('<div id="relatedFooter"></div>');
            enableLoadRelated === YES && await this.fetchAndDisplayRelateds(movieId);
        } else show.error("未传入movieId");
    }
    async fetchAndDisplayRelateds(movieId) {
        const $relatedContainer = $("#relatedContainer"), $relatedFooter = $("#relatedFooter");
        $relatedContainer.append('<div id="relatedLoading" style="margin-top:15px;background-color:#ffffff;padding:10px;margin-left: -10px;">获取清单中...</div>');
        let dataList = null;
        try {
            dataList = await javDbApi.related(movieId, 1, 20);
        } catch (e) {
            console.error("获取清单失败:", e);
        } finally {
            $("#relatedLoading").remove();
        }
        if (dataList) if (0 !== dataList.length) {
            this.displayRelateds(dataList, $relatedContainer);
            if (20 === dataList.length) {
                $relatedFooter.html('\n                <button id="loadMoreRelateds" style="width:100%; background-color: #e1f5fe; border:none; padding:10px; margin-top:10px; cursor:pointer; color:#0277bd; font-weight:bold; border-radius:4px;">\n                    加载更多清单\n                </button>\n                <div id="relatedEnd" style="display:none; text-align:center; padding:10px; color:#666; margin-top:10px;">已加载全部清单</div>\n            ');
                let currentPage = 1, $loadMoreRelateds = $("#loadMoreRelateds");
                $loadMoreRelateds.on("click", (async () => {
                    $loadMoreRelateds.text("加载中...").prop("disabled", !0);
                    currentPage++;
                    let moreData;
                    try {
                        moreData = await javDbApi.related(movieId, currentPage, 20);
                    } catch (e) {
                        console.error("加载更多清单失败:", e);
                    } finally {
                        $loadMoreRelateds.text("加载失败, 请点击重试").prop("disabled", !1);
                    }
                    if (moreData) {
                        this.displayRelateds(moreData, $relatedContainer);
                        if (moreData.length < 20) {
                            $loadMoreRelateds.remove();
                            $("#relatedEnd").show();
                        } else $loadMoreRelateds.text("加载更多清单").prop("disabled", !1);
                    }
                }));
            } else $relatedFooter.html('<div style="text-align:center; padding:10px; color:#666; margin-top:10px;">已加载全部清单</div>');
        } else $relatedContainer.append('<div style="margin-top:15px;background-color:#ffffff;padding:10px;margin-left: -10px;">无清单</div>'); else {
            $relatedContainer.append('\n                <div style="margin-top:15px;background-color:#ffffff;padding:10px;margin-left: -10px;">\n                    获取清单失败\n                    <a id="retryFetchRelateds" href="javascript:;" style="margin-left: 10px; color: #1890ff; text-decoration: none;">重试</a>\n                </div>\n            ');
            $("#retryFetchRelateds").on("click", (async () => {
                $("#retryFetchRelateds").parent().remove();
                await this.fetchAndDisplayRelateds(movieId);
            }));
        }
    }
    displayRelateds(dataList, $container) {
        dataList.length && dataList.forEach((item => {
            let commentHtml = `\n                <div class="item columns is-desktop" style="display:block;margin-top:6px;background-color:#ffffff;padding:10px;margin-left: -10px;word-break: break-word;position:relative;">\n                   <span style="position:absolute;top:5px;right:10px;color:#999;font-size:12px;">#${this.floorIndex++}</span>\n                   <span style="position:absolute;bottom:5px;right:10px;color:#999;font-size:12px;">创建时间: ${item.createTime}</span>\n                   <p><a href="/lists/${item.relatedId}" target="_blank" style="color:#2e8abb">${item.name}</a></p>\n                   <p style="margin-top: 5px;">视频个数: ${item.movieCount}</p>\n                   <p style="margin-top: 5px;">收藏次数: ${item.collectionCount} 被查看次数: ${item.viewCount}</p>\n                </div>\n            `;
            $container.append(commentHtml);
        }));
    }
}


export { RelatedPlugin };
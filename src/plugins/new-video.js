import { BasePlugin } from '../core/base-plugin.js';
import { __publicField } from '../core/constants.js';
import { CDN_SOURCES, STORE_NAME, dbHelper } from './task.js';

class NewVideoPlugin extends BasePlugin {
    constructor() {
        super(...arguments);
        __publicField(this, "currentPage", 1);
        __publicField(this, "pageSize", 30);
    }
    getName() {
        return "NewVideoPlugin";
    }
    async initCss() {
        return "\n            <style>\n                #actress-card-container {\n                    display: grid;\n                    grid-template-columns: repeat(auto-fill, minmax(243px, 1fr)); /* 响应式3-5列 */\n                    gap: 20px;\n                    padding-bottom: 20px;\n                    padding-right: 10px;\n                    background: #f9f9f9;\n                    border-radius: 5px;\n                    overflow-y: auto;\n                }\n                .actress-card {\n                    background: #fff;\n                    border: 1px solid #e0e0e0;\n                    border-radius: 8px;\n                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);\n                    padding: 15px;\n                    text-align: center;\n                    display: flex;\n                    flex-direction: column;\n                    justify-content: space-between;\n                    position: relative;\n                    overflow: hidden;\n                }\n                .actress-card:hover {\n                    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);\n                }\n                .actress-card-name {\n                    font-size: 1.2em;\n                    font-weight: bold;\n                    color: #007bff;\n                    margin-top: 10px;\n                }\n                .actress-card-allname {\n                    font-size: 0.9em;\n                    color: #999;\n                    margin-top: 5px;\n                    height: 30px; /* 保证高度一致性 */\n                    overflow: hidden;\n                    white-space: nowrap;      /* 防止文字换行 */\n                    text-overflow: ellipsis;  /* 当文本溢出时，显示省略号 */\n                }\n                .actress-card-avatar {\n                    width: 100px;\n                    height: 100px;\n                    border-radius: 50%;\n                    object-fit: contain;\n                    margin: 0 auto;\n                    border: 4px solid #f0f0f0;\n                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);\n                }\n                \n                .card-tag {\n                    position: absolute;\n                    top: 15px; /* 调整标签距离顶部的距离 */\n                    right: -50px; /* 调整标签距离右侧的距离，负值让它移到外面一点 */\n                    \n                    width: 150px; /* 标签的宽度，影响斜角长度 */\n                    padding: 5px 0; /* 上下内边距 */\n                    text-align: center;\n                    \n                    background-color: #ff4757; /* 标签颜色 */\n                    color: white; /* 文字颜色 */\n                    font-size: 14px;\n                    font-weight: bold;\n                    z-index: 10; /* 确保标签在其他内容之上 */\n                \n                    /* 3. 核心：旋转标签，使其倾斜 */\n                    transform: rotate(45deg); /* 45度斜角 */\n                    \n                    /* 可选：添加一些阴影或边框效果 */\n                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);\n                }\n                \n                .card-new-count-tag {\n                    position: absolute;\n                    top: 5px;\n                    text-align: center;\n                    font-size: 14px;\n                    font-weight: bold;\n                    z-index: 10;\n                }\n                \n                #actress-pagination {\n                    padding-top: 10px;\n                    text-align: center;\n                    border-top: 1px solid #ddd;\n                }\n                @media (max-width: 600px) {\n                    .page-number-btn {\n                        display: none !important;\n                    }\n                }\n                \n                \n                .card-btn {\n                    width: 44px;\n                    height: 44px;\n                    border-radius: 50%;\n                    display: flex;\n                    justify-content: center;\n                    align-items: center;\n                    text-decoration: none;\n                    border: none;\n                    cursor: pointer;\n                    background: linear-gradient(145deg, #e0e0e0 0%, #f7f7f7 100%);\n                    box-shadow: 8px 8px 16px rgba(0, 0, 0, 0.08),\n                                -8px -8px 16px rgba(255, 255, 255, 1.0);\n                    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);\n                }\n                \n                .card-btn svg,\n                .card-btn svg path {\n                    transition: fill 0.3s ease;\n                }\n                \n                .card-btn:hover {\n                    box-shadow: inset 5px 5px 10px rgba(0, 0, 0, 0.1),\n                                inset -5px -5px 10px rgba(255, 255, 255, 0.9);\n                    transform: scale(0.97);\n                    background: #e0e0e0;\n                }\n                \n                .btn-check-actress svg path {\n                    fill: #4CAF50;\n                }\n                .btn-check-actress:hover svg path {\n                    fill: #388E3C;\n                }\n                \n                .btn-edit-actress svg path {\n                    fill: #FFC107;\n                }\n                .btn-edit-actress:hover svg path {\n                    fill: #FFB300;\n                }\n                \n                .btn-delete-actress svg path {\n                    fill: #F44336;\n                }\n                .btn-delete-actress:hover svg path {\n                    fill: #D32F2F;\n                }\n            </style>\n        ";
    }
    async showNewVideoCount() {
        const totalNewVideoCount = (await storageManager.getFavoriteActressList()).reduce(((accumulator, actress) => {
            var _a2;
            return accumulator + ((null == (_a2 = actress.newVideoList) ? void 0 : _a2.length) ?? 0);
        }), 0);
        $("#newVideoCount").text(`${totalNewVideoCount}`);
    }
    async resetBtnTip() {
        const taskPlugin = this.getBean("TaskPlugin"), settingObj = await storageManager.getSetting(), lastCheckTimeStr = localStorage.getItem(taskPlugin.lastCheckFavoriteActressTimeKey) || "无", checkFavoriteActress_IntervalTime = settingObj.checkFavoriteActress_IntervalTime, lastCheckNewVideoTimeStr = localStorage.getItem(taskPlugin.lastCheckNewVideoTimeKey) || "无", checkNewVideo_intervalTime = settingObj.checkNewVideo_intervalTime;
        $("#checkFavoriteActress").attr("data-tip", `上次自动同步时间: ${lastCheckTimeStr}; 检测间隔时间: ${checkFavoriteActress_IntervalTime}小时`);
        $("#checkNewVideo").attr("data-tip", `上次检测时间: ${lastCheckNewVideoTimeStr}; 检测间隔时间: ${checkNewVideo_intervalTime}小时`);
    }
    async openDialog() {
        const taskPlugin = this.getBean("TaskPlugin"), settingObj = await storageManager.getSetting(), lastCheckTimeStr = localStorage.getItem(taskPlugin.lastCheckFavoriteActressTimeKey) || "无", checkFavoriteActress_IntervalTime = settingObj.checkFavoriteActress_IntervalTime, lastCheckNewVideoTimeStr = localStorage.getItem(taskPlugin.lastCheckNewVideoTimeKey) || "无", checkNewVideo_intervalTime = settingObj.checkNewVideo_intervalTime;
        let html = `\n            <div class="newVideoToolBox" style="display: flex; flex-direction: column; height: 100%; overflow: hidden; padding:10px">\n                <div style="margin-bottom: 15px;display: flex; justify-content: space-between;">\n                    <div>\n                        <a class="a-danger" id="checkFavoriteActress" data-tip="上次自动同步时间: ${lastCheckTimeStr}; 检测间隔时间: ${checkFavoriteActress_IntervalTime}小时">${this.actressSvg} &nbsp;&nbsp; 手动同步演员</a>\n                        <a class="a-warning" id="checkNewVideo" data-tip="上次检测时间: ${lastCheckNewVideoTimeStr}; 检测间隔时间: ${checkNewVideo_intervalTime}小时">${this.newSvg} &nbsp;&nbsp; 手动检测最新作品</a>\n                        <a class="a-info" id="toSetting">${this.settingSvg} &nbsp;&nbsp; 配置</a>\n                        <span id="checkNewVideoMsg"></span>\n                    </div>\n                    <div style="display: flex; align-items: flex-start;">\n                        <select id="paramActressType" style="text-align: center; height: 100%; min-width: 150px; border: 1px solid #ddd; margin-right: 10px">\n                            <option value="all" selected>所有</option>\n                            <option value="uncensored">无码</option>\n                            <option value="censored">有码</option>\n                            <option value="">未知</option>\n                        </select>\n                        \n                        <a class="a-normal" id="reLoad">${this.refreshSvg} &nbsp;&nbsp; 刷新</a>\n                    </div>\n\n                </div>\n                <div id="actress-card-container" class="jhs-scrollbar"></div>\n                <div id="actress-pagination"></div>\n            </div>\n        `;
        layer.open({
            type: 1,
            title: '<span style="padding: 0 10px;" data-tip="数据来源: 女优页面首页,含磁链分类">新作品检测 ❓</span>',
            content: html,
            scrollbar: !1,
            area: utils.getResponsiveArea([ "80%", "90%" ]),
            anim: -1,
            success: async (layero, index) => {
                this.loadData();
                this.bindClick();
                utils.setupEscClose(index);
            }
        });
    }
    bindClick() {
        const taskPlugin = this.getBean("TaskPlugin");
        $("#reLoad").on("click", (event => {
            this.loadData();
            $("#checkNewVideoMsg").text("");
        }));
        $("#toSetting").on("click", (event => {
            this.getBean("SettingPlugin").openSettingDialog("task-panel", (() => {
                $("#setting-checkFavoriteActress").css({
                    border: "1px solid #f40"
                });
                $("#setting-checkNewVideo").css({
                    border: "1px solid #f40"
                });
            }));
        }));
        $("#checkFavoriteActress").on("click", (event => {
            utils.q({
                clientX: event.clientX,
                clientY: event.clientY + 20
            }, "是否手动同步演员?", (() => {
                navigator.locks.request(taskPlugin.singleTaskKey, {
                    ifAvailable: !0
                }, (async lock => {
                    if (!lock) {
                        show.error("当前有定时任务在后台执行中, 无法发起手动任务");
                        return;
                    }
                    if ($('a[href*="/users/profile"]').length > 0) {
                        await taskPlugin.checkFavoriteActress();
                        this.loadData();
                    } else show.error("未登录JavDb, 同步失败");
                })).catch((error => {
                    console.error("锁任务出现错误:", error);
                    clog.error("锁任务出现错误:", error);
                }));
            }));
        }));
        $("#checkNewVideo").on("click", (event => {
            utils.q({
                clientX: event.clientX,
                clientY: event.clientY + 20
            }, "是否手动检测最新作品?", (() => {
                navigator.locks.request(taskPlugin.singleTaskKey, {
                    ifAvailable: !0
                }, (async lock => {
                    lock ? await taskPlugin.checkNewVideo(!0) : show.error("当前有定时任务在后台执行中, 无法发起手动任务");
                })).catch((error => {
                    console.error("锁任务出现错误:", error);
                    clog.error("锁任务出现错误:", error);
                }));
            }));
        }));
        $("#paramActressType").on("change", (event => {
            this.loadData();
        }));
    }
    loadData() {
        this.currentPage = 1;
        this.renderActressCards().then();
    }
    async renderActressCards() {
        const $actressCardContainer = $("#actress-card-container");
        if (!$actressCardContainer.length) return;
        let favoriteActressesList = await storageManager.getFavoriteActressList();
        const paramActressType = $("#paramActressType").val();
        "all" !== paramActressType && (favoriteActressesList = favoriteActressesList.filter((actress => actress.actressType === paramActressType)));
        const fullActressList = utils.genericSort(favoriteActressesList, [ {
            key: item => {
                var _a2;
                return (null == (_a2 = item.newVideoList) ? void 0 : _a2.length) ?? 0;
            },
            order: "desc"
        }, {
            key: "lastPublishTime",
            order: "desc"
        } ]), totalCount = fullActressList.length, totalPages = Math.ceil(totalCount / this.pageSize), startIndex = (this.currentPage - 1) * this.pageSize, endIndex = startIndex + this.pageSize, pagedData = fullActressList.slice(startIndex, endIndex), javDbUrl = await this.getBean("OtherSitePlugin").getJavDbUrl(), taskPlugin = this.getBean("TaskPlugin"), checkNewVideo_ruleTime = await storageManager.getSetting("checkNewVideo_ruleTime") || 8760, cardsHtml = pagedData.map((data => {
            var _a2, _b, _c;
            const allNamesStr = Array.isArray(data.allName) ? data.allName.join("，") : "";
            Array.isArray(data.newVideoList) && data.newVideoList.join("，");
            const detailLink = `${javDbUrl}/actors/${data.starId}?t=d`;
            let isUnCheck = !1;
            data.lastPublishTime && (isUnCheck = !taskPlugin.isUnnecessaryCheck(data.lastPublishTime, checkNewVideo_ruleTime));
            let actressTypeText = "未知", actressTypeBgc = "#9E9E9E";
            if ("uncensored" === data.actressType) {
                actressTypeText = "无码";
                actressTypeBgc = "#4CAF50";
            } else if ("censored" === data.actressType) {
                actressTypeText = "有码";
                actressTypeBgc = "#FF9800";
            }
            let cardUnnecessaryBtnCss = "";
            isUnCheck && (cardUnnecessaryBtnCss = "background: linear-gradient(145deg, #e0e0e0 0%, #cabdbd 100%);box-shadow: none");
            return `\n                <div class="actress-card" data-starId="${data.starId}" style="${isUnCheck ? "background: #d4cece;" : ""} min-height: 370px;">\n                    <a href="${detailLink}" target="_blank" style="text-decoration: none; color: inherit; display: block; flex-grow: 1;">\n                        <img src="${data.avatar || "https://c0.jdbstatic.com/images/actor_unknow.jpg"}" alt="${allNamesStr}" class="actress-card-avatar">\n                    </a>\n\n                    <div>\n                        <a href="${detailLink}" target="_blank" style="text-decoration: none; color: inherit; display: block; flex-grow: 1;">\n                            <div class="actress-card-name">${data.name}</div>\n                        </a>\n                        <div class="actress-card-allname" title="${allNamesStr}">${allNamesStr}</div>\n                    </div>\n                    \n                    <div style="font-size: 0.8em; margin-top: 5px;">\n                         <span>上次检测: ${data.lastCheckTime || ""}</span>\n                    </div>\n                    <div style="font-size: 0.8em; margin-top: 5px;">\n                         <span>最后发行作品: ${data.lastPublishTime || ""}</span>\n                    </div>\n\n                    <div style="font-size: 0.7em; color: #cc4444; margin-top: 5px; min-height: 18px">\n                         <span>${isUnCheck ? "停更" + checkNewVideo_ruleTime / 24 / 365 + "年以上, 下轮任务不再进行检测" : ""}</span>\n                    </div>\n                    \n                    <div style="font-size: 0.8em; margin-top: 5px; color: #3765c5; min-height: 10px">\n                         <span>${data.remark || ""}</span>\n                    </div>\n                    \n                    <div style="margin-top: 10px;display: flex; justify-content:center; gap: 10px;">\n                        <a title="编辑" class="card-btn btn-edit-actress" style="${cardUnnecessaryBtnCss}" data-starId="${data.starId}">${this.editSvg}</a>\n                        <a title="取消收藏" class="card-btn btn-delete-actress" style="${cardUnnecessaryBtnCss}" data-starId="${data.starId}">${this.deleteSvg}</a>\n                        <a title="重新检测该演员" class="card-btn btn-check-actress" style="${cardUnnecessaryBtnCss}" data-starId="${data.starId}">${this.checkSvg}</a>\n                    </div>\n                    \n                    <div class="card-tag" style="background-color:${actressTypeBgc}">${actressTypeText}</div>\n                    <div class="card-new-count-tag" data-tip="最新作品数量: ${(null == (_a2 = data.newVideoList) ? void 0 : _a2.length) || 0}"\n                        style="${(null == (_b = data.newVideoList) ? void 0 : _b.length) > 0 ? "color: #4CAF50;" : ""}"> \n                        🔔 ${(null == (_c = data.newVideoList) ? void 0 : _c.length) || 0} \n                    </div>\n                </div>\n            `;
        })).join("");
        $actressCardContainer.html(cardsHtml);
        $(".btn-delete-actress").off("click").on("click", (e => {
            e.preventDefault();
            const starId = $(e.currentTarget).attr("data-starId"), actress = fullActressList.find((item => item.starId === starId));
            utils.q(e, `是否取消收藏 ${actress.name}?`, (async () => {
                let deleteActressUrl = `${await this.getBean("OtherSitePlugin").getJavDbUrl()}/actors/${starId}/uncollect`;
                const csrfToken = document.querySelector("meta[name=csrf-token]").content, res = await gmHttp.post(deleteActressUrl, null, {
                    "x-csrf-token": csrfToken
                });
                if (res.includes("removeClass")) {
                    await storageManager.removeFavoriteActress(starId);
                    this.loadData();
                } else {
                    show.error("移除失败");
                    clog.error("移除失败,返回值:", res);
                }
            }));
        }));
        $(".btn-edit-actress").off("click").on("click", (e => {
            e.preventDefault();
            const starId = $(e.currentTarget).attr("data-starId"), actress = fullActressList.find((item => item.starId === starId));
            actress ? this.editActress(actress) : show.error(`未找到 starId 为 ${starId} 的女优记录。`);
        }));
        $(".btn-check-actress").off("click").on("click", (e => {
            e.preventDefault();
            navigator.locks.request(taskPlugin.singleTaskKey, {
                ifAvailable: !0
            }, (async lock => {
                if (!lock) {
                    show.error("当前有定时任务在后台执行中, 无法发起手动任务");
                    return;
                }
                const starId = $(e.currentTarget).attr("data-starId"), actress = fullActressList.find((item => item.starId === starId));
                await taskPlugin.checkOneNewVideo(actress);
            })).catch((error => {
                console.error("锁任务出现错误:", error);
                clog.error("锁任务出现错误:", error);
            }));
        }));
        this.renderPagination(totalCount, totalPages);
        show.ok("加载完成");
    }
    async editActress(actress) {
        const initialName = actress.name, initialAvatar = actress.avatar, initialRemark = actress.remark || "", initialAllName = Array.isArray(actress.allName) ? actress.allName.join("，") : "", initialNewVideoList = Array.isArray(actress.newVideoList) ? actress.newVideoList.join("，") : "", starId = actress.starId, textareaStyle = "width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; min-height: 60px; overflow-y: hidden;", initActressType = actress.actressType || "", editFormHtml = `\n            <div style="padding: 20px;">\n                <div style="margin-bottom: 15px; text-align: center;">\n                    <img id="edit-avatar-preview" src="${initialAvatar}" alt="Avatar Preview" \n                         style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; margin-bottom: 10px; border: 2px solid #ddd;">\n                    <div style="text-align: left">\n                        <label style="display: block; margin-bottom: 5px; font-weight: bold;">头像链接:</label>\n                        <input type="text" id="edit-actress-avatar" value="${initialAvatar}" \n                               style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">\n                       <div style="display: flex; gap: 5px; margin-top: 5px;">\n                            <button type="button" id="search-avatar-btn" \n                                style="flex-grow: 1; padding: 8px; background-color: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer;">\n                                搜索头像\n                            </button>\n                            <button type="button" id="select-cdn-btn" \n                                style="width: 100px; padding: 8px; background-color: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">\n                                选择 CDN 源\n                            </button>\n                        </div>\n                    </div>\n                </div>\n                <div style="margin-bottom: 15px;">\n                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">主名称:</label>\n                    <input type="text" id="edit-actress-name" value="${initialName}" \n                           style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">\n                </div>\n                <div style="margin-bottom: 15px;">\n                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">所有别名(用逗号隔开):</label>\n                    <textarea id="edit-actress-allname" style="${textareaStyle}">${initialAllName}</textarea>\n                </div>\n                <div style="margin-bottom: 15px;">\n                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">演员类别:</label>\n                    <select id="actressType" style="width: 100%; padding: 10px; border: 1px solid #ddd;">\n                        <option value="" ${"" === initActressType ? "selected" : ""}>未知</option>\n                        <option value="censored" ${"censored" === initActressType ? "selected" : ""}>有码</option>\n                        <option value="uncensored" ${"uncensored" === initActressType ? "selected" : ""}>无码</option>\n                    </select>\n                </div>\n                <div style="margin-bottom: 15px;">\n                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">最新作品(用逗号隔开):</label>\n                    <textarea id="edit-actress-newvideolist" style="${textareaStyle}">${initialNewVideoList}</textarea>\n                </div>\n                <div style="margin-bottom: 15px;">\n                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">备注:</label>\n                   <textarea id="edit-remark" style="${textareaStyle}">${initialRemark}</textarea>\n                </div>\n            </div>\n        `;
        layer.open({
            type: 1,
            title: `编辑女优: ${initialName} (${starId})`,
            area: [ "500px", "750px" ],
            content: editFormHtml,
            btn: [ "保存", "取消" ],
            success: (layero, index) => {
                const autoResizeTextarea = $textarea => {
                    $textarea.css("height", "auto");
                    $textarea.css("height", $textarea[0].scrollHeight + 15 + "px");
                };
                $("#edit-actress-avatar").on("input", (function() {
                    const newUrl = $(this).val();
                    $("#edit-avatar-preview").attr("src", newUrl);
                }));
                const $allNameTextarea = $("#edit-actress-allname");
                $allNameTextarea.on("input", (function() {
                    autoResizeTextarea($(this));
                }));
                autoResizeTextarea($allNameTextarea);
                const $videoListTextarea = $("#edit-actress-newvideolist");
                $videoListTextarea.on("input", (function() {
                    autoResizeTextarea($(this));
                }));
                autoResizeTextarea($videoListTextarea);
                $("#search-avatar-btn").on("click", (async () => {
                    await this.searchAvatar();
                }));
                $("#select-cdn-btn").on("click", (async () => {
                    await async function() {
                        const initialIndex = currentCdnIndex, radioOptions = CDN_SOURCES.map(((source, index) => `\n        <div style="margin-bottom: 10px;">\n            <input type="radio" id="cdn-${index}" name="cdn-source" value="${index}" ${index === initialIndex ? "checked" : ""} style="margin-right: 10px;">\n            <label for="cdn-${index}">${source.name} ${source.json.includes("jsdelivr") ? "(推荐)" : ""}</label>\n        </div>\n    `)).join(""), cdnSelectHtml = `\n        <div style="padding: 20px;">\n            <p style="margin-bottom: 15px; font-weight: bold; color: #333;">请选择头像数据源 (当前: ${CDN_SOURCES[initialIndex].name}):</p>\n            ${radioOptions}\n            <p style="margin-top: 20px; color: #555; font-size: 12px;">切换源会清除本地缓存的数据，并在下次搜索时重新加载。</p>\n        </div>\n    `;
                        layer.open({
                            type: 1,
                            title: "选择 CDN 源",
                            area: [ "400px", "auto" ],
                            content: cdnSelectHtml,
                            btn: [ "确定", "取消" ],
                            success: (layero, index) => {
                                utils.setupEscClose(index);
                            },
                            yes: async index => {
                                const newIndexStr = $('input[name="cdn-source"]:checked').val(), newIndex = parseInt(newIndexStr, 10);
                                if (newIndex !== currentCdnIndex) {
                                    currentCdnIndex = newIndex;
                                    localStorage.setItem("jhs_img_cdn_index", newIndex.toString());
                                    window.G_FRIENDS_JSON_URL = CDN_SOURCES[newIndex].json;
                                    window.CDN_BASE_URL = CDN_SOURCES[newIndex].base;
                                    window.G_FRIENDS_DATA_CACHE = null;
                                    window.G_FRIENDS_AVATAR_MAP = null;
                                    try {
                                        await dbHelper.set("filetree_data", null);
                                    } catch (e) {
                                        clog.error("清除 IndexedDB 缓存失败:", e);
                                    }
                                    show.ok(`CDN 源已切换为: ${CDN_SOURCES[newIndex].name}`);
                                    layer.close(index);
                                } else layer.close(index);
                            }
                        });
                    }();
                }));
                utils.setupEscClose(index);
            },
            yes: async index => {
                const newAvatar = $("#edit-actress-avatar").val().trim(), newName = $("#edit-actress-name").val().trim(), newAllNameStr = $("#edit-actress-allname").val().trim(), newVideoListStr = $("#edit-actress-newvideolist").val().trim(), newRemark = $("#edit-remark").val().trim(), newActressType = $("#actressType").val();
                if (!newName) {
                    show.error("主名称不能为空");
                    return !1;
                }
                const newAllName = newAllNameStr.split(/[\uff0c,]/).map((n => n.trim())).filter((n => n.length > 0)), newVideoList = newVideoListStr.split(/[\uff0c,]/).map((n => n.trim())).filter((n => n.length > 0));
                actress.avatar = newAvatar;
                actress.name = newName;
                actress.allName = newAllName;
                actress.newVideoList = newVideoList;
                actress.actressType = newActressType;
                actress.remark = newRemark;
                if (await storageManager.updateFavoriteActress(actress)) show.error("修改失败"); else {
                    show.ok(`女优 ${newName} 信息已更新`);
                    await this.renderActressCards();
                    layer.close(index);
                }
            }
        });
    }
    renderPagination(totalCount, totalPages) {
        const currentPage = this.currentPage;
        let paginationHtml = "";
        const $actressPagination = $("#actress-pagination");
        if (0 === totalPages) {
            paginationHtml = '<span style="color: #666;">共 0 条记录</span>';
            $actressPagination.html(paginationHtml);
            return;
        }
        currentPage > 1 && totalPages > 5 && (paginationHtml += '<button class="pagination-btn" data-page="1" style="padding: 8px 12px; margin: 0 5px; background: #f0f0f0; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">首页</button>');
        currentPage > 1 && (paginationHtml += `<button class="pagination-btn" data-page="${currentPage - 1}" style="padding: 8px 12px; margin: 0 5px; background: #f0f0f0; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">上一页</button>`);
        let startPage = Math.max(1, currentPage - Math.floor(2.5)), endPage = Math.min(totalPages, startPage + 5 - 1);
        endPage - startPage < 4 && (startPage = Math.max(1, endPage - 5 + 1));
        for (let i = startPage; i <= endPage; i++) {
            paginationHtml += `<button class="pagination-btn page-number-btn ${i === currentPage ? "active" : ""}" data-page="${i}" style="padding: 8px 12px; margin: 0 3px; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; ${i === currentPage ? "background: #007bff; color: white; border-color: #007bff;" : ""}">${i}</button>`;
        }
        currentPage < totalPages && (paginationHtml += `<button class="pagination-btn" data-page="${currentPage + 1}" style="padding: 8px 12px; margin: 0 5px; background: #f0f0f0; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">下一页</button>`);
        currentPage < totalPages && totalPages > 5 && (paginationHtml += `<button class="pagination-btn" data-page="${totalPages}" style="padding: 8px 12px; margin: 0 5px; background: #f0f0f0; border: 1px solid #ddd; border-radius: 4px; cursor: pointer;">尾页</button>`);
        paginationHtml += `<span style="margin-left: 20px; color: #666;">共 ${totalCount} 条记录 (第 ${currentPage}/${totalPages} 页)</span>`;
        $actressPagination.html(paginationHtml);
        $(".pagination-btn").off("click").on("click", (e => {
            if ($(e.currentTarget).is("[disabled]")) return;
            const newPage = parseInt($(e.currentTarget).data("page"));
            if (newPage >= 1 && newPage <= totalPages && newPage !== this.currentPage) {
                this.currentPage = newPage;
                this.renderActressCards();
            }
        }));
    }
    async searchAvatar() {
        const $mainNameInput = $("#edit-actress-name"), $aliasInput = $("#edit-actress-allname"), currentName = $mainNameInput.val().trim(), searchNames = $aliasInput.val().trim().split(/[\uff0c,]/).map((n => n.trim())).filter((n => n.length > 0));
        currentName && searchNames.unshift(currentName);
        if (0 === searchNames.length) {
            show.error("请先填写女优主名称或别名进行搜索。");
            return;
        }
        const loadObj = loading("正在搜索头像...");
        let imageLinks = [];
        try {
            imageLinks = await searchActorAvatars(searchNames);
        } catch (e) {
            show.error(`头像数据加载或搜索失败: ${e.message || e}`);
            return;
        } finally {
            loadObj.close();
        }
        if (0 === imageLinks.length) {
            show.error(`未找到与 '${searchNames.join("、")}' 相关的头像。请检查名称。`);
            return;
        }
        const imageItems = imageLinks.map(((url, index) => `\n        <div id="wrapper-${index}" class="gfriends-image-item-wrapper">\n            <img alt="" src="${url}" data-url="${url}" class="gfriends-selectable-img" data-wrapper-id="wrapper-${index}" >\n            <div class="gfriends-size-tag" data-size-for="wrapper-${index}">...</div> \n        </div>\n    `)).join(""), imageListHtml = `\n        <style>\n            /* 保持上一个回答的美化样式 */\n            #gfriends-image-list-container { padding: 15px; height: 100%; box-sizing: border-box; background-color: #f8f9fa; }\n            #gfriends-prompt { color: #555; font-weight: 500; border-bottom: 1px solid #eee; padding-bottom: 10px; }\n            #gfriends-image-list { display: flex; flex-wrap: wrap; gap: 15px; justify-content: center; }\n            .gfriends-image-item-wrapper {\n                width: 160px; height: 225px; /* 增加高度以容纳尺寸标签 */\n                overflow: hidden; border-radius: 6px;\n                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1); transition: transform 0.2s ease, box-shadow 0.2s ease;\n                cursor: pointer; position: relative; \n                padding-bottom: 25px; /* 为尺寸标签留出空间 */\n            }\n            .gfriends-selectable-img {\n                width: 100%; height: 200px; /* 固定图片高度 */\n                object-fit: cover; border: 3px solid transparent; \n                border-radius: 6px; transition: border 0.2s ease;\n            }\n            .gfriends-image-item-wrapper:hover {\n                transform: translateY(-4px) scale(1.02);\n                box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);\n            }\n            .gfriends-selectable-img.is-selected {\n                border-color: #ff6347;\n                box-shadow: 0 0 0 3px #ff6347;\n            }\n            /* 新增：尺寸标签样式 */\n            .gfriends-size-tag {\n                position: absolute;\n                bottom: 0; /* 定位到图片容器底部 */\n                left: 0;\n                right: 0;\n                height: 25px;\n                line-height: 25px;\n                text-align: center;\n                background-color: rgba(0, 0, 0, 0.7); /* 半透明背景 */\n                color: #fff;\n                font-size: 11px;\n                font-weight: bold;\n                border-bottom-left-radius: 6px;\n                border-bottom-right-radius: 6px;\n                user-select: none;\n            }\n        </style>\n        \n        <div id="gfriends-image-list-container">\n            <p id="gfriends-prompt" style="text-align: center; font-size: 15px; margin-bottom: 15px;">\n                点击图片即可选择（初始共 ${imageLinks.length} 张）\n            </p>\n            <div style="overflow-y: auto; height: calc(100% - 40px);">\n                <div id="gfriends-image-list">\n                    ${imageItems}\n                </div>\n            </div>\n        </div>\n    `;
        let errorCount = 0;
        layer.open({
            type: 1,
            title: `选择女优头像 (${imageLinks.length} 张)`,
            area: utils.getResponsiveArea([ "900px", "85%" ]),
            content: imageListHtml,
            btn: [ "关闭" ],
            success: (selectionLayero, selectionIndex) => {
                const $container = $(selectionLayero), $images = $container.find(".gfriends-selectable-img"), $prompt = $container.find("#gfriends-prompt");
                $images.each((function() {
                    const $img = $(this), wrapperId = $img.data("wrapper-id"), $wrapper = $container.find(`#${wrapperId}`), $sizeTag = $container.find(`.gfriends-size-tag[data-size-for="${wrapperId}"]`);
                    $img.on("load", (function() {
                        const width = this.naturalWidth, height = this.naturalHeight;
                        $sizeTag.text(`${width} x ${height}`);
                    }));
                    $img.on("error", (function() {
                        $wrapper.remove();
                        errorCount++;
                        const validCount = imageLinks.length - errorCount;
                        $prompt.text(`点击图片即可选择（已移除 ${errorCount} 张错误图片，剩余 ${validCount} 张）`);
                        if (0 === validCount) {
                            show.error("所有搜索到的头像链接均已失效，无法选择。");
                            layer.close(selectionIndex);
                        }
                    }));
                    this.complete && (this.naturalWidth > 0 ? $img.trigger("load") : $img.trigger("error"));
                }));
                $images.on("click", (function() {
                    const $clickedImg = $(this), selectedUrl = $clickedImg.data("url");
                    $("#edit-actress-avatar").val(selectedUrl);
                    $("#edit-avatar-preview").attr("src", selectedUrl);
                    $images.removeClass("is-selected");
                    $clickedImg.addClass("is-selected");
                    setTimeout((() => {
                        layer.close(selectionIndex);
                    }), 150);
                }));
                utils.setupEscClose(selectionIndex);
            }
        });
    }
}

export { NewVideoPlugin };
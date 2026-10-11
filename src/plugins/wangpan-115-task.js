import { BasePlugin } from '../core/base-plugin.js';
import { __publicField, isJavBus } from '../core/constants.js';

const getDownPathList = async () => {
    const res = await gmHttp.get("https://webapi.115.com/offine/downpath");
    return "object" == typeof res ? res.data : null;
};

const searchFiles = async (search_value, offset = 0, limit = 30, params = {}) => {
    const queryParams = new URLSearchParams({search_value, offset, limit, ...params});
    const url = `https://webapi.115.com/files/search?${queryParams}`;
    return await gmHttp.get(url);
};

class WangPan115TaskPlugin extends BasePlugin {
    getName() {
        return "WangPan115TaskPlugin";
    }
    async handle() {
        $(".buttons button[data-clipboard-text*='magnet:']").each(((i, el) => {
            const $copyBtn = $(el);
            const magnet = $copyBtn.attr("data-clipboard-text");
            $copyBtn.css("margin-right", (parseInt($copyBtn.css("margin-right")) - 4) + "px");
            const $downloadBtn = $copyBtn.siblings("a.button, button").first();
            if ($downloadBtn.length) {
                $downloadBtn.css("margin-right", (parseInt($downloadBtn.css("margin-right")) + 3) + "px");
            }
            $("<button>").text("验车").addClass("button is-small").attr("style", "background-color:#2b6cb0 !important;color:#fff !important;border:none !important;cursor:pointer;border-radius:4px;font-size:12px;padding:2px 8px;").click((event => {
                event.stopPropagation();
                event.preventDefault();
                this.getBean("MagnetHubPlugin").checkWhatslink(magnet);
            })).appendTo($copyBtn.parent());
            $("<button>").text("115离线下载").addClass("button is-small").attr("style", "background-color:#4a90e2 !important;color:#fff !important;border:none !important;cursor:pointer;border-radius:4px;font-size:12px;padding:2px 8px;").click((async event => {
                event.stopPropagation();
                event.preventDefault();
                let loadObj = loading();
                try {
                    await this.handleAddTask(magnet);
                } catch (e) {
                    show.error("发生错误:" + e);
                    console.error(e);
                } finally {
                    loadObj.close();
                }
            })).appendTo($copyBtn.parent());
        }));
        isJavBus && window.isDetailPage && utils.loopDetector((() => $("#magnet-table td a").length > 0), (() => {
            this.bus115Down();
        }));
    }
    async bus115Down() {
        const $headerRow = $("#magnet-table tr").first();
        $("#magnet-table tr").each(((i, row) => {
            if (row === $headerRow[0]) return;
            const magnetLink = $(row).find("td:nth-child(1) a").attr("href");
            if (magnetLink && magnetLink.includes("magnet:")) {
                const actionCell = $("<td>").addClass("action-cell");
                $("<button>").text("验车").addClass("button is-small").attr("style", "background-color:#2b6cb0 !important;color:#fff !important;border:none !important;margin-right:4px;cursor:pointer;border-radius:4px;font-size:12px;padding:2px 8px;").click((event => {
                    event.stopPropagation();
                    event.preventDefault();
                    this.getBean("MagnetHubPlugin").checkWhatslink(magnetLink);
                })).appendTo(actionCell);
                $("<button>").text("115离线下载").addClass("button is-small").attr("style", "background-color:#4a90e2 !important;color:#fff !important;border:none !important;cursor:pointer;border-radius:4px;font-size:12px;padding:2px 8px;").click((async event => {
                    event.stopPropagation();
                    event.preventDefault();
                    let loadObj = loading();
                    try {
                        await this.handleAddTask(magnetLink);
                    } catch (e) {
                        show.error("发生错误:" + e);
                        console.error(e);
                    } finally {
                        loadObj.close();
                    }
                })).appendTo(actionCell);
                $(row).append(actionCell);
            }
        }));
        if ($headerRow.find("td, th").last().text().trim() !== "操作") {
            $headerRow.append($("<td>").text("操作"));
        }
    }

    static sanitizeDirName(str) {
        if (!str) return "";
        return str.replace(/[\\/:*?"<>|]/g, "").replace(/\s+/g, " ").trim();
    }

    static parseOfflineDirTemplate(str, params) {
        if (!str || !params) return str;
        return str.replace(/\$\{(\w+)\}/g, (match, key) => {
            if (!params.hasOwnProperty(key)) return match;
            const value = params[key] || "";
            return WangPan115TaskPlugin.sanitizeDirName(String(value));
        });
    }

    static async ensureDir(dirName, pid = 0) {
        const result = await gmHttp.postFileFormData("https://webapi.115.com/files/add", {
            pid: pid,
            cname: dirName
        });
        if (result && result.file_id) return result.file_id;
        const searchRes = await searchFiles(dirName, 0, 1, {fc: 1});
        if (searchRes && searchRes.data && searchRes.data.length > 0) {
            const match = searchRes.data.find(d => d.pid === pid || d.pid === String(pid));
            if (match) return match.fid || match.file_id;
        }
        return null;
    }

    static async registerDirAsDownPath(fileId, dirName) {
        await gmHttp.postFileFormData("https://webapi.115.com/offine/downpath", {
            file_id: fileId
        });
        const list = await getDownPathList();
        const created = list ? list.find(d => d.file_id === fileId || String(d.file_id) === String(fileId)) : null;
        return created ? created.id : null;
    }

    static async createMultiLevelDownPath(templatePath) {
        const segments = templatePath.split("/").filter(s => s.trim());
        if (segments.length === 0) return null;
        let pid = 0;
        let fileId = null;
        for (const seg of segments) {
            fileId = await WangPan115TaskPlugin.ensureDir(seg.trim(), pid);
            if (!fileId) {
                console.error("[115离线] 创建目录失败:", seg);
                return null;
            }
            pid = fileId;
        }
        const lastDirName = segments[segments.length - 1].trim();
        const downPathId = await WangPan115TaskPlugin.registerDirAsDownPath(fileId, lastDirName);
        console.log("[115离线] 多级目录创建完成:", templatePath, "→ downPathId=" + downPathId);
        return downPathId;
    }

    getPageInfoForOffline() {
        const baseInfo = this.getPageInfo();
        const carNum = baseInfo.carNum || "";
        let title = "", maker = "", actor = "";
        if (isJavBus) {
            title = $("h3").first().text().trim();
            maker = $('span.header:contains("製作商:")').parent("p").text().replace("製作商:", "").trim() ||
                $('span.header:contains("制作商:")').parent("p").text().replace("制作商:", "").trim();
            const actorEl = $('span.genre a[href*="/star/"]').first();
            actor = actorEl.length ? actorEl.text().trim() : "";
        } else {
            title = $(".current-title").first().text().trim() || $("h2.title.is-4 .current-title").first().text().trim() || $(".movie-title").first().text().trim();
            maker = $('strong:contains("片商:")').parent().find(".value").text().trim() ||
                $('strong:contains("片商：")').parent().find(".value").text().trim();
            actor = $('.actor-female').first().text().trim() || $('strong:contains("演員:"), strong:contains("演员:")').parent().find('.value a').first().text().trim() || "";
        }
        const now = new Date();
        if (carNum && title) {
            const upperTitle = title.toUpperCase();
            const upperCode = carNum.toUpperCase();
            if (upperTitle.startsWith(upperCode)) {
                title = title.substring(carNum.length).replace(/^[\s\-_]+/, "").trim();
            }
        }
        console.log("[115离线] 页面信息提取:", {code: carNum, title, maker, actor});
        return {
            code: carNum,
            title: title,
            maker: maker,
            actor: actor,
            date: utils.formatDate(now).split(" ")[0]
        };
    }
    async getSavePathId(nyName) {
        const enableCustom = await storageManager.getSetting("enable115OfflineFormat", NO);
        if (enableCustom === YES) {
            const template = await storageManager.getSetting("offlineFolderFormat", "");
            if (template && template.includes("${")) {
                const pageInfo = this.getPageInfoForOffline();
                return WangPan115TaskPlugin.parseOfflineDirTemplate(template, pageInfo);
            }
        }
        let savePath115 = await storageManager.getSetting("savePath115", "云下载");
        nyName && (savePath115 = savePath115.replaceAll("{ny}", nyName));
        savePath115 = savePath115.replaceAll("{date}", utils.formatDate(new Date));
        return savePath115;
    }
    async handleAddTask(magnetLink, savePath) {
        const singInfo = await (async () => {
            const res = await gmHttp.get("https://115.com/?ct=offline&ac=space&_=" + (new Date).getTime());
            return "object" == typeof res ? res : null;
        })();
        if (!singInfo) {
            show.error("未登录115网盘", {
                close: !0,
                duration: -1,
                callback: async () => {
                    window.open("https://115.com");
                }
            });
            return;
        }
        const sign = singInfo.sign, time = singInfo.time, userId = this.getUserId();

        let wp_path_id = savePath || "";
        if (!wp_path_id) {
            const fullPath = await this.getSavePathId();
            console.log("[115离线] 目录模板解析结果:", fullPath);
            if (fullPath) {
                if (fullPath.includes("/")) {
                    console.log("[115离线] 检测到多级目录，逐级创建:", fullPath);
                    const newId = await WangPan115TaskPlugin.createMultiLevelDownPath(fullPath);
                    if (newId) wp_path_id = newId;
                } else {
                    const downPathList = await getDownPathList();
                    if (downPathList && downPathList.length > 0) {
                        const matched = downPathList.find((d => d.name === fullPath));
                        if (matched) {
                            wp_path_id = matched.id;
                            console.log("[115离线] 目录匹配结果: 匹配到 \"" + matched.name + "\" -> id=" + matched.id);
                        } else {
                            console.log("[115离线] 目录匹配结果: 未匹配到 \"" + fullPath + "\"，自动创建并注册");
                            const newId = await WangPan115TaskPlugin.createMultiLevelDownPath(fullPath);
                            if (newId) wp_path_id = newId;
                        }
                    }
                }
            }
        }

        const result = await (async (magnet, wp_path_id = "", uid, sign, time) => {
            const data = {
                url: encodeURIComponent(magnet),
                wp_path_id: wp_path_id,
                uid: uid,
                sign: sign,
                time: time
            };
            return await gmHttp.postForm("https://115.com/web/lixian/?ct=lixian&ac=add_task_url", data);
        })(magnetLink, wp_path_id, userId, sign, time);
        console.log("离线下载返回值:", result);
        let infoHash = result.info_hash, fileId = await this.getFileId(userId, sign, time, infoHash), openUrl = "https://115.com/?tab=offline&mode=wangpan";
        fileId && (openUrl = `https://115.com/?cid=${fileId}&offset=0&mode=wangpan`);
        let title = "添加成功, 是否前往查看?";
        !1 === result.state && (title = result.error_msg + " 是否前往查看?");
        utils.q(null, title, (async () => {
            let fileId2 = await this.getFileId(userId, sign, time, infoHash);
            fileId2 && (openUrl = `https://115.com/?cid=${fileId2}&offset=0&mode=wangpan`);
            window.open(openUrl);
        }));
    }
    async getUserId() {
        let downPathList = await getDownPathList();
        if (downPathList && downPathList.length > 0) return downPathList[0].id;
        {
            show.info("没有默认离线目录, 正在创建中...");
            const dirId = (await (async (dirName, pid = 0) => {
                const data = {
                    pid: pid,
                    cname: dirName
                };
                return await gmHttp.postFileFormData("https://webapi.115.com/files/add", data);
            })("云下载")).file_id;
            await (async dirId => {
                const data = {
                    file_id: dirId
                };
                return await gmHttp.postFileFormData("https://webapi.115.com/offine/downpath", data);
            })(dirId);
            show.info("创建完成, 开始执行离线下载");
            downPathList = await getDownPathList();
            if (downPathList && downPathList.length > 0) return downPathList[0].id;
            throw new Error("获取115用户Id失败");
        }
    }
    async getFileId(userId, sign, time, infoHash) {
        const taskList = await (async (uid, sign, time) => {
            const data = {
                page: 1,
                uid: uid,
                sign: sign,
                time: time
            };
            return (await gmHttp.postForm("https://115.com/web/lixian/?ct=lixian&ac=task_lists", data)).tasks;
        })(userId, sign, time);
        console.log("云离线列表:", taskList);
        let fileId = null;
        for (let i = 0; i < taskList.length; i++) {
            let task = taskList[i];
            if (task.info_hash === infoHash) {
                fileId = task.file_id;
                break;
            }
        }
        return fileId;
    }

    //TODO: 暂时没有删除离线任务
    // async deleteOfflineTasksByKeyword(keyword) {
    //     try {
    //         const singInfo = await (async () => {
    //             const res = await gmHttp.get("https://115.com/?ct=offline&ac=space&_=" + (new Date).getTime());
    //             return "object" == typeof res ? res : null;
    //         })();
    //         if (!singInfo) {
    //             console.error("删除离线任务: 未登录115网盘");
    //             return;
    //         }
    //         const {sign: sign, time: time} = singInfo, uid = singInfo.uid || (() => {
    //             const match = document.cookie.match(/UID=(\d+)_/);
    //             return match ? match[1] : null;
    //         })() || await this.getUserId();
    //         const taskListRes = await gmHttp.postForm("https://115.com/web/lixian/?ct=lixian&ac=task_lists", {
    //             page: 1,
    //             uid: uid,
    //             sign: sign,
    //             time: time
    //         });
    //         const tasks = (null == taskListRes ? void 0 : taskListRes.tasks) || [];
    //         const keyword2 = keyword.toLowerCase().replace("fc2-", "");
    //         let deletedCount = 0;
    //         for (const task of tasks) {
    //             if (task.name && task.name.toLowerCase().includes(keyword2)) {
    //                 console.log(`删除离线任务: ${task.name} (hash: ${task.info_hash})`);
    //                 await gmHttp.postForm("https://115.com/web/lixian/?ct=lixian&ac=task_del", {
    //                     "hash[0]": task.info_hash,
    //                     flag: 1,
    //                     uid: uid,
    //                     sign: sign,
    //                     time: time
    //                 });
    //                 deletedCount++;
    //             }
    //         }
    //         deletedCount > 0 && console.log(`共删除 ${deletedCount} 个离线任务`);
    //     } catch (error) {
    //         console.error("删除离线任务失败:", error);
    //     }
    // }
}


export { WangPan115TaskPlugin, searchFiles, getDownPathList };
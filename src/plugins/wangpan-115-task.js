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
            $(el).parent().append($("<button>").text("115离线下载").addClass("button is-info is-small").click((async event => {
                event.stopPropagation();
                event.preventDefault();
                let loadObj = loading();
                try {
                    await this.handleAddTask($(el).attr("data-clipboard-text"));
                } catch (e) {
                    show.error("发生错误:" + e);
                    console.error(e);
                } finally {
                    loadObj.close();
                }
            })));
        }));
        isJavBus && window.isDetailPage && utils.loopDetector((() => $("#magnet-table td a").length > 0), (() => {
            this.bus115Down();
        }));
    }
    async bus115Down() {
        $("#magnet-table tr").each(((i, row) => {
            const magnetLink = $(row).find("td:nth-child(1) a").attr("href");
            if (magnetLink && magnetLink.includes("magnet:")) {
                const actionCell = $("<td>").addClass("action-cell");
                $("<button>").text("115离线下载").addClass("button is-info is-small").click((async event => {
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
        $("#magnet-table tbody").length > 0 && $("#magnet-table tbody tr").append($("<td>").text("操作"));
    }
    async getSavePathId(nyName) {
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
        const sign = singInfo.sign, time = singInfo.time, userId = this.getUserId(), result = await (async (magnet, wp_path_id = "", uid, sign, time) => {
            const data = {
                url: encodeURIComponent(magnet),
                wp_path_id: wp_path_id,
                uid: uid,
                sign: sign,
                time: time
            };
            return await gmHttp.postForm("https://115.com/web/lixian/?ct=lixian&ac=add_task_url", data);
        })(magnetLink, savePath || "", userId, sign, time);
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
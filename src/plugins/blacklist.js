import { BasePlugin } from '../core/base-plugin.js';
import { __publicField, isJavBus, isJavDb, currentHref, Status_FILTER } from '../core/constants.js';

class BlacklistPlugin extends BasePlugin {
    getName() {
        return "BlacklistPlugin";
    }
    async addBlacklist(event) {
        let tempEvent = {
            clientX: event.clientX,
            clientY: event.clientY + 80
        };
        const hasAddBlacklist = $("#addBlacklistBtn span").text().includes("已加入");
        let dataInfo, title;
        if (currentHref.includes("/tags")) {
            const urlObj = new URL(currentHref);
            urlObj.searchParams.delete("page");
            const checkTag = $("#jhs-check-tag").text().trim();
            dataInfo = {
                starId: "no-" + checkTag,
                name: "虚拟演员-" + checkTag,
                allName: [ "虚拟演员" ],
                role: "虚拟演员",
                movieType: "虚拟演员",
                blacklistUrl: urlObj.toString()
            };
            title = `是否将分类 <span style="color: #f40">${checkTag}</span> 加入到黑名单中?`;
            hasAddBlacklist && (title = `分类 <span style="color: #f40">${checkTag}</span> 已在黑名单中, 是否从当前页开始追加屏蔽?`);
        } else {
            dataInfo = this.getActressPageInfo();
            title = `是否将该演员 <span style="color: #f40">${dataInfo.name}</span> 加入到黑名单中?`;
            hasAddBlacklist && (title = `演员 <span style="color: #f40">${dataInfo.name}</span> 已在黑名单中, 是否从当前页开始追加屏蔽?`);
        }
        const {starId: starId, name: name2, allName: allName, role: role, movieType: movieType, blacklistUrl: blacklistUrl} = dataInfo;
        currentHref.includes("page") && !currentHref.includes("page=1") && (title += "<br/> 注意: 当前页面非第一页, 屏蔽数据将从此页面开始");
        if (isJavBus) {
            const afterStarParts = currentHref.split("/star/")[1].split("/");
            if (afterStarParts.length > 1) {
                parseInt(afterStarParts[1]) > 1 && (title += "<br/> 注意: 当前页面非第一页, 屏蔽数据将从此页面开始");
            }
        }
        utils.q(tempEvent, title, (async () => {
            const taskPlugin = this.getBean("TaskPlugin");
            navigator.locks.request(taskPlugin.singleTaskKey, {
                ifAvailable: !0
            }, (async lock => {
                if (lock) {
                    this.loadObj = loading();
                    try {
                        await storageManager.addBlacklistItem({
                            starId: starId,
                            name: name2,
                            allName: allName,
                            role: role,
                            movieType: movieType,
                            url: blacklistUrl
                        });
                        await this.filterActorVideo(name2, starId);
                        const toast = show.ok(`屏蔽结束,是否跳转到最后一页: ${this.lastPageLink || "无"}`, {
                            duration: -1,
                            close: !0,
                            onClick: () => {
                                toast.closeShow();
                                this.lastPageLink && (window.location.href = this.lastPageLink);
                            }
                        });
                    } catch (e) {
                        clog.error(e);
                        const toast = show.error("发生错误, 是否填转到解析失败的那一页? (点击并跳转)", {
                            duration: -1,
                            close: !0,
                            onClick: () => {
                                toast.closeShow();
                                window.location.href = this.nextPageLink;
                            }
                        });
                    } finally {
                        this.loadObj.close();
                    }
                } else show.error("当前有定时任务在后台执行中, 无法发起此操作");
            })).catch((error => {
                console.error("锁任务出现错误:", error);
                clog.error("锁任务出现错误:", error);
            }));
        }));
    }
    async resetBtnTip() {
        const taskPlugin = this.getBean("TaskPlugin"), lastCheckBlacklistTimeStr = localStorage.getItem(taskPlugin.lastCheckBlacklistTimeKey) || "无", checkBlacklist_intervalTime = await storageManager.getSetting("checkBlacklist_intervalTime", 12);
        this.checkBlacklist_ruleTime = await storageManager.getSetting("checkBlacklist_ruleTime", 8760);
        $("#checkBlacklistBtn").attr("data-tip", `上次检测时间: ${lastCheckBlacklistTimeStr}; 检测间隔时间: ${checkBlacklist_intervalTime}小时`);
    }
    async openBlacklistDialog() {
        const taskPlugin = this.getBean("TaskPlugin"), settingObj = await storageManager.getSetting();
        let html = `\n            <div style="padding: 10px 20px; height: 100%;overflow:hidden;"> \n                 <div style="display: flex;justify-content: space-between;">\n                    <div style="display: flex; gap:5px">\n                        <a id="checkBlacklistBtn" class="a-danger" data-tip="上次检测时间: ${localStorage.getItem(taskPlugin.lastCheckBlacklistTimeKey) || "无"}; 检测间隔时间: ${settingObj.checkBlacklist_intervalTime}小时">${this.blacklistSvg} &nbsp;手动检测黑名单</a>\n                        <a class="a-warning" id="clearKeywordBlacklist" data-tip="检测黑名单番号数据列表, 是否包含标题关键词">${this.removeSvg} &nbsp;&nbsp; 清理数据</a>\n                        <a class="a-info" id="toSetting">${this.settingSvg} &nbsp;&nbsp; 配置</a>\n                    </div>\n                    <div style="display: flex; gap:5px">\n                        <select id="dataType" style="text-align: center;min-width: 150px;">\n                            <option value="" selected>所有</option>\n                            <option value="actor">男演员</option>\n                            <option value="actress">女演员</option>\n                            <option value="虚拟演员">虚拟演员</option>\n                        </select>\n                        <select id="statusType" style="text-align: center;min-width: 150px;">\n                            <option value="" selected>--检测状态--</option>\n                            <option value="normal">正常检测</option>\n                            <option value="stop">停止检测</option>\n                        </select>\n                        <select id="urlType" data-tip="在演员页屏蔽时,是否选择了分类" style="text-align: center;min-width: 150px; ${isJavDb ? "" : "display: none;"}">\n                            <option value="" selected>--屏蔽类型--</option>\n                            <option value="hasT">按所选分类屏蔽</option>\n                            <option value="noT">所有分类</option>\n                        </select>\n                        <input id="searchValue" type="text" placeholder="搜索演员" style="padding: 4px 5px;">\n                        <a id="cleanQueryBtn" class="a-info" style="margin-left: 0">重置</a>\n                    </div>\n\n                 </div>\n                 <div id="table-container" style="margin-top:20px !important; height: calc(100% - 50px);"></div>\n            </div>\n        `;
        layer.open({
            type: 1,
            title: "演员黑名单",
            content: html,
            scrollbar: !1,
            area: utils.getResponsiveArea([ "80%", "90%" ]),
            anim: -1,
            success: async layero => {
                await this.loadTableData();
                $(".layui-layer-content").on("click", "#cleanQueryBtn", (async event => {
                    $("#searchValue").val("");
                    $("#dataType").val("");
                    $("#statusType").val("");
                    await this.reloadTable();
                })).on("focusout keydown", "#searchValue", (async event => {
                    if ("focusout" === event.type || "Enter" === event.key) {
                        "Enter" === event.key && event.preventDefault();
                        if ("keydown" === event.type && "Enter" !== event.key) return;
                        $("#dataType").val("");
                        await this.reloadTable();
                    }
                })).on("change", "#dataType", (async () => {
                    $("#searchValue").val("");
                    await this.reloadTable();
                })).on("change", "#statusType", (async () => {
                    await this.reloadTable();
                })).on("change", "#urlType", (async () => {
                    await this.reloadTable();
                })).on("click", "#toSetting", (() => {
                    this.getBean("SettingPlugin").openSettingDialog("task-panel", (() => {
                        $("#setting-blacklist").css({
                            border: "1px solid #f40"
                        });
                    }));
                })).on("click", "#clearKeywordBlacklist", (async () => {
                    await this.clearKeywordBlacklist();
                })).on("click", ".open-url", (event => {
                    event.preventDefault();
                    const $el = $(event.currentTarget), url = $el.attr("data-url"), name2 = $el.attr("data-name");
                    utils.openPage(url, name2, !0, event);
                })).on("click", "#checkBlacklistBtn", (event => {
                    utils.q({
                        clientX: event.clientX,
                        clientY: event.clientY + 20
                    }, "是否手动检测黑名单?", (() => {
                        navigator.locks.request(taskPlugin.singleTaskKey, {
                            ifAvailable: !0
                        }, (async lock => {
                            if (lock) {
                                await taskPlugin.loadConfig();
                                await taskPlugin.checkBlacklist(!0);
                            } else show.error("当前有定时任务在后台执行中, 无法发起手动任务");
                        })).catch((error => {
                            console.error("锁任务出现错误:", error);
                            clog.error("锁任务出现错误:", error);
                        }));
                    }));
                }));
            },
            end: () => {
                if (this.tableObj) {
                    this.tableObj.destroy();
                    this.tableObj = null;
                }
                window.refresh();
            }
        });
    }
    async reloadTable() {
        if (!this.tableObj) return;
        const tableData = await this.getTableData();
        this.tableObj.setData(tableData);
    }
    async getTableData() {
        const taskPlugin = this.getBean("TaskPlugin"), blacklist = await storageManager.getBlacklist(), blacklistCarList = await storageManager.getBlacklistCarList(), searchValue = $("#searchValue").val(), statusType = $("#statusType").val(), $dataType = $("#dataType"), dataType = $dataType.val(), urlType = $("#urlType").val(), blacklistCount = blacklist.length;
        let actorCount = 0, actressCount = 0, noStarCount = 0;
        const filteredBlacklist = blacklist.map((item => {
            "actor" === item.role ? actorCount++ : "actress" === item.role ? actressCount++ : "虚拟演员" === item.role && noStarCount++;
            let isUnCheck = !1;
            item.lastPublishTime && (isUnCheck = !taskPlugin.isUnnecessaryCheck(item.lastPublishTime, this.checkBlacklist_ruleTime));
            return {
                ...item,
                isUnCheck: isUnCheck
            };
        })).filter((item => !(searchValue && !item.name.includes(searchValue)) && (("normal" !== statusType || !item.isUnCheck) && (!("stop" === statusType && !item.isUnCheck) && (dataType ? item.role === dataType : !("hasT" === urlType && !item.url.includes("t=") && !item.url.includes("/tags")) && ("noT" !== urlType || !item.url.includes("t=") && !item.url.includes("/tags")))))));
        $dataType.html(`\n            <option value="">所有 (${blacklistCount})</option>\n            <option value="actor">男演员 (${actorCount})</option>\n            <option value="actress">女演员 (${actressCount})</option>\n            <option value="虚拟演员">虚拟演员 (${noStarCount})</option>\n        `);
        $dataType.val(dataType);
        const carListMap = new Map;
        for (const car of blacklistCarList) {
            const starId = car.starId;
            carListMap.has(starId) || carListMap.set(starId, []);
            carListMap.get(starId).push(car);
        }
        const finalResult = filteredBlacklist.map((item => {
            const starId = item.starId, carList = carListMap.get(starId) || [];
            return {
                ...item,
                carList: carList,
                count: carList.length
            };
        }));
        this.currentCarCount = finalResult.reduce(((accumulator, currentObject) => accumulator + (currentObject.count || 0)), 0);
        return finalResult;
    }
    async loadTableData() {
        this.checkBlacklist_ruleTime = await storageManager.getSetting("checkBlacklist_ruleTime") || 8760;
        const tableData = await this.getTableData();
        this.tableObj = new Tabulator("#table-container", {
            layout: "fitColumns",
            placeholder: "暂无数据",
            virtualDom: !0,
            data: tableData,
            pagination: !0,
            paginationMode: "local",
            paginationSize: 20,
            paginationSizeSelector: [ 20, 50, 100, 1e3, 99999 ],
            paginationCounter: (pageSize, currentRow, currentPage, totalRows, totalPages) => `演员: ${totalRows} &nbsp;&nbsp;&nbsp;番号总数: ${this.currentCarCount}  <span id="checkBlacklistMsg" style="margin-left: 10px"></span>`,
            responsiveLayout: "collapse",
            responsiveLayoutCollapse: !0,
            columnDefaults: {
                headerHozAlign: "center",
                hozAlign: "center"
            },
            index: "starId",
            columns: [ {
                title: "演员",
                field: "name",
                sorter: "string",
                minWidth: 100,
                responsive: 0,
                headerSort: !1,
                formatter: (cell, formatterParams, onRendered) => {
                    const item = cell.getData();
                    return `<a class="open-url" data-url="${item.url}" href="${item.url}" data-name="${item.name}" target="_blank">${item.name}</a>`;
                }
            }, {
                title: "性别角色",
                field: "role",
                sorter: "string",
                width: 120,
                responsive: 5,
                formatter: (cell, formatterParams, onRendered) => {
                    const role = cell.getData().role;
                    let content = role;
                    "actor" === role ? content = "男演员" : "actress" === role && (content = "女演员");
                    return content;
                }
            }, {
                title: "影视类别",
                field: "movieType",
                sorter: "string",
                width: 120,
                responsive: 5,
                formatter: (cell, formatterParams, onRendered) => {
                    const movieType = cell.getData().movieType;
                    let content = movieType;
                    "censored" === movieType ? content = "有码" : "uncensored" === movieType && (content = "无码");
                    return content;
                }
            }, {
                title: "屏蔽类型",
                field: "url",
                sorter: "string",
                minWidth: 120,
                responsive: 4,
                visible: isJavDb,
                formatter: (cell, formatterParams, onRendered) => {
                    const item = cell.getData();
                    if ("虚拟演员" === item.role) {
                        const nameSplitList = item.name.split("-");
                        return `<span style="color:#cc4444">${nameSplitList.length > 0 ? nameSplitList[1] : item.name}</span>`;
                    }
                    const tParam = utils.getUrlParam(item.url, "t");
                    if (!tParam) return "<span>所有分类</span>";
                    {
                        const tParamList = tParam.toString().split(",");
                        let selectTypeStr = "";
                        tParamList.forEach((i => {
                            let value = categoryMap[i];
                            selectTypeStr += value ? value + " " : "未知类别:" + i + " ";
                        }));
                        selectTypeStr = selectTypeStr.trim();
                        if (selectTypeStr) return `<span style="color:#cc4444">${selectTypeStr}</span>`;
                    }
                }
            }, {
                title: "番号数量",
                field: "count",
                sorter: "number",
                width: 170,
                responsive: 1
            }, {
                title: "创建时间",
                field: "createTime",
                sorter: "string",
                width: 170,
                responsive: 5
            }, {
                title: "最后发行时间",
                field: "lastPublishTime",
                sorter: "string",
                width: 170,
                responsive: 1
            }, {
                title: "状态",
                field: "isUnCheck",
                sorter: "string",
                width: 120,
                responsive: 1,
                formatter: (cell, formatterParams, onRendered) => {
                    let dataTip = "", content = "正常检测";
                    if (cell.getData().isUnCheck) {
                        dataTip = `停更${this.checkBlacklist_ruleTime / 24 / 365}年以上, 下轮任务不再进行检测`;
                        content = "停止检测";
                    }
                    return `<span data-tip="${dataTip}" style="${dataTip ? "color: #cc4444;" : ""}">${content}</span>`;
                }
            }, {
                title: "操作",
                sorter: "string",
                cssClass: "action-cell-dropdown",
                minWidth: 150,
                responsive: 0,
                headerSort: !1,
                formatter: (cell, formatterParams, onRendered) => {
                    const item = cell.getData();
                    onRendered((() => {
                        var _a2, _b;
                        null == (_a2 = cell.getElement().querySelector(".delete-btn")) || _a2.addEventListener("click", (e => {
                            const name2 = item.name, starId = item.starId;
                            name2 ? starId ? utils.q(e, `是否移除对 ${name2} 的屏蔽?`, (async () => {
                                await storageManager.removeBlacklistCarList(starId);
                                await storageManager.deleteBlacklistItem(starId);
                                show.info("操作成功");
                                this.reloadTable().then();
                            })) : show.error("获取starId失败") : show.error("获取名称失败");
                        }));
                        null == (_b = cell.getElement().querySelector(".keyword-btn")) || _b.addEventListener("click", (e => {
                            const prefixMap = item.carList.reduce(((dataMap, carItem) => {
                                const prefix = carItem.carNum.split("-")[0] + "-";
                                dataMap[prefix] = (dataMap[prefix] || 0) + 1;
                                return dataMap;
                            }), {}), sortedPrefixList = Object.entries(prefixMap).map((([prefix, count]) => ({
                                prefix: prefix,
                                count: count
                            }))).sort(((a, b) => b.count - a.count));
                            console.log(sortedPrefixList);
                        }));
                    }));
                    return '\n                           \x3c!-- <a class="a-normal keyword-btn"> <span>提取屏蔽词</span> </a>--\x3e\n                            <a class="a-danger delete-btn"> <span>✂️ 删除</span> </a>\n                        ';
                }
            } ],
            initialSort: [ {
                column: "createTime",
                dir: "desc"
            } ],
            locale: "zh-cn",
            langs: {
                "zh-cn": {
                    pagination: {
                        first: "首页",
                        first_title: "首页",
                        last: "尾页",
                        last_title: "尾页",
                        prev: "上一页",
                        prev_title: "上一页",
                        next: "下一页",
                        next_title: "下一页",
                        all: "所有",
                        page_size: "每页行数"
                    }
                }
            }
        });
    }
    getCurrentStarUrl() {
        let urlWithoutSortType = window.location.href.replace(/([&?])sort_type=[^&]+(&|$)/, "$1");
        urlWithoutSortType = urlWithoutSortType.replace(/[&?]$/, "");
        urlWithoutSortType = urlWithoutSortType.replace(/\?&/, "?");
        let urlWithoutPageNumber = urlWithoutSortType;
        urlWithoutPageNumber = urlWithoutPageNumber.replace(/([&?])page=\d+(&|$)/, "$1");
        urlWithoutPageNumber = urlWithoutPageNumber.replace(/[&?]$/, "");
        urlWithoutPageNumber = urlWithoutPageNumber.replace(/\?&/, "?");
        urlWithoutPageNumber = urlWithoutPageNumber.replace(/\/(\d+)(?:\/(\d+))?(\?|$)/, ((match, id, page, suffix) => void 0 !== page ? `/${id}${suffix}` : match));
        return urlWithoutPageNumber;
    }
    parseUrlId(url) {
        if (!url) throw new Error("url未传入");
        return new URL(url).pathname.split("/").filter((segment => "" !== segment.trim())).pop();
    }
    async filterAllVideo(actorName, $dom) {
        let movieList, nextPageLink;
        if ($dom) {
            isJavBus && $dom.find(".avatar-box").length > 0 && $dom.find(".avatar-box").parent().remove();
            movieList = $dom.find(this.getSelector().requestDomItemSelector);
            nextPageLink = $dom.find(this.getSelector().nextPageSelector).attr("href");
        } else {
            movieList = $(this.getSelector().itemSelector);
            nextPageLink = $(this.getSelector().nextPageSelector).attr("href");
        }
        if (nextPageLink && 0 === movieList.length) {
            show.error("解析列表失败");
            throw new Error("解析列表失败");
        }
        for (const element of movieList) {
            const $item = $(element), {carNum: carNum2, url: url, publishTime: publishTime} = this.getBoxCarInfo($item);
            if (url && carNum2) try {
                if (await storageManager.getCar(carNum2)) continue;
                await storageManager.saveCar({
                    carNum: carNum2,
                    url: url,
                    names: actorName,
                    actionType: Status_FILTER,
                    publishTime: publishTime
                });
                clog.log("屏蔽演员番号", actorName, carNum2);
            } catch (error) {
                console.error(`保存失败 [${carNum2}]:`, error);
            }
        }
        if (nextPageLink) {
            show.info("请不要关闭窗口, 正在解析下一页:" + nextPageLink);
            await new Promise((resolve => setTimeout(resolve, 500)));
            const html = await gmHttp.get(nextPageLink), parser = new DOMParser, next$dom = $(parser.parseFromString(html, "text/html"));
            await this.filterAllVideo(actorName, next$dom);
        } else {
            show.ok("执行结束!");
            window.refresh();
        }
    }
    async filterActorVideo(actorName, starId, $dom) {
        let {nextPageLink: nextPageLink} = await this.parseAndSaveFilterInfo($dom, actorName, starId);
        this.nextPageLink = nextPageLink;
        if (nextPageLink) {
            this.lastPageLink = nextPageLink;
            show.info("请不要关闭窗口, 正在解析下一页:" + nextPageLink);
            let next$dom;
            const pageNum = utils.getUrlParam(nextPageLink, "page") || 0, beyond60Plugin = this.getBean("Beyond60Plugin");
            if (isJavDb && beyond60Plugin && pageNum > 60) {
                let {html: html, nextUrl: nextUrl, hasMore: hasMore} = await beyond60Plugin.handleBeyond60(nextPageLink), mergeHtml = `\n                    <div class ='movie-list'>${html}</div>\n                    ${nextUrl ? `<a class="pagination-next" href="${nextUrl}"></a>` : ""}\n                `;
                next$dom = utils.htmlTo$dom(mergeHtml);
            } else {
                clog.log("正在请求下一页内容:", nextPageLink);
                const html = await gmHttp.get(nextPageLink);
                next$dom = utils.htmlTo$dom(html);
            }
            await this.filterActorVideo(actorName, starId, next$dom);
        } else {
            show.ok("执行结束!");
            window.refresh();
        }
    }
    async parseAndSaveFilterInfo($dom, actorName, starId) {
        let movieList, nextPageLink;
        if ($dom) {
            let tempIsJavBus = !1, selectorType = "javdb";
            if ($dom.text().includes("javbus")) {
                tempIsJavBus = !0;
                selectorType = "javbus";
            }
            tempIsJavBus && $dom.find(".avatar-box").length > 0 && $dom.find(".avatar-box").parent().remove();
            movieList = $dom.find(this.getSelector(selectorType).requestDomItemSelector);
            nextPageLink = $dom.find(this.getSelector(selectorType).nextPageSelector).attr("href");
        } else {
            movieList = $(this.getSelector().itemSelector);
            nextPageLink = $(this.getSelector().nextPageSelector).attr("href");
        }
        if (nextPageLink && 0 === movieList.length) return {
            nextPageLink: null,
            lastPublishTime: null
        };
        const filterKeywordList = await storageManager.getTitleFilterKeyword();
        let carDataList = [], lastPublishTime = null;
        for (const element of movieList) {
            const $item = $(element), {carNum: carNum2, url: url, publishTime: publishTime, title: title} = this.getBoxCarInfo($item);
            lastPublishTime || (lastPublishTime = publishTime);
            filterKeywordList.find((kw => title.includes(kw) || carNum2.startsWith(kw))) || url && carNum2 && carDataList.push({
                carNum: carNum2,
                url: url,
                names: actorName,
                actionType: Status_FILTER,
                starId: starId,
                publishTime: publishTime
            });
        }
        await storageManager.batchSaveBlacklistCarList(carDataList);
        return {
            nextPageLink: nextPageLink,
            lastPublishTime: lastPublishTime
        };
    }
    async clearKeywordBlacklist() {
        let filterKeywordList = await storageManager.getTitleFilterKeyword();
        const processedKeywordsSet = new Set;
        filterKeywordList.forEach((item => {
            /^[a-z]{2,}-/i.test(item) && processedKeywordsSet.add(item);
        }));
        if (0 === processedKeywordsSet.size) {
            show.info("没有需要清理的关键词数据");
            return;
        }
        const carList = await storageManager.getCarList(), blacklistCarList = await storageManager.getBlacklistCarList(), carNumSet = new Set(carList.map((car => car.carNum))), keywords = Array.from(processedKeywordsSet), waitRemoveCarNumList = [], removableCarData = [];
        for (const car of blacklistCarList) {
            const carNum2 = car.carNum;
            let matched = !1;
            for (const keyword of keywords) if (carNum2.startsWith(keyword)) {
                removableCarData.push({
                    carNum: carNum2,
                    names: car.names,
                    matchedKeyword: keyword
                });
                waitRemoveCarNumList.push(carNum2);
                matched = !0;
                break;
            }
            if (!matched && carNumSet.has(carNum2)) {
                removableCarData.push({
                    carNum: carNum2,
                    names: car.names,
                    matchedKeyword: "已在鉴定记录中"
                });
                waitRemoveCarNumList.push(carNum2);
            }
        }
        const carNumCount = waitRemoveCarNumList.length;
        0 !== carNumCount ? layer.open({
            type: 1,
            title: `确认清理黑名单数据 (共 ${carNumCount} 个番号)`,
            area: [ "80%", "70%" ],
            anim: -1,
            content: `\n                <div style="height: 100%;overflow:hidden;">\n                    <div style="padding: 10px; overflow-y: auto;">\n                        <p>以下匹配到 <strong style="color: red;">${carNumCount}</strong> 个黑名单番号存在于屏蔽关键词中, 是否移除?</p>\n                    </div>\n                    <div id="wait-remove-table"  style="height: calc(100% - 70px);"></div>\n                </div>\n            `,
            btn: [ "确定清理", "取消" ],
            success: function(layero, index) {
                new Tabulator("#wait-remove-table", {
                    data: removableCarData,
                    virtualDom: !0,
                    layout: "fitColumns",
                    pagination: !0,
                    paginationMode: "local",
                    paginationSize: 50,
                    paginationSizeSelector: [ 50, 100, 1e3, 99999 ],
                    columns: [ {
                        title: "演员",
                        field: "names"
                    }, {
                        title: "番号",
                        field: "carNum"
                    }, {
                        title: "匹配关键词",
                        field: "matchedKeyword"
                    } ],
                    locale: "zh-cn",
                    initialSort: [ {
                        column: "names",
                        dir: "asc"
                    } ],
                    langs: {
                        "zh-cn": {
                            pagination: {
                                first: "首页",
                                first_title: "首页",
                                last: "尾页",
                                last_title: "尾页",
                                prev: "上一页",
                                prev_title: "上一页",
                                next: "下一页",
                                next_title: "下一页",
                                all: "所有",
                                page_size: "每页行数"
                            }
                        }
                    }
                });
            },
            yes: async index => {
                const removedCount = await storageManager.batchRemoveBlacklistCars(waitRemoveCarNumList);
                if (0 === removedCount) show.error("移除失败"); else {
                    show.ok(`🎉 清理完成！已移除${removedCount}个相关黑名单番号数据`);
                    await this.reloadTable();
                    layer.close(index);
                }
            },
            btn2: function(index) {
                layer.close(index);
            }
        }) : show.info("没有需要清理的黑名单番号数据");
    }
}


export { BlacklistPlugin };

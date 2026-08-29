import { BasePlugin } from '../core/base-plugin.js';
import { __publicField, isJavBus, isJavDb, Status_FILTER, Status_FAVORITE, Status_HAS_DOWN, Status_HAS_WATCH } from '../core/constants.js';

class HistoryPlugin extends BasePlugin {
    constructor() {
        super(...arguments);
        __publicField(this, "tableObj", null);
    }
    getName() {
        return "HistoryPlugin";
    }
    async initCss() {
        return "\n            <style>\n                /* 下拉菜单容器（相对定位） */\n                .sub-btns {\n                    position: relative;\n                    display: inline-block;\n                }\n                \n                /* 下拉菜单内容（默认隐藏） */\n                .sub-btns-menu {\n                    display: none;\n                    position: absolute;\n                    right: 80px;\n                    top:-10px;\n                    background: white;\n                    padding:10px;\n                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);\n                    z-index: 100;\n                    border-radius: 4px;\n                    overflow: hidden;\n                }\n                \n                \n                /* 点击后显示菜单（JS 控制） */\n                .sub-btns-menu.show {\n                    display: flex !important;\n                    flex-direction: column;\n                }\n                \n                .table-link-param {\n                    cursor: pointer;\n                }\n            </style\n        ";
    }
    handleResize() {
        if ($(".navbar-search").is(":hidden")) {
            $(".historyBtnBox").show();
            $(".miniHistoryBtnBox").hide();
        } else {
            $(".historyBtnBox").hide();
            $(".miniHistoryBtnBox").show();
        }
    }
    handle() {
        if (isJavDb) {
            $(".navbar-end").prepend('<div class="navbar-item has-sub-btns is-hoverable historyBtnBox">\n                    <a id="historyBtn" class="navbar-link nav-btn" style="color: #aade66 !important;padding-right:15px !important;">\n                        鉴定记录\n                    </a>\n                </div>');
            $(".navbar-search").css("margin-left", "0").before('\n                <div class="navbar-item miniHistoryBtnBox">\n                    <a id="miniHistoryBtn" class="navbar-link nav-btn" style="color: #aade66 !important;padding-left:0 !important;padding-right:0 !important;">\n                        鉴定记录\n                    </a>\n                </div>\n            ');
            this.handleResize();
            $(window).resize((() => {
                this.handleResize();
            }));
            $("#historyBtn,#miniHistoryBtn").on("click", (event => this.openHistory()));
        }
        isJavBus && utils.loopDetector((() => $("#setting-btn").length), (() => {
            $("#top-right-box").append('\n                    <a id="historyBtn" class="menu-btn main-tab-btn" style="background-color:#b68625 !important;">\n                        鉴定记录\n                    </a>\n               ');
            $("#historyBtn,#miniHistoryBtn").on("click", (event => this.openHistory()));
        }), 1, 1e4, !1);
        this.bindClick();
    }
    openHistory() {
        layer.open({
            type: 1,
            title: "鉴定记录",
            content: '\n            <div style="padding: 10px 20px; height: 100%;overflow:hidden;"> \n                 <div id="filterBox" style="display: flex;gap: 5px;">\n                    <select id="dataType" style="text-align: center;min-width: 150px;">\n                        <option value="all" selected>所有</option>\n                        <option value="filter">🚫 已屏蔽</option>\n                        <option value="favorite">⭐ 已收藏</option>\n                        <option value="hasDown">📥️ 已下载</option>\n                        <option value="hasWatch">🔍 已观看</option>\n                    </select>\n                    <input id="searchCarNum" type="text" placeholder="搜索番号|演员" style="padding: 4px 5px;">\n                    <a id="clearSearchbtn" class="a-info" style="margin-left: 0">重置</a>\n                </div>\n                <div id="allSelectBox" style="margin-top: 8px;display: none">\n                    <a class="menu-btn multiple-history-deleteBtn" style="background-color:#8c8080; color:white; margin-bottom: 5px;"> <span>✂️ 移除</span> </a>\n                    <a class="menu-btn multiple-history-hasWatchBtn" style="background-color:#d7a80c;margin-bottom: 5px">🔍 已观看</a>\n                    <a class="menu-btn multiple-history-hasDownBtn" style="background-color:#7bc73b;margin-bottom: 5px">📥️ 已下载</a>\n                    <a class="menu-btn multiple-history-favoriteBtn" style="background-color:#25b1dc;margin-bottom: 5px">⭐ 收藏</a>\n                    <a class="menu-btn multiple-history-filterBtn" style="background-color:#de3333;margin-bottom: 5px">🚫 屏蔽</a>\n                </div>\n                <div id="table-container" style="margin-top:20px !important; height: calc(100% - 50px); overflow-x:hidden;"></div>\n            </div>\n        ',
            scrollbar: !1,
            shadeClose: !0,
            area: utils.getResponsiveArea([ "70%", "90%" ]),
            anim: -1,
            success: async layero => {
                await this.loadTableData();
                $(".layui-layer-content").on("click", "#clearSearchbtn", (async event => {
                    $("#searchCarNum").val("");
                    $("#dataType").val("all");
                    await this.reloadTable();
                    $("#allSelectBox").hide();
                })).on("focusout keydown", "#searchCarNum", (async event => {
                    if ("focusout" === event.type || "Enter" === event.key) {
                        "Enter" === event.key && event.preventDefault();
                        if ("keydown" === event.type && "Enter" !== event.key) return;
                        await this.reloadTable();
                    }
                })).on("click", ".table-link-param", (async event => {
                    let $targetEl = $(event.currentTarget);
                    $("#searchCarNum").val($targetEl.text());
                    await this.reloadTable();
                })).on("change", "#dataType", (async () => {
                    await this.reloadTable();
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
        this.tableObj.deselectRow();
        this.tableObj.setPage(1);
    }
    bindClick() {
        document.addEventListener("click", (function(e) {
            if (e.target.closest(".sub-btns-toggle")) {
                const menu = e.target.closest(".sub-btns").querySelector(".sub-btns-menu");
                document.querySelectorAll(".sub-btns-menu.show").forEach((openMenu => {
                    openMenu !== menu && openMenu.classList.remove("show");
                }));
                menu.classList.toggle("show");
            } else document.querySelectorAll(".sub-btns-menu.show").forEach((menu => {
                menu.classList.remove("show");
            }));
        }));
        $(document).on("click", ".history-deleteBtn, .history-filterBtn, .history-favoriteBtn, .history-hasDownBtn, .history-hasWatchBtn, .history-detailBtn", (event => {
            event.preventDefault();
            event.stopPropagation();
            const $btn = $(event.currentTarget), $menuBox = $btn.closest(".action-btns"), carNum2 = $menuBox.attr("data-car-num"), aHref = $menuBox.attr("data-href"), handleAction = async status => {
                await storageManager.saveCar({
                    carNum: carNum2,
                    url: aHref,
                    names: null,
                    actionType: status
                });
                window.refresh();
                await this.reloadTable();
            };
            $btn.hasClass("history-filterBtn") ? utils.q(event, `是否屏蔽${carNum2}?`, (() => handleAction(Status_FILTER))) : $btn.hasClass("history-favoriteBtn") ? handleAction(Status_FAVORITE).then() : $btn.hasClass("history-hasDownBtn") ? handleAction(Status_HAS_DOWN).then() : $btn.hasClass("history-hasWatchBtn") ? handleAction(Status_HAS_WATCH).then() : $btn.hasClass("history-deleteBtn") ? this.handleDelete(event, carNum2) : $btn.hasClass("history-detailBtn") && this.handleClickDetail(event, {
                carNum: carNum2,
                url: aHref
            }).then();
        }));
        $(document).on("click", ".multiple-history-deleteBtn, .multiple-history-filterBtn, .multiple-history-favoriteBtn, .multiple-history-hasDownBtn, .multiple-history-hasWatchBtn", (event => {
            event.preventDefault();
            event.stopPropagation();
            const $btn = $(event.currentTarget);
            let selectedRows = this.tableObj.getSelectedData(), handleText = "", handleStatus = "";
            if ($btn.hasClass("multiple-history-filterBtn")) {
                handleText = "屏蔽";
                handleStatus = Status_FILTER;
            } else if ($btn.hasClass("multiple-history-favoriteBtn")) {
                handleText = "收藏";
                handleStatus = Status_FAVORITE;
            } else if ($btn.hasClass("multiple-history-hasDownBtn")) {
                handleText = "已下载";
                handleStatus = Status_HAS_DOWN;
            } else if ($btn.hasClass("multiple-history-hasWatchBtn")) {
                handleText = "已观看";
                handleStatus = Status_HAS_WATCH;
            } else if ($btn.hasClass("multiple-history-deleteBtn")) {
                handleText = "移除";
                handleStatus = "delete";
            }
            utils.q(event, `当前已勾选${selectedRows.length}条数据, 是否全标记为 ${handleText}?`, (async () => {
                let loadObj = loading();
                try {
                    if ("delete" === handleStatus) {
                        const deleteCarNumList = selectedRows.map((row => row.carNum)), removedCount = await storageManager.batchRemoveCars(deleteCarNumList);
                        removedCount > 0 ? show.ok(`已成功删除 ${removedCount} 个番号`) : !1 === removedCount && show.error("提供的番号中没有一个存在于列表中。");
                    } else {
                        const carRecords = JSON.parse(JSON.stringify(selectedRows));
                        carRecords.forEach((record => {
                            record.actionType = handleStatus;
                        }));
                        await storageManager.saveCarList(carRecords);
                        show.ok("操作成功");
                    }
                    this.tableObj.deselectRow();
                    this.reloadTable().then();
                } catch (e) {
                    console.error(e);
                } finally {
                    loadObj.close();
                }
            }));
        }));
    }
    async getDataList(page, size, sort) {
        let dataList = await storageManager.getCarList();
        this.allCount = dataList.length;
        this.filterCount = 0;
        this.favoriteCount = 0;
        this.hasDownCount = 0;
        this.hasWatchCount = 0;
        dataList.forEach((item => {
            switch (item.status) {
                case Status_FILTER:
                    this.filterCount++;
                    break;

                case Status_FAVORITE:
                    this.favoriteCount++;
                    break;

                case Status_HAS_DOWN:
                    this.hasDownCount++;
                    break;

                case Status_HAS_WATCH:
                    this.hasWatchCount++;
            }
        }));
        $('#dataType option[value="all"]').text(`所有 (${this.allCount})`);
        $('#dataType option[value="filter"]').text(`🚫 已屏蔽 (${this.filterCount})`);
        $('#dataType option[value="favorite"]').text(`⭐ 已收藏 (${this.favoriteCount})`);
        $('#dataType option[value="hasDown"]').text(`📥️ 已下载 (${this.hasDownCount})`);
        $('#dataType option[value="hasWatch"]').text(`🔍 已观看 (${this.hasWatchCount})`);
        const dataType = $("#dataType").val();
        let filterDataList = "all" === dataType ? dataList : dataList.filter((item => item.status === dataType));
        const searchCarNum = $("#searchCarNum").val().trim();
        if (searchCarNum) {
            let tempCarNum = searchCarNum.toLowerCase().replace("-c", "").replace("-uc", "").replace("-4k", "");
            filterDataList = filterDataList.filter((item => {
                const result1 = item.carNum.toLowerCase().includes(tempCarNum);
                const result2 = (item.names ? item.names : "").toLowerCase().includes(tempCarNum);
                return result1 || result2;
            }));
        }
        if (sort && sort.length > 0) {
            const sorter = sort[0], field = sorter.field, dir = sorter.dir;
            filterDataList.sort(((a, b) => {
                const valA = a[field], valB = b[field], isValANullish = null == valA || "" === valA, isValBNullish = null == valB || "" === valB;
                return isValANullish && !isValBNullish ? 1 : !isValANullish && isValBNullish ? -1 : isValANullish && isValBNullish ? 0 : valA < valB ? "asc" === dir ? -1 : 1 : valA > valB ? "asc" === dir ? 1 : -1 : 0;
            }));
        }
        const totalCount = filterDataList.length, maxPage = Math.ceil(totalCount / size), startIndex = (page - 1) * size, endIndex = startIndex + size;
        filterDataList = filterDataList.slice(startIndex, endIndex);
        return {
            maxPage: maxPage,
            dataList: filterDataList,
            totalCount: totalCount
        };
    }
    async loadTableData() {
        this.tableObj = new Tabulator("#table-container", {
            layout: "fitColumns",
            placeholder: "暂无数据",
            virtualDom: !0,
            pagination: !0,
            paginationMode: "remote",
            sortMode: "remote",
            ajaxURL: "queryRealm",
            dataLoader: !1,
            ajaxRequestFunc: async (url, ajaxConfig, params) => {
                const page = params.page, size = params.size, sort = params.sort;
                return await this.getDataList(page, size, sort);
            },
            dataReceiveParams: {
                last_page: "maxPage",
                last_row: "totalCount",
                data: "dataList"
            },
            paginationSize: 50,
            paginationSizeSelector: [ 50, 100, 1e3, 99999 ],
            paginationCounter: (pageSize, currentRow, currentPage, totalRows, totalPages) => `共 ${totalRows} 条记录`,
            responsiveLayout: "collapse",
            responsiveLayoutCollapse: !0,
            columnDefaults: {
                headerHozAlign: "center",
                hozAlign: "center"
            },
            selectableRowsPersistence: !1,
            index: "carNum",
            columns: [ {
                formatter: "rowSelection",
                titleFormatter: "rowSelection",
                hozAlign: "center",
                headerSort: !1,
                responsive: 0,
                width: 40,
                titleFormatterParams: {
                    rowRange: "active"
                },
                cellClick: (e, cell) => {
                    cell.getRow().toggleSelect();
                }
            }, {
                title: "番号",
                field: "carNum",
                width: 120,
                sorter: "string",
                responsive: 0,
                formatter: (cell, formatterParams, onRendered) => {
                    const carNumString = cell.getData().carNum, hyphenIndex = carNumString.indexOf("-");
                    if (-1 === hyphenIndex) return carNumString;
                    return `<a class="table-link-param">${carNumString.substring(0, hyphenIndex + 1)}</a>${carNumString.substring(hyphenIndex + 1)}`;
                }
            }, {
                title: "演员",
                field: "names",
                minWidth: 200,
                sorter: "string",
                responsive: 5,
                headerSort: !0,
                formatter: (cell, formatterParams, onRendered) => (cell.getData().names || "").split(" ").filter((name2 => "" !== name2.trim())).map((name2 => `<a class="table-link-param">${name2}</a>`)).join(" ")
            }, {
                title: "创建时间",
                field: "createDate",
                width: 170,
                sorter: "string",
                responsive: 4
            }, {
                title: "修改时间",
                field: "updateDate",
                width: 170,
                sorter: "string",
                responsive: 4
            }, {
                title: "发行时间",
                field: "publishTime",
                width: 170,
                sorter: "string",
                responsive: 4
            }, {
                title: "来源",
                field: "url",
                width: 80,
                sorter: "string",
                responsive: 5,
                hozAlign: "left",
                formatter: (cell, formatterParams, onRendered) => {
                    let url = cell.getData().url;
                    return url ? url.includes("javdb") ? '<span style="color:#d34f9e">Javdb</span>' : url.includes("javbus") ? '<span style="color:#eaa813">JavBus</span>' : url.includes("123av") ? '<span style="color:#eaa813">123Av</span>' : `<span style="color:#050505">${url}</span>` : "";
                }
            }, {
                title: "状态",
                field: "status",
                width: 100,
                sorter: "string",
                responsive: 1,
                headerSort: !1,
                formatter: (cell, formatterParams, onRendered) => {
                    const statusValue = cell.getData().status;
                    let color = "", text = "";
                    switch (statusValue) {
                        case "filter":
                            color = "#de3333";
                            text = "🚫 屏蔽";
                            break;

                        case "favorite":
                            color = "#25b1dc";
                            text = "⭐ 收藏";
                            break;

                        case "hasDown":
                            color = "#7bc73b";
                            text = "📥️ 已下载";
                            break;

                        case "hasWatch":
                            color = "#d7a80c";
                            text = "🔍 已观看";
                            break;

                        default:
                            text = statusValue;
                    }
                    return `<span style="color:${color}">${text}</span>`;
                }
            }, {
                title: "备注",
                field: "remark",
                width: 100,
                sorter: "string",
                responsive: 6
            }, {
                title: "操作",
                sorter: "string",
                minWidth: 150,
                cssClass: "action-cell-dropdown",
                responsive: 0,
                headerSort: !1,
                formatter: (cell, formatterParams, onRendered) => {
                    const item = cell.getData();
                    onRendered((() => {
                        var _a2;
                        null == (_a2 = cell.getElement().querySelector(".history-editBtn")) || _a2.addEventListener("click", (e => {
                            this.editRecord(item);
                        }));
                    }));
                    return `\n                            <div class="action-btns" style="display: flex; gap: 5px;justify-content:center" data-car-num="${item.carNum}" data-href="${item.url ? item.url : ""}">\n                                <div class="sub-btns">\n                                    <a class="menu-btn sub-btns-toggle" style="background-color:#c59d36; color:white; margin-bottom: 5px;">\n                                        <span>✏️ 变更</span>\n                                    </a>\n                                    <div class="sub-btns-menu">\n                                        <a class="menu-btn history-editBtn" style="background-color:#007bff; color:white; margin-bottom: 5px;"> <span>✏️ 编辑</span> </a>\n                                        <a class="menu-btn history-deleteBtn" style="background-color:#8c8080; color:white; margin-bottom: 5px;"> <span>✂️ 移除</span> </a>\n                                        <a class="menu-btn history-hasWatchBtn" style="background-color:#d7a80c;margin-bottom: 5px">🔍 已观看</a>\n                                        <a class="menu-btn history-hasDownBtn" style="background-color:#7bc73b;margin-bottom: 5px">📥️ 已下载</a>\n                                        <a class="menu-btn history-favoriteBtn" style="background-color:#25b1dc;margin-bottom: 5px">⭐ 收藏</a>\n                                        <a class="menu-btn history-filterBtn" style="background-color:#de3333;margin-bottom: 5px">🚫 屏蔽</a>\n                                    </div>\n                                </div>\n                                \n                                <a class="menu-btn history-detailBtn" style="background-color:#3397de; color:white; margin-bottom: 5px;"> <span>📄 详情页</span> </a>\n                                \n                            </div>\n                        `;
                }
            } ],
            initialSort: [ {
                column: "updateDate",
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
        this.tableObj.on("rowSelectionChanged", ((data, rows, selected, deselected) => {
            const $allSelectBox = $("#allSelectBox"), $filterBox = $("#filterBox");
            if (data && data.length > 0) {
                $filterBox.hide();
                $allSelectBox.show();
            } else {
                $filterBox.show();
                $allSelectBox.hide();
            }
        }));
        this.tableObj.on("rowDblClick", (function(e, row) {
            row.toggleSelect();
        }));
        this.tableObj.on("tableBuilt", (async () => {}));
    }
    handleDelete(event, carNum2) {
        utils.q(event, `是否移除${carNum2}?`, (async () => {
            await storageManager.removeCar(carNum2);
            this.reloadTable().then();
        }));
    }
    async handleClickDetail(event, data) {
        if (isJavDb) if (data.carNum.includes("FC2-")) {
            const movieId = this.parseMovieId(data.url);
            this.getBean("Fc2Plugin").openFc2Dialog(movieId, data.carNum, data.url);
        } else {
            if (!data.url) {
                window.open("/search?q=" + data.carNum, "_blank");
                return;
            }
            utils.openPage(data.url, data.carNum, !1, event);
        }
        if (isJavBus) {
            let url = data.url;
            if (url.includes("javdb")) if (data.carNum.includes("FC2-")) {
                const movieId = this.parseMovieId(url);
                await this.getBean("Fc2Plugin").openFc2Page(movieId, data.carNum, url);
            } else window.open(url, "_blank"); else utils.openPage(data.url, data.carNum, !1, event);
        }
    }
    async editRecord(item) {
        const initialCarNum = item.carNum, initialNames = item.names || "", initialUrl = item.url || "", initialStatus = item.status, initialRemark = item.remark || "", textareaStyle = "width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px; min-height: 60px; overflow-y: hidden;", inputStyle = "width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;", editFormHtml = `\n            <div style="padding: 20px;">\n                <div style="margin-bottom: 15px;">\n                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">番号:</label>\n                    <input type="text" id="edit-carNum" value="${initialCarNum}" style="${inputStyle} background-color: #f0f0f0;" readonly>\n                </div>\n                <div style="margin-bottom: 15px;">\n                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">演员 (用空格隔开):</label>\n                    <textarea id="edit-names" style="${textareaStyle}">${initialNames}</textarea>\n                </div>\n                <div style="margin-bottom: 15px;">\n                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">状态:</label>\n                    <select id="edit-status" style="width: 100%; padding: 10px; border: 1px solid #ddd;">\n                        <option value="" ${"" === initialStatus ? "selected" : ""}>-- 请选择 --</option>\n                        ${[ {
            value: Status_FILTER,
            text: "🚫 屏蔽"
        }, {
            value: Status_FAVORITE,
            text: "⭐ 收藏"
        }, {
            value: Status_HAS_DOWN,
            text: "📥️ 已下载"
        }, {
            value: Status_HAS_WATCH,
            text: "🔍 已观看"
        } ].map((option => `\n                            <option value="${option.value}" ${initialStatus === option.value ? "selected" : ""}>${option.text}</option>\n                        `)).join("")}\n                    </select>\n                </div>\n                <div style="margin-bottom: 15px;">\n                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">链接:</label>\n                    <input type="text" id="edit-url" value="${initialUrl}" style="${inputStyle}">\n                </div>\n                \n                <div style="margin-bottom: 15px;">\n                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">备注:</label>\n                    <textarea id="edit-remark" style="${textareaStyle}">${initialRemark}</textarea>\n                </div>\n            </div>\n        `;
        layer.open({
            type: 1,
            title: `编辑记录: ${initialCarNum}`,
            area: [ "500px", "650px" ],
            content: editFormHtml,
            btn: [ "保存", "取消" ],
            success: (layero, index) => {
                const autoResizeTextarea = $textarea => {
                    $textarea.css("height", "auto");
                    $textarea.css("height", $textarea[0].scrollHeight + 15 + "px");
                }, $namesTextarea = $("#edit-names");
                $namesTextarea.on("input", (function() {
                    autoResizeTextarea($(this));
                }));
                autoResizeTextarea($namesTextarea);
                const $remarkTextarea = $("#edit-remark");
                $remarkTextarea.on("input", (function() {
                    autoResizeTextarea($(this));
                }));
                autoResizeTextarea($remarkTextarea);
            },
            yes: async index => {
                const newNames = $("#edit-names").val().trim(), newStatus = $("#edit-status").val(), newUrl = $("#edit-url").val().trim(), newRemark = $("#edit-remark").val().trim(), updatedRecord = {
                    ...item,
                    names: newNames,
                    actionType: newStatus,
                    url: newUrl,
                    remark: newRemark
                };
                await storageManager.updateCarInfo(updatedRecord);
                this.tableObj.setData();
                layer.close(index);
            }
        });
    }
}


export { HistoryPlugin };

import { BasePlugin } from '../core/base-plugin.js';
import { __publicField, isJavBus, isJavDb, NO, YES, qualityOptions } from '../core/constants.js';
import { AliyunApi, WebDavApi, SALT, simpleEncrypt } from './auto-page.js';

class SettingPlugin extends BasePlugin {
    constructor() {
        super(...arguments);
        __publicField(this, "folderName", "JHS-数据备份");
        __publicField(this, "cacheItems", [ {
            key: "jhs_dmm_video",
            text: "🎥 预览视频缓存",
            title: "预览视频缓存"
        }, {
            key: "jhs_other_site",
            text: "🌍 第三方站点缓存",
            title: "第三方站点资源检测结果, 如missav,123Av等"
        }, {
            key: "jhs_screenShot",
            text: "🖼️ 缩略图缓存",
            title: "缩略图缓存"
        }, {
            key: "jhs_translate",
            text: "🆎 标题翻译",
            title: "标题翻译"
        }, {
            key: "jhs_actress_info",
            text: "👩 演员信息",
            title: "演员的年龄三围等数据信息"
        }, {
            key: "jhs_score_info",
            text: "⭐ Top250|热播 评分数据",
            title: "Top250及热播的评分数据"
        } ]);
    }
    getName() {
        return "SettingPlugin";
    }
    async initCss() {
        const settingObj = await storageManager.getSetting();
        let containerWidth = (null == settingObj ? void 0 : settingObj.containerWidth) ?? "100", containerColumns = utils.isMobile() && window.innerWidth < 1e3 ? 1 : (null == settingObj ? void 0 : settingObj.containerColumns) ?? 5;
        this.applyImageMode().then();
        let containerWidthCss = `\n            section .container{\n                max-width: 1000px !important;\n                min-width: ${containerWidth}%;\n            }\n            .movie-list, .movie-list.v{\n                grid-template-columns: repeat(${containerColumns}, minmax(0, 1fr));\n            }\n        `;
        isJavBus && (containerWidthCss = `\n                .container-fluid .row{\n                    max-width: 1000px !important;\n                    min-width: ${containerWidth}%;\n                    margin: auto auto;\n                }\n                \n                .container {\n                    max-width: 1000px !important;\n                    min-width: 80%;\n                    margin: auto auto;\n                }\n                \n                .masonry {\n                    grid-template-columns: repeat(${containerColumns}, minmax(0, 1fr));\n                }\n            `);
        return `\n            <style>\n                ${containerWidthCss}\n                .nav-btn::after {\n                    content:none !important;\n                }\n                \n                #cache-data-display pre {\n                    font-family: Consolas, Monaco, 'Andale Mono', monospace;\n                    white-space: pre-wrap;\n                    word-wrap: break-word;\n                    line-height: 1.5;\n                    color: #333;\n                    border: 1px solid #ddd;\n                }\n                \n                .cache-item {\n                    transition: all 0.2s ease;\n                }\n                .cache-item:hover {\n                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);\n                    transform: translateY(-2px);\n                }\n\n                .tooltip-icon {\n                    display: inline-block;\n                    width: 16px;\n                    height: 16px;\n                    line-height: 16px;\n                    text-align: center;\n                    border-radius: 50%;\n                    background-color: #ccc;\n                    color: white;\n                    font-size: 12px;\n                    margin-right: 5px;\n                    cursor: help;\n                }\n                .setting-item {\n                    display: flex;\n                    align-items: baseline;\n                    justify-content: space-between;\n                    margin-bottom: 3px;\n                    padding: 3px;\n                    /*border: 1px solid #ddd;\n                    border-radius: 5px;*/\n                }\n                .simple-setting .setting-item{\n                    align-items:center;\n                }\n                .setting-label {\n                    font-size: 14px;\n                    min-width: 160px;\n                    font-weight: bold;\n                    margin-right: 10px;\n                }\n                .form-content{\n                    max-width: 160px;\n                    min-width: 160px;\n                }\n                .form-content * {\n                    width: 100%;\n                    padding: 5px;\n                    margin-right: 10px;\n                    text-align: center;\n                }\n                \n                .keyword-label {\n                    display: inline-flex;\n                    align-items: center;\n                    padding: 4px 8px;\n                    border-radius: 4px;\n                    font-size: 14px;\n                    position: relative;\n                    margin-left: 8px;\n                    margin-bottom: 5px;\n                }\n                .keyword-remove {\n                    margin-left: 6px;\n                    cursor: pointer;\n                    font-size: 12px;\n                    line-height: 1;\n                }\n                .keyword-input {\n                    padding: 6px 12px;\n                    border: 1px solid #ccc;\n                    border-radius: 4px;\n                    font-size: 14px;\n                    float:right;\n                }\n                .add-tag-btn {\n                    padding: 6px 12px;\n                    background-color: #e2e8f0;\n                    color: #334155;\n                    border: none;\n                    border-radius: 4px;\n                    cursor: pointer;\n                    font-size: 14px;\n                    margin-left: 8px;\n                    float:right;\n                }\n                .add-tag-btn:hover {\n                    background-color: #cbd5e1;\n                }\n                .tag-box {\n                    margin-top:15px;\n                }\n                \n                \n                #saveBtn,#moreBtn,#helpBtn,#clean-all {\n                    padding: 8px 20px;\n                    background-color: #4CAF50;\n                    color: white;\n                    border: none;\n                    border-radius: 4px;\n                    cursor: pointer;\n                    font-size: 16px;\n                    margin-top: 10px;\n                }\n                #saveBtn:hover {\n                    background-color: #45a049;\n                }\n                #moreBtn {\n                    background-color: #5cb85c;\n                    color: white;\n                }\n                #moreBtn:hover {\n                    background-color: #4cae4c;\n                }\n                #helpBtn {\n                    background-color: #e67e22;\n                    color: white;\n                }\n                #helpBtn:hover {\n                    background-color: #d35400;\n                }\n                .simple-setting, .mini-simple-setting {\n                    display: none;\n                    background: rgba(255,255,255,1); \n                    position: absolute;\n                    top: ${isJavDb ? "35px" : "25px"};\n                    right: ${isJavDb ? "-300%" : "0"};\n                    z-index: 1000;\n                    border: 1px solid #ddd;\n                    border-radius: 4px;\n                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);\n                    padding: 0;\n                    margin-top: 5px; /* 稍微拉开一点距离 */\n                    color: #333;\n                }\n                \n                .mini-switch {\n                  appearance: none;\n                  -webkit-appearance: none;\n                  width: 40px;\n                  height: 20px;\n                  background: #e0e0e0;\n                  border-radius: 20px;\n                  position: relative;\n                  cursor: pointer;\n                  outline: none;\n                  /*transition: all 0.2s ease;*/\n                }\n                \n                .mini-switch:checked {\n                  background: #4CAF50;\n                }\n                \n                .mini-switch::before {\n                  content: "";\n                  position: absolute;\n                  width: 16px;\n                  height: 16px;\n                  border-radius: 50%;\n                  background: white;\n                  top: 2px;\n                  left: 2px;\n                  box-shadow: 0 1px 3px rgba(0,0,0,0.2);\n                  /*transition: all 0.2s ease;*/\n                }\n                \n                .mini-switch:checked::before {\n                  left: calc(100% - 18px);\n                }\n                \n                .side-menu-item {\n                    padding: 12px 12px;\n                    cursor: pointer;\n                    color: #333;\n                    border-left: 3px solid transparent;\n                    transition: all 0.2s;\n                    display: flex;\n                    gap: 5px;\n                }\n                \n                .side-menu-item .icon {\n                     height: 24px; \n                     width: 24px;\n                }\n                \n                .side-menu-item:hover {\n                    background-color: #e9e9e9;\n                }\n                \n                .side-menu-item.active {\n                    background-color: #e0e0e0;\n                    border-left: 3px solid #5d87c2;\n                    font-weight: bold;\n                }\n                \n                .content-panel {\n                    display: none;\n                    margin-top:20px;\n                    padding: 0 10px 10px 0;\n                    height: 100%;\n                    overflow-x: hidden;\n                    overflow-y: auto;\n                }\n                \n                .content-panel.active {\n                    display: block;\n                }\n                \n                input[type="checkbox"]:disabled {\n                    opacity: 0.6; \n                    cursor: default !important;\n                }\n            </style>\n        `;
    }
    async handle() {
        await storageManager.getSetting("enableClog", YES) === YES && clog.show();
        if (isJavDb) {
            let handleResize2 = function() {
                if ($(".navbar-search").is(":hidden")) {
                    $(".mini-setting-box").hide();
                    $(".setting-box").show();
                } else {
                    $(".mini-setting-box").show();
                    $(".setting-box").hide();
                }
            };
            $("#navbar-menu-user .navbar-end").prepend('<div class="navbar-item has-dropdown is-hoverable setting-box" style="position:relative;">\n                    <a id="setting-btn" class="navbar-link nav-btn" style="color: #ff8400 !important;padding-right:15px !important;">\n                        设置\n                    </a>\n                    <div class="simple-setting"></div>\n                </div>');
            utils.loopDetector((() => $("#miniHistoryBtn").length > 0), (() => {
                $(".miniHistoryBtnBox").before('\n                    <div class="navbar-item mini-setting-box" style="position:relative;margin-left: auto;">\n                        <a id="mini-setting-btn" class="navbar-link nav-btn" style="color: #ff8400 !important;padding-left:0 !important;padding-right:0 !important;">\n                            设置\n                        </a>\n                        <div class="mini-simple-setting"></div>\n                    </div>\n                ');
                handleResize2();
            }));
            $(window).resize(handleResize2);
        }
        if (isJavBus) {
            utils.loopDetector((() => $("#waitCheckBtn").length), (() => {
                $("#waitCheckBtn").parent().append('\n                    <div id="top-right-box" style="position: relative; display: flex; flex-grow: 1;justify-content: flex-end;z-index: 12345679 !important;">\n                        <div class="setting-box">\n                            <a id="setting-btn" class="menu-btn main-tab-btn" style="background-color:#6e685e !important;">\n                                <span>设置</span>\n                            </a>\n                            <div class="simple-setting"></div>\n                        </div>\n                    </div>\n               ');
            }), 1, 1e4, !1);
            window.isDetailPage && $("h3").before('\n                    <div class="container-fluid" style="margin-top:20px">\n                        <div id="top-right-box" style="position: relative; display: flex; flex-grow: 1;justify-content: flex-end;z-index: 12345679 !important;">\n                            <div class="setting-box">\n                                <a id="setting-btn" class="menu-btn main-tab-btn" style="background-color:#6e685e !important;">\n                                    <span>设置</span>\n                                </a>\n                                <div class="simple-setting"></div>\n                            </div>\n                        </div>\n                    </div>\n               ');
        }
        $(".main-nav, .container-fluid").on("click", "#setting-btn, #mini-setting-btn", (() => {
            clog.lowZIndex();
            this.openSettingDialog();
        }));
        $(".main-nav, .container-fluid").on("mouseenter", ".setting-box", (async () => {
            $(".simple-setting").html(await this.simpleSetting()).show();
            this.initSimpleSettingForm().then();
            clog.lowZIndex();
        })).on("mouseleave", ".setting-box", (() => {
            $(".simple-setting").html("").hide();
        }));
        $(".main-nav, .container-fluid").on("mouseenter", ".mini-setting-box", (async () => {
            $(".mini-simple-setting").html(await this.simpleSetting()).show();
            this.initSimpleSettingForm().then();
            clog.lowZIndex();
        })).on("mouseleave", ".mini-setting-box", (() => {
            $(".mini-simple-setting").html("").hide();
        }));
    }
    async openSettingDialog(defaultActivePanel = "backup-panel", fun) {
        const buttonsHTML = this.cacheItems.map((item => `\n            <div class="cache-item" style="border: 1px solid #eee; border-radius: 8px; padding: 12px;">\n                <div style="font-weight: bold; margin-bottom: 8px;">${item.text}</div>\n                <div style="display: flex; gap: 8px;">\n                    <a class="menu-btn clean-btn" data-key="${item.key}" style="background-color:#448cc2; flex:1; text-align:center;" title="${item.title}">\n                        <span>清理</span>\n                    </a>\n                    <a class="menu-btn view-btn" data-key="${item.key}" style="background-color:#b2bec0; flex:1; text-align:center;" >\n                        <span>查看</span>\n                    </a>\n                </div>\n            </div>\n        `)).join("");
        let videoQualityHtml = "";
        qualityOptions.forEach((option => {
            option.canSelect && (videoQualityHtml += `<option value="${option.quality}">${option.text}</option>`);
        }));
        const coverButtonPlugin = this.getBean("CoverButtonPlugin");
        let settingHtml = `\n            <div style="display: flex; height: 100%;">\n                <div style="width: 140px; flex-shrink: 0; padding: 15px 0; background: #f5f5f5; border-right: 1px solid #ddd;">\n                    <div class="side-menu-item ${"backup-panel" === defaultActivePanel ? "active" : ""}" data-panel="backup-panel">💾 数据备份</div>\n                    <div class="side-menu-item ${"base-panel" === defaultActivePanel ? "active" : ""}" data-panel="base-panel">⚙️ 基础配置</div>\n                    <div class="side-menu-item ${"filter-panel" === defaultActivePanel ? "active" : ""}" data-panel="filter-panel">🚫 屏蔽配置</div>\n                    <div class="side-menu-item ${"task-panel" === defaultActivePanel ? "active" : ""}" data-panel="task-panel">📋 定时任务</div>\n                    <div class="side-menu-item ${"domain-panel" === defaultActivePanel ? "active" : ""}" data-panel="domain-panel" title="第三方视频资源域名配置">🌐 外部网站</div>\n                    <div class="side-menu-item ${"hotkey-panel" === defaultActivePanel ? "active" : ""}" data-panel="hotkey-panel">⌨️ 快捷键配置</div>\n                    <div class="side-menu-item ${"cache-panel" === defaultActivePanel ? "active" : ""}" data-panel="cache-panel">🧹 清理缓存</div>\n                    <div class="side-menu-item ${"tip-author-panel" === defaultActivePanel ? "active" : ""}" data-panel="tip-author-panel">💵 打赏作者</div>\n                </div>\n        \n                <div style="flex: 1; display: flex; flex-direction: column; height: 100%; ">\n                    <div style="flex: 1; margin: 0 10px; padding-bottom: 20px;overflow: hidden">\n                    \n                        \x3c!-- 阿里云盘面板 --\x3e\n                        <div id="backup-panel" class="content-panel" style="display: ${"backup-panel" === defaultActivePanel ? "block" : "none"};">\n                            <div style="margin-bottom: 20px">\n                                <a id="importBtn" class="menu-btn" style="background-color:#d25a88"><span>导入数据</span></a>\n                                <a id="exportBtn" class="menu-btn" style="background-color:#85d0a3"><span>导出数据</span></a>\n                                <a id="getRefreshTokenBtn" class="menu-btn fr-btn" style="background-color:#c4a35e"><span>获取refresh_token</span></a>\n                            </div>\n                            \n                            <div class="setting-item">\n                                <span class="setting-label">阿里云盘备份</span>\n                                <div>\n                                    <a id="backupListBtn" class="menu-btn" style="background-color:#5d87c2"><span>查看备份</span></a>\n                                    <a id="backupBtn" class="menu-btn" style="background-color:#64bb69"><span>备份数据</span></a>\n                                </div>\n                            </div>\n                            <div class="setting-item">\n                                <span class="setting-label">refresh_token:</span>\n                                <div class="form-content">\n                                    <input id="refresh_token">\n                                </div>\n                            </div>\n                            \n                            <hr style="border: 0; height: 1px; margin:20px 0;background-image: linear-gradient(to right, rgba(0,0,0,0), rgba(159,137,137,0.75), rgba(0,0,0,0));"/>\n                            \n                            <div class="setting-item">\n                                <span class="setting-label">WebDav备份</span>\n                                <div>\n                                    <a id="webdavBackupListBtn" class="menu-btn" style="background-color:#5d87c2"><span>查看备份</span></a>\n                                    <a id="webdavBackupBtn" class="menu-btn" style="background-color:#64bb69"><span>备份数据</span></a>\n                                </div>\n                            </div>\n                            <div class="setting-item">\n                                <span class="setting-label">服务地址:</span>\n                                <div class="form-content">\n                                    <input id="webDavUrl">\n                                </div>\n                            </div>\n                            <div class="setting-item">\n                                <span class="setting-label">用户名:</span>\n                                <div class="form-content">\n                                    <input id="webDavUsername">\n                                </div>\n                            </div>\n                            <div class="setting-item">\n                                <span class="setting-label">密码:</span>\n                                <div class="form-content">\n                                    <input id="webDavPassword">\n                                </div>\n                            </div>\n                        </div>\n                        \n                        \n                        \x3c!-- 基础设置面板 --\x3e\n                        <div id="base-panel" class="content-panel" style="display: ${"base-panel" === defaultActivePanel ? "block" : "none"};">\n                            <div class="setting-item">\n                                <span class="setting-label">已鉴定标签展示位置:</span>\n                                <div class="form-content">\n                                    <select id="tagPosition">\n                                        <option value="rightTop">右上</option>\n                                        <option value="leftTop">左上</option>\n                                    </select>\n                                </div>\n                            </div>\n                            \n                            <div class="setting-item">\n                                <span class="setting-label">已鉴定内容处理方式:</span>\n                                <div class="form-content">\n                                    <select id="movieShowType">\n                                        <option value="hide">隐藏</option>\n                                        <option value="visibility">透明</option>\n                                    </select>\n                                </div>\n                            </div>\n                            \n                            <div class="setting-item">\n                                <span class="setting-label" style="display:flex; align-items:center; gap:5px">\n                                    鉴定补录演员信息 <span data-tip="在列表页进行鉴定是获取不到演员名称的, 开启后, 额外解析详情页补录演员名称, 因发请求解析费时, 会被以往慢1秒左右">❓</span>\n                                </span>\n                                <div class="form-content">\n                                    <input type="checkbox" id="enableSaveActressCarInfo" class="mini-switch">\n                                </div>\n                            </div>\n                            \n                            <hr style="border: 0; height: 1px; margin:20px 0;background-image: linear-gradient(to right, rgba(0,0,0,0), rgba(159,137,137,0.75), rgba(0,0,0,0));"/>\n                            \n                            <div class="setting-item" style="margin-top:10px">\n                                <span class="setting-label">\n                                    列表页功能按钮\n                                </span>\n                            </div>\n                            \n                            <div class="setting-item">\n                                <span class="setting-label">按钮-打开待鉴定:</span>\n                                <div class="form-content">\n                                    <input type="checkbox" id="showWaitCheckBtn" class="mini-switch">\n                                </div>\n                            </div>\n                            \n                            <div class="setting-item">\n                                <span class="setting-label">按钮-打开已收藏:</span>\n                                <div class="form-content">\n                                    <input type="checkbox" id="showWaitDownBtn" class="mini-switch">\n                                </div>\n                            </div>\n                            \n                            <div class="setting-item">\n                                <span class="setting-label">打开待鉴定|已收藏 窗口数:</span>\n                                <div class="form-content">\n                                    <input type="number" id="waitCheckCount" min="1" max="20" style="width: 100%;">\n                                </div>\n                            </div>\n                            \n                            <div class="setting-item">\n                                <span class="setting-label">随机打开已收藏:</span>\n                                <div class="form-content">\n                                    <input type="checkbox" id="randomOpenWaitDown" class="mini-switch">\n                                </div>\n                            </div>\n                            \n                            \n                            <hr style="border: 0; height: 1px; margin:20px 0;background-image: linear-gradient(to right, rgba(0,0,0,0), rgba(159,137,137,0.75), rgba(0,0,0,0));"/>\n                            \n                            <div class="setting-item" style="margin-top:10px">\n                                <span class="setting-label">\n                                    封面快捷按钮\n                                </span>\n                            </div>\n                            \n                            <div class="setting-item">\n                                <span class="setting-label" style="display:flex; align-items:center; gap:5px">\n                                    ${coverButtonPlugin.screenSvg}长缩略图:\n                                </span>\n                                <div class="form-content">\n                                    <input type="checkbox" id="enableScreenSvg" class="mini-switch">\n                                </div>\n                            </div>\n                            \n                            <div class="setting-item">\n                                <span class="setting-label" style="display:flex; align-items:center; gap:5px">\n                                    ${coverButtonPlugin.videoSvg}预览视频:\n                                </span>\n                                <div class="form-content">\n                                    <input type="checkbox" id="enableVideoSvg" class="mini-switch">\n                                </div>\n                            </div>\n                            \n                            <div class="setting-item">\n                                <span class="setting-label" style="display:flex; align-items:center; gap:5px">\n                                    ${coverButtonPlugin.handleSvg}鉴定按钮:\n                                </span>\n                                <div class="form-content">\n                                    <input type="checkbox" id="enableHandleSvg" class="mini-switch">\n                                </div>\n                            </div>\n                            \n                            <div class="setting-item">\n                                <span class="setting-label" style="display:flex; align-items:center; gap:5px">\n                                    ${coverButtonPlugin.siteSvg}第三方跳转:\n                                </span>\n                                <div class="form-content">\n                                    <input type="checkbox" id="enableSiteSvg" class="mini-switch">\n                                </div>\n                            </div>\n                            \n                            <div class="setting-item">\n                                <span class="setting-label" style="display:flex; align-items:center; gap:5px">\n                                    ${coverButtonPlugin.copySvg}复制按钮:\n                                </span>\n                                <div class="form-content">\n                                    <input type="checkbox" id="enableCopySvg" class="mini-switch">\n                                </div>\n                            </div>\n                            \n                            <hr style="border: 0; height: 1px; margin:20px 0;background-image: linear-gradient(to right, rgba(0,0,0,0), rgba(159,137,137,0.75), rgba(0,0,0,0));"/>\n\n                            <div class="setting-item">\n                                <span class="setting-label">预览视频默认画质:</span>\n                                <div class="form-content">\n                                    <select id="videoQuality">\n                                        ${videoQualityHtml}\n                                    </select>\n                                </div>\n                            </div>\n                            \n                            <div class="setting-item">\n                                <span class="setting-label">评论区条数:</span>\n                                <div class="form-content">\n                                    <select id="reviewCount">\n                                        <option value="10">10条</option>\n                                        <option value="20">20条</option>\n                                        <option value="30">30条</option>\n                                        <option value="40">40条</option>\n                                        <option value="50">50条</option>\n                                    </select>\n                                </div>\n                            </div>\n                            \n                            <div class="setting-item ${isJavDb ? "" : "do-hide"}">\n                                <span class="setting-label">\n                                    高亮已收藏演员 <span data-tip="详情页, 对已收藏的演员进行边框高亮提醒">❓</span>\n                                </span>\n                                <div class="form-content">\n                                    <input type="checkbox" id="enableFavoriteActresses" class="mini-switch">\n                                </div>\n                            </div>\n                            \n                            <div class="setting-item ${isJavDb ? "" : "do-hide"}">\n                                <span id="highlightedTagLabel" class="setting-label">\n                                    分类标签|高亮演员-边框样式:\n                                </span>\n                                <div class="form-content" style="display: flex; align-items: center;">\n                                    <input type="number" id="highlightedTagNumber" min="0" max="20">\n                                    <input type="color" id="highlightedTagColor">\n                                </div>\n                            </div>\n\n                            <hr style="border: 0; height: 1px; margin:20px 0;background-image: linear-gradient(to right, rgba(0,0,0,0), rgba(159,137,137,0.75), rgba(0,0,0,0));"/>\n                            \n                            <div class="setting-item">\n                                <span class="setting-label">请求超时时间(毫秒):</span>\n                                <div class="form-content">\n                                    <input type="number" id="httpTimeout" min="1000" max="10000" style="width: 100%;">\n                                </div>\n                            </div>\n                            \n                            <div class="setting-item">\n                                <span class="setting-label">请求失败重试次数:</span>\n                                <div class="form-content">\n                                    <input type="number" id="httpRetryCount" min="0" max="10" style="width: 100%;">\n                                </div>\n                            </div>\n                            \n                            <hr style="border: 0; height: 1px; margin:20px 0;background-image: linear-gradient(to right, rgba(0,0,0,0), rgba(159,137,137,0.75), rgba(0,0,0,0));"/>\n                            \n                            <div class="setting-item">\n                                <span class="setting-label">\n                                    启用控制台日志:\n                                </span>\n                                <div class="form-content">\n                                    <select id="enableClog">\n                                        <option value="no">禁用</option>\n                                        <option value="yes">开启</option>\n                                    </select>\n                                </div>\n                            </div>\n\n                            <div class="setting-item">\n                                <span class="setting-label">日志最大行数:</span>\n                                <div class="form-content">\n                                    <input type="number" id="clogMsgCount" min="100" max="3000" style="width: 100%;">\n                                </div>\n                            </div>\n                        </div>\n                        \n                        \x3c!-- 定时任务 --\x3e\n                        <div id="task-panel" class="content-panel" style="display: ${"task-panel" === defaultActivePanel ? "block" : "none"};">\n                        \n                            <div class="setting-item">\n                                <span class="setting-label">请求并发数量:</span>\n                                <div class="form-content">\n                                    <input type="number" id="checkConcurrencyCount" min="2" max="5" style="width: 100%;">\n                                </div>\n                            </div>\n                            <div class="setting-item">\n                                <span class="setting-label">请求间隔时间(毫秒):</span>\n                                <div class="form-content">\n                                    <input type="number" id="checkRequestSleep" min="0" max="3000" style="width: 100%;">\n                                </div>\n                            </div>\n                        \n                            <hr style="border: 0; height: 1px; margin:20px 0;background-image: linear-gradient(to right, rgba(0,0,0,0), rgba(159,137,137,0.75), rgba(0,0,0,0));"/>\n                        \n                            <div id="setting-blacklist" style="border: 1px solid #ccc; padding: 10px; margin-bottom: 15px;">\n                                <span style="font-size: 14px; font-weight: bold; padding:3px">自动检测屏蔽黑名单演员</span>\n                                <div class="setting-item">\n                                    <span class="setting-label">\n                                        任务开关: <span data-tip="变更后, 刷新页面生效">❓</span> \n                                    </span>\n                                    <div class="form-content">\n                                        <select id="enableCheckBlacklist">\n                                            <option value="no">禁用</option>\n                                            <option value="yes">开启</option>\n                                        </select>\n                                    </div>\n                                </div>\n                                <div class="setting-item">\n                                    <span class="setting-label">任务间隔时间:</span>\n                                    <div class="form-content">\n                                         <select id="checkBlacklist_intervalTime">\n                                            <option value="2">每2小时</option>\n                                            <option value="3">每3小时</option>\n                                            <option value="6">每6小时</option>\n                                            <option value="12">每12小时</option>\n                                            <option value="24">每24小时</option>\n                                        </select>\n                                    </div>\n                                </div>\n                                <div class="setting-item">\n                                    <span class="setting-label">检测规则:</span>\n                                    <div class="form-content">\n                                         <select id="checkBlacklist_ruleTime">\n                                            <option value="0">全部检测</option>\n                                            <option value="8760">不检测停更1年以上</option>\n                                            <option value="17520">不检测停更2年以上</option>\n                                            <option value="26280">不检测停更3年以上</option>\n                                        </select>\n                                    </div>\n                                </div>\n                            </div>\n                        \n                            <div id="setting-checkFavoriteActress" style="border: 1px solid #ccc; padding: 10px; margin-bottom: 15px;" class="${isJavDb ? "" : "do-hide"}">\n                                <span style="font-size: 14px; font-weight: bold; padding:3px">自动同步已收藏的演员</span>\n                                <div class="setting-item">\n                                    <span class="setting-label">\n                                        任务开关: <span data-tip="变更后, 刷新页面生效">❓</span> \n                                    </span>\n                                    <div class="form-content">\n                                        <select id="enableCheckFavoriteActress">\n                                            <option value="no">禁用</option>\n                                            <option value="yes">开启</option>\n                                        </select>\n                                    </div>\n                                </div>\n                                <div class="setting-item">\n                                    <span class="setting-label">任务间隔时间:</span>\n                                    <div class="form-content">\n                                         <select id="checkFavoriteActress_IntervalTime">\n                                            <option value="12">每12小时</option>\n                                            <option value="24">每24小时</option>\n                                        </select>\n                                    </div>\n                                </div>\n                            </div>\n                        \n                            <div id="setting-checkNewVideo" style="border: 1px solid #ccc; padding: 10px; margin-bottom: 15px;" class="${isJavDb ? "" : "do-hide"}">\n                                <span style="font-size: 14px; font-weight: bold; padding:3px">自动检测已收藏演员的最新作品</span>\n                                <div class="setting-item">\n                                    <span class="setting-label">\n                                        任务开关: <span data-tip="变更后, 刷新页面生效">❓</span> \n                                    </span>\n                                    <div class="form-content">\n                                        <select id="enableCheckNewVideo">\n                                            <option value="no">禁用</option>\n                                            <option value="yes">开启</option>\n                                        </select>\n                                    </div>\n                                </div>\n                                <div class="setting-item">\n                                    <span class="setting-label">任务间隔时间:</span>\n                                    <div class="form-content">\n                                         <select id="checkNewVideo_intervalTime">\n                                            <option value="2">每2小时</option>\n                                            <option value="3">每3小时</option>\n                                            <option value="6">每6小时</option>\n                                            <option value="12">每12小时</option>\n                                            <option value="24">每24小时</option>\n                                        </select>\n                                    </div>\n                                </div>\n                                <div class="setting-item">\n                                    <span class="setting-label">检测规则:</span>\n                                    <div class="form-content">\n                                         <select id="checkNewVideo_ruleTime">\n                                            <option value="0">全部检测</option>\n                                            <option value="8760">不检测停更1年以上</option>\n                                            <option value="17520">不检测停更2年以上</option>\n                                            <option value="26280">不检测停更3年以上</option>\n                                        </select>\n                                    </div>\n                                </div>\n                            </div>\n                        </div>               \n         \n                        \x3c!-- 域名设置面板 --\x3e\n                        <div id="domain-panel" class="content-panel" style="display: ${"domain-panel" === defaultActivePanel ? "block" : "none"};">\n                            <div class="setting-item">\n                                <span class="setting-label">域名 - MissAv:</span>\n                                <div class="form-content">\n                                    <input id="missAvUrl">\n                                </div>\n                            </div>\n                            <div class="setting-item">\n                                <span class="setting-label">域名 - Jable:</span>\n                                <div class="form-content">\n                                    <input id="jableUrl">\n                                </div>\n                            </div>\n                            <div class="setting-item">\n                                <span class="setting-label">域名 - Avgle:</span>\n                                <div class="form-content">\n                                    <input id="avgleUrl">\n                                </div>\n                            </div>\n                            <div class="setting-item">\n                                <span class="setting-label">域名 - JavTrailer:</span>\n                                <div class="form-content">\n                                    <input id="javTrailersUrl">\n                                </div>\n                            </div>\n                            <div class="setting-item">\n                                <span class="setting-label">域名 - 123Av:</span>\n                                <div class="form-content">\n                                    <input id="av123Url">\n                                </div>\n                            </div>\n                            <div class="setting-item">\n                                <span class="setting-label">域名 - JavDb:</span>\n                                <div class="form-content">\n                                    <input id="javDbUrl">\n                                </div>\n                            </div>\n                            <div class="setting-item">\n                                <span class="setting-label">域名 - JavBus:</span>\n                                <div class="form-content">\n                                    <input id="javBusUrl">\n                                </div>\n                            </div>\n                            <div class="setting-item">\n                                <span class="setting-label">域名 - SupJav:</span>\n                                <div class="form-content">\n                                    <input id="supJavUrl">\n                                </div>\n                            </div>           \n                        </div>\n                         \n                         \x3c!-- 快捷键 --\x3e\n                        <div id="hotkey-panel" class="content-panel" style="display: ${"hotkey-panel" === defaultActivePanel ? "block" : "none"};">\n                            <p style="color: #c62222; font-size: 14px;font-weight: bold;margin-bottom: 10px;">快捷键修改后, 刷新页面生效</p>\n                            <div style="border: 1px solid #ccc; padding: 10px; margin-bottom: 15px;">\n                                <div class="setting-item">\n                                    <span class="setting-label">🚫 屏蔽:</span>\n                                    <div class="form-content">\n                                        <input id="filterHotKey" placeholder="录入快捷键" data-default-hotkey="a">\n                                    </div>\n                                </div>\n                                <div class="setting-item">\n                                    <span class="setting-label">⭐ 收藏:</span>\n                                    <div class="form-content">\n                                        <input id="favoriteHotKey" placeholder="录入快捷键" data-default-hotkey="s">\n                                    </div>\n                                </div>\n                                <div class="setting-item">\n                                    <span class="setting-label">📥️ 已下载:</span>\n                                    <div class="form-content">\n                                        <input id="hasDownHotKey" placeholder="录入快捷键">\n                                    </div>\n                                </div>\n                                <div class="setting-item">\n                                    <span class="setting-label">🔍 已观看:</span>\n                                    <div class="form-content">\n                                        <input id="hasWatchHotKey" placeholder="录入快捷键">\n                                    </div>\n                                </div>\n                                \n                                <div class="setting-item">\n                                    <span class="setting-label">\n                                        <span data-tip="列表页,鼠标放置图片上时可使用快捷键">❓ </span> 对视频列表页启用快捷键:\n                                    </span>\n                                    <div class="form-content">\n                                        <input type="checkbox" id="enableImageHotKey" class="mini-switch">\n                                    </div>\n                                </div>\n                            </div>\n                            \n                            <div style="border: 1px solid #ccc; padding: 10px; margin-bottom: 15px;">\n                                <div class="setting-item">\n                                    <span class="setting-label">⏩ 快进:</span>\n                                    <div class="form-content">\n                                        <input id="speedVideoHotKey" placeholder="录入快捷键" data-default-hotkey="z">\n                                    </div>\n                                </div>\n                                \n                                <div class="setting-item">\n                                    <span class="setting-label">▲ 折叠:</span>\n                                    <div class="form-content">\n                                        <input id="foldCategoryHotKey" placeholder="录入快捷键">\n                                    </div>\n                                </div>\n                                \n                                <div class="setting-item">\n                                    <span class="setting-label">💻 控制台:</span>\n                                    <div class="form-content">\n                                        <input id="clogHotKey" placeholder="录入快捷键">\n                                    </div>\n                                </div>\n                            </div>\n\n\n                            <div style="border: 1px solid #ccc; padding: 10px; margin-bottom: 15px;">\n                                <span style="font-size: 14px; font-weight: bold; padding:3px">显示已鉴定内容</span>\n                                <div class="setting-item">\n                                    <span class="setting-label">屏蔽单番号:</span>\n                                    <div class="form-content">\n                                        <input id="showFilterItemHotKey" placeholder="录入快捷键">\n                                    </div>\n                                </div>\n                                <div class="setting-item">\n                                    <span class="setting-label">屏蔽演员:</span>\n                                    <div class="form-content">\n                                        <input id="showFilterActorItemHotKey" placeholder="录入快捷键">\n                                    </div>\n                                </div>\n                                <div class="setting-item">\n                                    <span class="setting-label">屏蔽关键词:</span>\n                                    <div class="form-content">\n                                        <input id="showFilterKeywordItemHotKey" placeholder="录入快捷键">\n                                    </div>\n                                </div>\n                                <div class="setting-item">\n                                    <span class="setting-label">收藏:</span>\n                                    <div class="form-content">\n                                        <input id="showFavoriteItemHotKey" placeholder="录入快捷键">\n                                    </div>\n                                </div>\n                                <div class="setting-item">\n                                    <span class="setting-label">已下载:</span>\n                                    <div class="form-content">\n                                        <input id="showHasDownItemHotKey" placeholder="录入快捷键">\n                                    </div>\n                                </div>\n                                <div class="setting-item">\n                                    <span class="setting-label">已观看:</span>\n                                    <div class="form-content">\n                                        <input id="showHasWatchItemHotKey" placeholder="录入快捷键">\n                                    </div>\n                                </div>\n                                <div class="setting-item">\n                                    <span class="setting-label">显示所有:</span>\n                                    <div class="form-content">\n                                        <input id="showAllItemHotKey" placeholder="录入快捷键">\n                                    </div>\n                                </div>                                \n                            </div>\n\n                        </div>\n                        \n                        \x3c!-- 屏蔽设置面板 --\x3e\n                        <div id="filter-panel" class="content-panel" style="display: ${"filter-panel" === defaultActivePanel ? "block" : "none"};">\n                            <div class="setting-item">\n                                <span class="setting-label">\n                                     启用划词屏蔽 <span data-tip="视频详情页中, 标题或评论区选中文字, 按右键可快捷加入屏蔽词">❓ </span>\n                                </span>\n                                <div style="display: flex">\n                                    <input type="checkbox" id="enableTitleSelectFilter" class="mini-switch">\n                                </div>\n                            </div>\n                            \n                            <hr style="border: 0; height: 1px; margin:20px 0;background-image: linear-gradient(to right, rgba(0,0,0,0), rgba(159,137,137,0.75), rgba(0,0,0,0));"/>\n                            \n                            <div id="reviewKeywordContainer">\n                                <div class="setting-item">\n                                    <span class="setting-label">评论区屏蔽词:</span>\n                                    <div style="display: flex">\n                                        <input type="text" class="keyword-input" placeholder="添加屏蔽词">\n                                        <button class="add-tag-btn">添加</button>\n                                    </div>\n                                </div>\n                                <div class="tag-box"> </div>\n                            </div>\n                            \n                            <hr style="border: 0; height: 1px; margin:20px 0;background-image: linear-gradient(to right, rgba(0,0,0,0), rgba(159,137,137,0.75), rgba(0,0,0,0));"/>\n                            \n                            <div id="filterKeywordContainer">\n                                <div class="setting-item">\n                                    <span class="setting-label">视频标题屏蔽词:</span>\n                                    <div style="display: flex">\n                                        <input type="text" class="keyword-input" placeholder="添加屏蔽词">\n                                        <button class="add-tag-btn">添加</button>\n                                    </div>\n                                </div>\n                                <div class="tag-box"> </div>\n                            </div>\n                        </div>\n                        <div id="cache-panel" class="content-panel" style="display: ${"cache-panel" === defaultActivePanel ? "block" : "none"};">\n                            <h1 style="text-align:center;font-size: 20px;font-weight: bold">以下操作, 不会对核心数据造成影响</h1>\n                            <br/>               \n                            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-top: 20px;">\n                                ${buttonsHTML}\n                            </div>    \n                            <div id="cache-data-display" style="margin-top: 20px; display: none;">\n                                <pre style="background: #f5f5f5; padding: 10px; border-radius: 5px; max-height: 400px; overflow: auto;"></pre>\n                            </div>\n                        </div>                        \n                        <div id="tip-author-panel" class="content-panel" style="display: ${"tip-author-panel" === defaultActivePanel ? "block" : "none"};">\n                            <p style="color: #666; font-size: 0.9em;">如果JAV-JHS给您带来了便捷和价值，请考虑给予一点支持，您的鼓励是我持续创作的最大动力！感谢您的慷慨支持！</p>\n                            <div>\n                                <div style="display: flex; justify-content: space-around; align-items: flex-start; margin-bottom: 20px; flex-wrap: wrap;">\n                                    <div style="text-align: center; margin: 10px; flex: 1 1 30%; min-width: 150px;">\n                                        <img src="https://imgur.com/AvF0r3r.png" alt="TRC20-USDT二维码" style="width: 350px; height: 350px; border: 1px solid #ddd; padding: 5px; display: block; margin: 0 auto 5px;">\n                                        <p>TRC20-USDT</p>\n                                        <input type="text" readonly value="TYphgzpJ2hoDTa3J7kzj5xaHWbcPAyhbd5" onclick="this.select();document.execCommand('copy');alert('地址已复制！');" \n                                            style="width: 90%; padding: 5px; margin-top: 5px; border: 1px solid #a99087; background-color: #fff; text-align: center; font-size: 0.8em; cursor: pointer; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">\n                                        <p style="font-size: 0.75em; color: #5a504c; margin-top: 4px;">点击地址可复制</p>\n                                    </div>\n                                </div>\n                            </div>\n                        </div>\n                    </div>\n                    \n                    <div style="flex-shrink: 0; padding: 15px 20px; text-align: right; border-top: 1px solid #eee; background: white;">   \n                        <button id="saveBtn">保存设置</button>\n                        <button id="clean-all" style="display: none">♾️ 清理全部缓存</button>\n                    </div>\n                </div>\n            </div>\n        `;
        layer.open({
            type: 1,
            title: "设置",
            content: settingHtml,
            area: utils.getResponsiveArea([ "55%", "90%" ]),
            scrollbar: !1,
            success: (layero, index) => {
                $(layero).find(".layui-layer-content").css("position", "relative");
                this.loadForm();
                this.bindClick();
                utils.setupEscClose(index);
                fun && fun();
            },
            end: () => {
                this.getBean("CoverButtonPlugin").enableSvgBtn();
            }
        });
    }
    async simpleSetting() {
        let settingObj = await storageManager.getSetting();
        const showFilterItemHotKey = settingObj.showFilterItemHotKey, showFilterActorItemHotKey = settingObj.showFilterActorItemHotKey, showFilterKeywordItemHotKey = settingObj.showFilterKeywordItemHotKey, showFavoriteItemHotKey = settingObj.showFavoriteItemHotKey, showHasDownItemHotKey = settingObj.showHasDownItemHotKey, showHasWatchItemHotKey = settingObj.showHasWatchItemHotKey, showAllItemHotKey = settingObj.showAllItemHotKey;
        return `\n             <div class="jhs-scrollbar" style="margin-top:20px;max-height:90vh; overflow-y:auto;">\n                <div style="margin: 0 10px;">\n                    <div class="setting-item">\n                        <span class="setting-label">\n                            显示已鉴定内容:\n                        </span>\n                        <div class="form-content" style="display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end;">\n                            <span style="display:inline-block; width: 100px; font-size:13px; font-weight:bold; text-align: left">屏蔽单番号${showFilterItemHotKey ? `(${showFilterItemHotKey})` : ""}: </span><input type="checkbox" id="showFilterItem" class="mini-switch"><br/>\n                            <span style="display:inline-block; width: 100px; font-size:13px; font-weight:bold; text-align: left">屏蔽演员${showFilterActorItemHotKey ? `(${showFilterActorItemHotKey})` : ""}: </span><input type="checkbox" id="showFilterActorItem" class="mini-switch"><br/>\n                            <span style="display:inline-block; width: 100px; font-size:13px; font-weight:bold; text-align: left">屏蔽关键词${showFilterKeywordItemHotKey ? `(${showFilterKeywordItemHotKey})` : ""}: </span><input type="checkbox" id="showFilterKeywordItem" class="mini-switch"><br/>\n                            <span style="display:inline-block; width: 100px; font-size:13px; font-weight:bold; text-align: left">收藏${showFavoriteItemHotKey ? `(${showFavoriteItemHotKey})` : ""}: </span><input type="checkbox" id="showFavoriteItem" class="mini-switch"><br/>\n                            <span style="display:inline-block; width: 100px; font-size:13px; font-weight:bold; text-align: left">已下载${showHasDownItemHotKey ? `(${showHasDownItemHotKey})` : ""}: </span><input type="checkbox" id="showHasDownItem" class="mini-switch"><br/>\n                            <span style="display:inline-block; width: 100px; font-size:13px; font-weight:bold; text-align: left">已观看${showHasWatchItemHotKey ? `(${showHasWatchItemHotKey})` : ""}: </span><input type="checkbox" id="showHasWatchItem" class="mini-switch"><br/>\n                        </div>\n                    </div>\n                    <div class="setting-item">\n                        <span class="setting-label">\n                            <span data-tip="快速显示所有已鉴定内容,减少对以上开关的频繁操作">❓ </span> 显示所有${showAllItemHotKey ? `(${showAllItemHotKey})` : ""}:\n                        </span>\n                        <div class="form-content" style="display: flex; flex-wrap: wrap; align-items: center; justify-content: flex-end;">\n                            <input type="checkbox" id="showAllItem" class="mini-switch">\n                        </div>\n                    </div>\n                    \n                    <hr style="border: 0; height: 1px; margin:10px 0;background-image: linear-gradient(to right, rgba(0,0,0,0), rgba(159,137,137,0.75), rgba(0,0,0,0));"/>\n                    \n                    <div class="setting-item">\n                        <span class="setting-label">\n                            <span data-tip="点击封面的打开方式,弹窗|新窗口">❓ </span>弹窗方式打开页面:\n                        </span>\n                        <div class="form-content" style="text-align: right;">\n                             <input type="checkbox" id="dialogOpenDetail" class="mini-switch">\n                        </div>\n                    </div>      \n                    \n                    <div class="setting-item">\n                        <span class="setting-label">鉴定后立即关闭页面:</span>\n                        <div class="form-content" style="text-align: right;">\n                            <input type="checkbox" id="needClosePage" class="mini-switch">\n                        </div>\n                    </div>\n                    \n                    <hr style="border: 0; height: 1px; margin:10px 0;background-image: linear-gradient(to right, rgba(0,0,0,0), rgba(159,137,137,0.75), rgba(0,0,0,0));"/>\n\n                    <div class="setting-item">\n                        <span class="setting-label">\n                             <span data-tip="使用瀑布流模式, 排序方式将调整为默认">❓ </span>瀑布流模式:\n                        </span>\n                        <div class="form-content" style="text-align: right;">\n                            <input type="checkbox" id="autoPage" class="mini-switch">\n                        </div>\n                    </div>\n       \n                    <div class="setting-item">\n                        <span class="setting-label">启用标题翻译:</span>\n                        <div class="form-content" style="text-align: right;">\n                            <input type="checkbox" id="translateTitle" class="mini-switch">\n                        </div>\n                    </div>\n                    \n                    <div class="setting-item">\n                        <span class="setting-label">启用悬浮大图:</span>\n                        <div class="form-content" style="text-align: right;">\n                            <input type="checkbox" id="hoverBigImg" class="mini-switch">\n                        </div>\n                    </div>\n                    \n                                        \n                    <div class="setting-item">\n                        <span class="setting-label">启用115视频匹配: </span>\n                        <div class="form-content" style="text-align: right;">\n                            <input type="checkbox" id="enable115Match" class="mini-switch">\n                        </div>\n                    </div>\n                    \n                    <hr style="border: 0; height: 1px; margin:10px 0;background-image: linear-gradient(to right, rgba(0,0,0,0), rgba(159,137,137,0.75), rgba(0,0,0,0));"/>\n\n                    ${isJavDb ? '\n                    <div class="setting-item">\n                        <span class="setting-label">\n                            <span data-tip="详情页是否展示女优年龄、三围等信息">❓ </span>加载女优信息:\n                        </span>\n                        <div class="form-content" style="text-align: right;">\n                            <input type="checkbox" id="enableLoadActressInfo" class="mini-switch">\n                        </div>\n                    </div>' : ""}\n                    \n                    <div class="setting-item">\n                        <span class="setting-label">\n                            <span data-tip="详情页第三方资源检测,如missAv,123AV">❓ </span>加载第三方视频资源:\n                        </span>\n                        <div class="form-content" style="text-align: right;">\n                            <input type="checkbox" id="enableLoadOtherSite" class="mini-switch">\n                        </div>\n                    </div>\n                    \n                    <div class="setting-item">\n                        <span class="setting-label">\n                            <span data-tip="详情页图片区首列位置加载长缩略图">❓ </span>加载长缩略图:\n                        </span>\n                        <div class="form-content" style="text-align: right;">\n                            <input type="checkbox" id="enableLoadScreenShot" class="mini-switch">\n                        </div>\n                    </div>\n                    \n                     <div class="setting-item">\n                        <span class="setting-label">\n                            <span data-tip="详情页解析更多更高画质的预览视频">❓ </span>更高画质预览视频:\n                        </span>\n                        <div class="form-content" style="text-align: right;">\n                            <input type="checkbox" id="enableLoadPreviewVideo" class="mini-switch">\n                        </div>\n                    </div>\n\n                    <hr style="border: 0; height: 1px; margin:10px 0;background-image: linear-gradient(to right, rgba(0,0,0,0), rgba(159,137,137,0.75), rgba(0,0,0,0));"/>\n\n                    <div class="setting-item">\n                        <span class="setting-label">\n                            <span data-tip="列数6以上,建议开启竖图">❓ </span>竖图模式:\n                        </span>\n                        <div class="form-content" style="text-align: right;">\n                            <input type="checkbox" id="enableVerticalModel" class="mini-switch">\n                        </div>\n                    </div>\n                                    \n                    <div class="setting-item">\n                        <span class="setting-label">页面列数: <span id="showContainerColumns"></span></span>\n                        <div class="form-content">\n                            <input type="range" id="containerColumns" min="2" max="10" step="1" style="padding:5px 0">\n                        </div>\n                    </div>\n                    \n                    <div class="setting-item">\n                        <span class="setting-label">页面宽度: <span id="showContainerWidth"></span></span>\n                        <div class="form-content">\n                            <input type="range" id="containerWidth" min="0" max="30" step="1" style="padding:5px 0">\n                        </div>\n                    </div>\n                </div>\n                <div style="padding: 0 20px 15px; text-align: right; border-top: 1px solid #eee;">   \n                    <button id="helpBtn" style="float:left;">常见问题</button>\n                    <button id="moreBtn">更多设置</button>\n                </div>\n            </div>\n        `;
    }
    async loadForm() {
        let settingObj = await storageManager.getSetting();
        $("#videoQuality").val(settingObj.videoQuality);
        $("#reviewCount").val(settingObj.reviewCount || 20);
        $("#tagPosition").val(settingObj.tagPosition || "rightTop");
        $("#movieShowType").val(settingObj.movieShowType || "hide");
        $("#waitCheckCount").val(settingObj.waitCheckCount || 5);
        $("#showWaitCheckBtn").prop("checked", !settingObj.showWaitCheckBtn || settingObj.showWaitCheckBtn === YES);
        $("#showWaitDownBtn").prop("checked", !settingObj.showWaitDownBtn || settingObj.showWaitDownBtn === YES);
        $("#randomOpenWaitDown").prop("checked", !!settingObj.randomOpenWaitDown && settingObj.randomOpenWaitDown === YES);
        $("#checkConcurrencyCount").val(settingObj.checkConcurrencyCount || 2);
        $("#checkRequestSleep").val(settingObj.checkRequestSleep || 100);
        $("#enableCheckBlacklist").val(settingObj.enableCheckBlacklist || YES);
        $("#checkBlacklist_intervalTime").val(settingObj.checkBlacklist_intervalTime || 12);
        $("#checkBlacklist_ruleTime").val(settingObj.checkBlacklist_ruleTime || 8760);
        $("#enableCheckFavoriteActress").val(settingObj.enableCheckFavoriteActress || YES);
        $("#checkFavoriteActress_IntervalTime").val(settingObj.checkFavoriteActress_IntervalTime || 24);
        $("#enableCheckNewVideo").val(settingObj.enableCheckNewVideo || YES);
        $("#checkNewVideo_intervalTime").val(settingObj.checkNewVideo_intervalTime || 12);
        $("#checkNewVideo_ruleTime").val(settingObj.checkNewVideo_ruleTime || 8760);
        const highlightedTagNumber = settingObj.highlightedTagNumber || 1, highlightedTagColor = settingObj.highlightedTagColor || "#ce2222";
        $("#highlightedTagNumber").val(settingObj.highlightedTagNumber || 1);
        $("#highlightedTagColor").val(settingObj.highlightedTagColor || "#ce2222");
        $("#highlightedTagLabel").css("border", `${highlightedTagNumber}px solid ${highlightedTagColor}`);
        $("#enableClog").val(settingObj.enableClog || YES);
        $("#clogMsgCount").val(settingObj.clogMsgCount || 2e3);
        $("#refresh_token").val(settingObj.refresh_token || "");
        $("#httpTimeout").val(settingObj.httpTimeout || 5e3);
        $("#httpRetryCount").val(settingObj.httpRetryCount || 3);
        $("#webDavUrl").val(settingObj.webDavUrl || "");
        $("#webDavUsername").val(settingObj.webDavUsername || "");
        $("#webDavPassword").val(settingObj.webDavPassword || "");
        $("#enableTitleSelectFilter").prop("checked", !settingObj.enableTitleSelectFilter || settingObj.enableTitleSelectFilter === YES);
        $("#enableFavoriteActresses").prop("checked", !settingObj.enableFavoriteActresses || settingObj.enableFavoriteActresses === YES);
        $("#enableSaveActressCarInfo").prop("checked", !!settingObj.enableSaveActressCarInfo && settingObj.enableSaveActressCarInfo === YES);
        $("#enableScreenSvg").prop("checked", !settingObj.enableScreenSvg || settingObj.enableScreenSvg === YES);
        $("#enableVideoSvg").prop("checked", !settingObj.enableVideoSvg || settingObj.enableVideoSvg === YES);
        $("#enableHandleSvg").prop("checked", !settingObj.enableHandleSvg || settingObj.enableHandleSvg === YES);
        $("#enableSiteSvg").prop("checked", !settingObj.enableSiteSvg || settingObj.enableSiteSvg === YES);
        $("#enableCopySvg").prop("checked", !settingObj.enableCopySvg || settingObj.enableCopySvg === YES);
        const otherSitePlugin = this.getBean("OtherSitePlugin"), missAvUrl = await otherSitePlugin.getMissAvUrl(), jableUrl = await otherSitePlugin.getjableUrl(), avgleUrl = await otherSitePlugin.getAvgleUrl(), javTrailersUrl = await otherSitePlugin.getJavTrailersUrl(), av123Url = await otherSitePlugin.getAv123Url(), javDbUrl = await otherSitePlugin.getJavDbUrl(), javBusUrl = await otherSitePlugin.getJavBusUrl(), supJavUrl = await otherSitePlugin.getSupJavUrl();
        $("#missAvUrl").val(missAvUrl);
        $("#jableUrl").val(jableUrl);
        $("#avgleUrl").val(avgleUrl);
        $("#javTrailersUrl").val(javTrailersUrl);
        $("#av123Url").val(av123Url);
        $("#javDbUrl").val(javDbUrl);
        $("#javBusUrl").val(javBusUrl);
        $("#supJavUrl").val(supJavUrl);
        let reviewKeywordList = await storageManager.getReviewFilterKeywordList(), filterKeywordList = await storageManager.getTitleFilterKeyword();
        reviewKeywordList && reviewKeywordList.forEach((reviewKeyword => {
            this.addLabelTag("#reviewKeywordContainer", reviewKeyword);
        }));
        filterKeywordList && filterKeywordList.forEach((reviewKeyword => {
            this.addLabelTag("#filterKeywordContainer", reviewKeyword);
        }));
        [ "#reviewKeywordContainer", "#filterKeywordContainer" ].forEach((containerId => {
            $(`${containerId} .add-tag-btn`).on("click", (event => this.addKeyword(event, containerId)));
            $(`${containerId} .keyword-input`).on("keypress", (event => {
                "Enter" === event.key && this.addKeyword(event, containerId);
            }));
        }));
        $("#hotkey-panel [id]").map(((i, el) => el.id)).get().forEach((containerId => {
            const $element = $(`#${containerId}`), defaultValue = void 0 !== settingObj[containerId] ? settingObj[containerId] : $element.attr("data-default-hotkey") || "";
            $element.val(defaultValue).on("input", (event => {
                let value = $(event.target).val();
                if (/[\u4e00-\u9fa5]/.test(value) || /^Shift[a-zA-Z0-9]+$/.test(value)) {
                    $(event.target).val("");
                    show.error("非法输入：不能输入中文或输入法转换错误");
                }
            })).on("keydown", (event => this.handleHotkeyInput(event, $element)));
        }));
        $("#enableImageHotKey").prop("checked", !!settingObj.enableImageHotKey && settingObj.enableImageHotKey === YES);
    }
    handleHotkeyInput(event, $input) {
        event.preventDefault();
        const hotkey = this.parseHotkey(event);
        "" !== hotkey ? this.isDuplicateHotkey(hotkey, $input.attr("id")) ? show.error("该快捷键已被其他功能使用！") : $input.val(hotkey) : $input.val("");
    }
    parseHotkey(event) {
        if ("Backspace" === event.key || "Process" === event.key) return "";
        const keys = [];
        event.ctrlKey && keys.push("Ctrl");
        event.shiftKey && keys.push("Shift");
        event.altKey && keys.push("Alt");
        event.metaKey && keys.push("Cmd");
        const key = {
            " ": "Space",
            Control: "Ctrl",
            Meta: "Cmd",
            ArrowUp: "Up",
            ArrowDown: "Down",
            ArrowLeft: "Left",
            ArrowRight: "Right"
        }[event.key] || (event.key.length > 1 ? event.key.replace("Arrow", "") : event.key);
        [ "Control", "Shift", "Alt", "Meta" ].includes(event.key) || keys.push(key);
        return keys.length > 0 ? keys.join("+") : "";
    }
    isDuplicateHotkey(hotkey, currentInputId) {
        let isDuplicate = !1;
        $("#hotkey-panel [id]").each(((i, el) => {
            if (el.id !== currentInputId && hotkey && hotkey === $(el).val()) {
                isDuplicate = !0;
                return !1;
            }
        }));
        return isDuplicate;
    }
    async initSimpleSettingForm() {
        let settingObj = await storageManager.getSetting();
        $("#containerColumns").val(settingObj.containerColumns || 5);
        $("#showContainerColumns").text(settingObj.containerColumns || 5);
        $("#containerWidth").val((settingObj.containerWidth || 100) - 70);
        $("#showContainerWidth").text((settingObj.containerWidth || 100) + "%");
        $("#dialogOpenDetail").prop("checked", !settingObj.dialogOpenDetail || settingObj.dialogOpenDetail === YES);
        $("#needClosePage").prop("checked", !settingObj.needClosePage || settingObj.needClosePage === YES);
        $("#autoPage").prop("checked", !settingObj.autoPage || settingObj.autoPage === YES);
        $("#translateTitle").prop("checked", !settingObj.translateTitle || settingObj.translateTitle === YES);
        $("#enableLoadActressInfo").prop("checked", !settingObj.enableLoadActressInfo || settingObj.enableLoadActressInfo === YES);
        $("#enableLoadOtherSite").prop("checked", !settingObj.enableLoadOtherSite || settingObj.enableLoadOtherSite === YES);
        $("#containerColumns").on("input", (async event => {
            let columns = $("#containerColumns").val();
            $("#showContainerColumns").text(columns);
            if (isJavDb) {
                document.querySelector(".movie-list").style.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
            }
            if (isJavBus) {
                document.querySelector(".masonry").style.gridTemplateColumns = `repeat(${columns}, minmax(0, 1fr))`;
            }
            await storageManager.saveSettingItem("containerColumns", columns);
            this.applyImageMode();
        }));
        $("#containerWidth").on("input", (async event => {
            let containerWidth = parseInt($(event.target).val());
            const value = containerWidth + 70 + "%";
            $("#showContainerWidth").text(value);
            if (isJavDb) {
                document.querySelector("section .container").style.minWidth = value;
            }
            if (isJavBus) {
                document.querySelector(".container-fluid .row").style.minWidth = value;
            }
            storageManager.saveSettingItem("containerWidth", containerWidth + 70);
        }));
        $("#dialogOpenDetail").on("change", (event => {
            let dialogOpenDetail = $("#dialogOpenDetail").is(":checked") ? YES : NO;
            storageManager.saveSettingItem("dialogOpenDetail", dialogOpenDetail);
        }));
        $("#showFilterItem").prop("checked", !!settingObj.showFilterItem && settingObj.showFilterItem === YES);
        $("#showFilterActorItem").prop("checked", !!settingObj.showFilterActorItem && settingObj.showFilterActorItem === YES);
        $("#showFilterKeywordItem").prop("checked", !!settingObj.showFilterKeywordItem && settingObj.showFilterKeywordItem === YES);
        $("#showFavoriteItem").prop("checked", !settingObj.showFavoriteItem || settingObj.showFavoriteItem === YES);
        $("#showHasDownItem").prop("checked", !settingObj.showHasDownItem || settingObj.showHasDownItem === YES);
        $("#showHasWatchItem").prop("checked", !settingObj.showHasWatchItem || settingObj.showHasWatchItem === YES);
        $("#showFilterItem").on("change", (async event => {
            let showFilterItem = $("#showFilterItem").is(":checked") ? YES : NO;
            await storageManager.saveSettingItem("showFilterItem", showFilterItem);
            window.refresh();
        }));
        $("#showFilterActorItem").on("change", (async event => {
            let showFilterActorItem = $("#showFilterActorItem").is(":checked") ? YES : NO;
            await storageManager.saveSettingItem("showFilterActorItem", showFilterActorItem);
            window.refresh();
        }));
        $("#showFilterKeywordItem").on("change", (async event => {
            let showFilterKeywordItem = $("#showFilterKeywordItem").is(":checked") ? YES : NO;
            await storageManager.saveSettingItem("showFilterKeywordItem", showFilterKeywordItem);
            window.refresh();
        }));
        $("#showFavoriteItem").on("change", (async event => {
            let showFavoriteItem = $("#showFavoriteItem").is(":checked") ? YES : NO;
            await storageManager.saveSettingItem("showFavoriteItem", showFavoriteItem);
            window.refresh();
        }));
        $("#showHasDownItem").on("change", (async event => {
            let showHasDownItem = $("#showHasDownItem").is(":checked") ? YES : NO;
            await storageManager.saveSettingItem("showHasDownItem", showHasDownItem);
            window.refresh();
        }));
        $("#showHasWatchItem").on("change", (async event => {
            let showHasWatchItem = $("#showHasWatchItem").is(":checked") ? YES : NO;
            await storageManager.saveSettingItem("showHasWatchItem", showHasWatchItem);
            window.refresh();
        }));
        const $otherCheckboxes = $("#showFilterItem, #showFilterActorItem, #showFilterKeywordItem, #showFavoriteItem, #showHasDownItem, #showHasWatchItem"), updateOtherCheckboxesState = () => {
            const isShowAllChecked = $("#showAllItem").is(":checked");
            $otherCheckboxes.prop("disabled", isShowAllChecked);
            isShowAllChecked ? $otherCheckboxes.attr("data-tip", "请先关闭显示所有才可点击") : $otherCheckboxes.removeAttr("data-tip");
        };
        $("#showAllItem").prop("checked", !!settingObj.showAllItem && settingObj.showAllItem === YES);
        $("#showAllItem").on("change", (async event => {
            let showAllItem = $("#showAllItem").is(":checked") ? YES : NO;
            await storageManager.saveSettingItem("showAllItem", showAllItem);
            updateOtherCheckboxesState();
            window.refresh();
        }));
        updateOtherCheckboxesState();
        $("#needClosePage").on("change", (async event => {
            await storageManager.saveSettingItem("needClosePage", $("#needClosePage").is(":checked") ? YES : NO);
            window.refresh();
        }));
        $("#autoPage").on("change", (async event => {
            const autoPage = $("#autoPage").is(":checked") ? YES : NO;
            await storageManager.saveSettingItem("autoPage", autoPage);
            autoPage === YES ? $("#sort-toggle-btn").hide() : $("#sort-toggle-btn").show();
        }));
        $("#translateTitle").on("change", (async event => {
            const translateTitle = $("#translateTitle").is(":checked") ? YES : NO;
            await storageManager.saveSettingItem("translateTitle", translateTitle);
            if (translateTitle === YES) {
                await this.getBean("ListPagePlugin").doFilter();
                window.isDetailPage && await this.getBean("TranslatePlugin").translate();
            } else {
                await this.getBean("ListPagePlugin").revertTranslation();
                $(".translated-title").remove();
            }
        }));
        $("#hoverBigImg").prop("checked", !!settingObj.hoverBigImg && settingObj.hoverBigImg === YES);
        $("#hoverBigImg").on("change", (async event => {
            const hoverBigImg = $("#hoverBigImg").is(":checked") ? YES : NO;
            await storageManager.saveSettingItem("hoverBigImg", hoverBigImg);
            hoverBigImg === YES ? window.imageHoverPreviewObj = new ImageHoverPreview({
                selector: this.getSelector().coverImgSelector
            }) : window.imageHoverPreviewObj && window.imageHoverPreviewObj.destroy();
        }));
        $("#enableLoadActressInfo").on("change", (async event => {
            const enableLoadActressInfo = $("#enableLoadActressInfo").is(":checked") ? YES : NO;
            await storageManager.saveSettingItem("enableLoadActressInfo", enableLoadActressInfo);
            enableLoadActressInfo === YES ? this.getBean("ActressInfoPlugin").loadActressInfo() : $(".actress-info").remove();
        }));
        $("#enableLoadOtherSite").on("change", (async event => {
            const enableLoadOtherSite = $("#enableLoadOtherSite").is(":checked") ? YES : NO;
            await storageManager.saveSettingItem("enableLoadOtherSite", enableLoadOtherSite);
            enableLoadOtherSite === YES ? this.getBean("OtherSitePlugin").loadOtherSite().then() : $("#otherSiteBox").remove();
        }));
        $("#enableLoadScreenShot").prop("checked", !settingObj.enableLoadScreenShot || settingObj.enableLoadScreenShot === YES);
        $("#enableLoadScreenShot").on("change", (async event => {
            const enableLoadScreenShot = $("#enableLoadScreenShot").is(":checked") ? YES : NO;
            await storageManager.saveSettingItem("enableLoadScreenShot", enableLoadScreenShot);
            enableLoadScreenShot === YES ? this.getBean("ScreenShotPlugin").loadScreenShot().then() : $(".screen-container").remove();
        }));
        $("#enableLoadPreviewVideo").prop("checked", !settingObj.enableLoadPreviewVideo || settingObj.enableLoadPreviewVideo === YES);
        $("#enableLoadPreviewVideo").on("change", (async event => {
            const enableLoadPreviewVideo = $("#enableLoadPreviewVideo").is(":checked") ? YES : NO;
            await storageManager.saveSettingItem("enableLoadPreviewVideo", enableLoadPreviewVideo);
        }));
        $("#enable115Match").prop("checked", !!settingObj.enable115Match && settingObj.enable115Match === YES);
        $("#enable115Match").on("change", (async event => {
            const enable115Match = $("#enable115Match").is(":checked") ? YES : NO;
            await storageManager.saveSettingItem("enable115Match", enable115Match);
            let movieList = $(this.getSelector().itemSelector).toArray();
            await this.getBean("WangPan115MatchPlugin").matchMovieList(movieList);
        }));
        $("#enableVerticalModel").prop("checked", !!settingObj.enableVerticalModel && settingObj.enableVerticalModel === YES);
        $("#enableVerticalModel").on("change", (async event => {
            const enableVerticalModel = $("#enableVerticalModel").is(":checked") ? YES : NO;
            await storageManager.saveSettingItem("enableVerticalModel", enableVerticalModel);
            this.applyImageMode();
        }));
        $("#moreBtn").on("click", (() => {
            $(".simple-setting").html("").hide();
            this.openSettingDialog("base-panel");
        }));
        $("#helpBtn").on("click", (() => {
            layer.open({
                type: 1,
                title: "",
                shadeClose: !0,
                scrollbar: !1,
                content: '\n<style>\n    .help-container {\n        font-family: \'Segoe UI\', Tahoma, Geneva, Verdana, sans-serif;\n        color: #333;\n        padding: 15px;\n        max-height: 100%;\n        overflow-y: auto;\n    }\n    \n    .help-section {\n        margin-bottom: 25px;\n    }\n    \n    .help-section summary {\n        font-size: 18px;\n        color: #3498db;\n        margin-bottom: 12px;\n        cursor: pointer;\n    }\n    \n    .help-content {\n        background-color: #f9f9f9;\n        border-radius: 5px;\n        padding: 15px;\n        border-left: 4px solid #3498db;\n    }\n    \n    .help-content p {\n        line-height: 1.6;\n        margin-bottom: 10px;\n    }\n    .help-section img {\n        max-width: 100%;\n        height: auto;\n        border: 1px solid #ddd;\n        border-radius: 4px;\n        box-shadow: 0 2px 4px rgba(0,0,0,0.1);\n    }\n\n</style>\n\n<div class="help-container">\n    <h1 style="font-size: 22px; margin-bottom: 20px; color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 10px;">使用说明</h1>\n    \n    <details class="help-section">\n        <summary>1. 无法查看预览视频，提示分流?</summary>\n        <div class="help-content">\n            <p>JavDB限制日本IP的访问，而预览视频来自DMM，需要日本IP才能访问。</p>\n            <p>这样会导致二者无法同时使用，需要对其一进行代理转发。</p>\n            <p>将 cc3001.dmm.co.jp 及 dmm.co 分流到日本ip。</p>\n            <p><a href="https://youtu.be/wQUK8z_YeU4?t=121" target="_blank">Clash Verge分流规则设置 </a> (如果你是别的代理软件，自行搜索如何分流)</p>\n        </div>\n    </details>\n    \n    <details class="help-section">\n        <summary>2. 如何屏蔽某一系列的番号?</summary>\n        <div class="help-content">\n            <p>方法一：设置中-添加视频标题关键词，如: VENX-</p>\n            <p>方法二：进入详情页，选中标题文字，右键可加入</p>\n            <img src="https://i.imgur.com/lVnhK5A.png" alt="进入详情页，选中标题，进行右键"/>\n        </div>\n    </details>\n\n    <details class="help-section">\n        <summary>3. 屏蔽某演员，如何只屏蔽单体影片?</summary>\n        <div class="help-content">\n            <p>屏蔽演员前，先筛选分类，再点屏蔽</p>\n            <img src="https://imgur.com/Ue7eCAi.png" alt="屏蔽演员前，先筛选分类，再点屏蔽"/>\n        </div>\n    </details>\n    \n    <details class="help-section">\n        <summary>4. 如何多浏览器同时登录115网盘?</summary>\n        <div class="help-content">\n            <p>① 访问115登录页, 选择JHS-扫码面板, 并扫码登录</p>\n            <img src="https://imgur.com/XbaisWD.png" alt=""/>\n        </div>\n        <div class="help-content">\n            <p>② 进入网盘后, 右下角悬浮按钮, 复制Cookie</p>\n            <img src="https://imgur.com/GvzJ2Gy.png" alt=""/>\n        </div>\n        <div class="help-content">\n            <p>③ 打开另一个浏览器(需装JHS脚本), 进入登录页面, 选择JHS-扫码面板, 输入Cookie并回车</p>\n            <img src="https://imgur.com/FX08qdO.png" alt=""/>\n        </div>\n    </details>\n</div>\n',
                area: utils.getResponsiveArea([ "50%", "90%" ])
            });
        }));
    }
    async applyImageMode() {
        $("#verticalImgStyle").remove();
        if (await storageManager.getSetting("enableVerticalModel", NO) === YES) {
            let imgPosition = "100% 50% !important";
            window.location.href.includes("/advanced_search?type=100") && (imgPosition = "50% 50% !important");
            const verticalStyle = `\n                .cover {\n                    min-height: 350px !important;\n                    overflow: hidden !important;\n                    padding-top: 142% !important;\n                }\n                \n                .cover img {\n                    object-fit: cover !important;\n                    object-position: ${imgPosition};\n                }\n                \n                /* bus的 */\n                .masonry .movie-box img {\n                    min-height: 500px !important;\n                    object-fit: cover !important;\n                    object-position: top right;\n                }\n            `;
            $("<style>").attr("id", "verticalImgStyle").text(verticalStyle).appendTo("head");
        } else {
            const horizontalStyle = "\n                .cover {\n                    min-height:auto !important;\n                    padding-top: 67% !important;\n                }\n                .cover img {\n                    object-fit: contain !important;\n                    object-position: 50% 50% !important\n                }\n                \n                /* bus的 */\n                 .masonry .movie-box img {\n                    min-height:auto !important;\n                    object-fit: contain !important;\n                    object-position: top;\n                }\n            ";
            $("<style>").attr("id", "verticalImgStyle").text(horizontalStyle).appendTo("head");
        }
        isJavBus && this.getBean("BusImgPlugin").logImageHeightsByRow();
    }
    bindClick() {
        $(".side-menu-item").on("click", (function() {
            $(".side-menu-item").removeClass("active");
            $(this).addClass("active");
            $(".content-panel").hide();
            const panelId = $(this).data("panel");
            $("#" + panelId).show();
            if ("cache-panel" === panelId) {
                $("#saveBtn").hide();
                $("#clean-all").show();
            } else {
                $("#saveBtn").show();
                $("#clean-all").hide();
            }
        }));
        $("#importBtn").on("click", (event => this.importData(event)));
        $("#exportBtn").on("click", (event => this.exportData(event)));
        $("#backupBtn").on("click", (event => this.backupData(event)));
        $("#backupListBtn").on("click", (event => this.backupListBtn(event)));
        $("#webdavBackupBtn").on("click", (event => this.backupDataByWebDav(event)));
        $("#webdavBackupListBtn").on("click", (event => this.backupListBtnByWebDav(event)));
        $("#getRefreshTokenBtn").on("click", (event => layer.alert("即将跳转阿里云盘, 请登录后, 点击最右侧悬浮按钮获取refresh_token", {
            yes: function(index, layero, that) {
                window.open("https://www.aliyundrive.com/drive/home");
                layer.close(index);
            }
        })));
        $("#saveBtn").on("click", (() => this.saveForm()));
        $(".clean-btn").on("click", (event => {
            const key = $(event.currentTarget).data("key"), cacheItem = this.cacheItems.find((item => item.key === key));
            localStorage.removeItem(key);
            show.ok(`${cacheItem.text} 清理成功`);
            $("#cache-data-display").hide();
            "jhs_dmm_video" === key && localStorage.removeItem("jhs_other_site_dmm");
        }));
        $("#clean-all").on("click", (() => {
            this.cacheItems.forEach((item => localStorage.removeItem(item.key)));
            show.ok("全部缓存已清理");
            $("#cache-data-display").hide();
            localStorage.removeItem("jhs_other_site_dmm");
        }));
        $(".view-btn").on("click", (event => {
            const key = $(event.currentTarget).data("key"), data = localStorage.getItem(key), displayDiv = $("#cache-data-display"), pre = displayDiv.find("pre");
            displayDiv.show();
            if (data) try {
                const parsedData = JSON.parse(data);
                pre.text(JSON.stringify(parsedData, null, 2));
            } catch {
                pre.text(data);
            } else pre.text("无数据");
        }));
        const $widthInput = $("#highlightedTagNumber"), $colorPicker = $("#highlightedTagColor"), $previewBox = $("#highlightedTagLabel");
        function updateBorder() {
            const currentWidth = $widthInput.val(), currentColor = $colorPicker.val();
            $previewBox.css("border", `${currentWidth}px solid ${currentColor}`);
        }
        $widthInput.on("input", updateBorder);
        $colorPicker.on("input", updateBorder);
    }
    async saveForm() {
        let settingObj = await storageManager.getSetting();
        settingObj.videoQuality = $("#videoQuality").val();
        settingObj.reviewCount = $("#reviewCount").val();
        settingObj.tagPosition = $("#tagPosition").val();
        settingObj.movieShowType = $("#movieShowType").val();
        settingObj.waitCheckCount = $("#waitCheckCount").val();
        settingObj.refresh_token = $("#refresh_token").val();
        settingObj.highlightedTagNumber = $("#highlightedTagNumber").val();
        settingObj.highlightedTagColor = $("#highlightedTagColor").val();
        settingObj.showWaitCheckBtn = $("#showWaitCheckBtn").is(":checked") ? YES : NO;
        settingObj.showWaitCheckBtn === YES ? $("#waitCheckBtn").show() : $("#waitCheckBtn").hide();
        settingObj.showWaitDownBtn = $("#showWaitDownBtn").is(":checked") ? YES : NO;
        settingObj.showWaitDownBtn === YES ? $("#waitDownBtn").show() : $("#waitDownBtn").hide();
        settingObj.randomOpenWaitDown = $("#randomOpenWaitDown").is(":checked") ? YES : NO;
        settingObj.checkConcurrencyCount = $("#checkConcurrencyCount").val();
        settingObj.checkRequestSleep = $("#checkRequestSleep").val();
        settingObj.enableCheckBlacklist = $("#enableCheckBlacklist").val();
        settingObj.checkBlacklist_intervalTime = $("#checkBlacklist_intervalTime").val();
        settingObj.checkBlacklist_ruleTime = $("#checkBlacklist_ruleTime").val();
        settingObj.enableCheckFavoriteActress = $("#enableCheckFavoriteActress").val();
        settingObj.checkFavoriteActress_IntervalTime = $("#checkFavoriteActress_IntervalTime").val();
        settingObj.enableCheckNewVideo = $("#enableCheckNewVideo").val();
        settingObj.checkNewVideo_intervalTime = $("#checkNewVideo_intervalTime").val();
        settingObj.checkNewVideo_ruleTime = $("#checkNewVideo_ruleTime").val();
        settingObj.httpTimeout = $("#httpTimeout").val();
        settingObj.httpRetryCount = $("#httpRetryCount").val();
        settingObj.enableClog = $("#enableClog").val();
        settingObj.enableClog === YES ? clog.show() : clog.hide();
        settingObj.clogMsgCount = $("#clogMsgCount").val();
        settingObj.webDavUrl = $("#webDavUrl").val();
        settingObj.webDavUsername = $("#webDavUsername").val();
        settingObj.webDavPassword = $("#webDavPassword").val();
        settingObj.missAvUrl = $("#missAvUrl").val().replace(/\/$/, "");
        settingObj.jableUrl = $("#jableUrl").val().replace(/\/$/, "");
        settingObj.avgleUrl = $("#avgleUrl").val().replace(/\/$/, "");
        settingObj.javTrailersUrl = $("#javTrailersUrl").val().replace(/\/$/, "");
        settingObj.av123Url = $("#av123Url").val().replace(/\/$/, "");
        settingObj.javDbUrl = $("#javDbUrl").val().replace(/\/$/, "");
        settingObj.javBusUrl = $("#javBusUrl").val().replace(/\/$/, "");
        settingObj.supJavUrl = $("#supJavUrl").val().replace(/\/$/, "");
        settingObj.enableTitleSelectFilter = $("#enableTitleSelectFilter").is(":checked") ? YES : NO;
        settingObj.enableFavoriteActresses = $("#enableFavoriteActresses").is(":checked") ? YES : NO;
        settingObj.enableSaveActressCarInfo = $("#enableSaveActressCarInfo").is(":checked") ? YES : NO;
        settingObj.enableScreenSvg = $("#enableScreenSvg").is(":checked") ? YES : NO;
        settingObj.enableVideoSvg = $("#enableVideoSvg").is(":checked") ? YES : NO;
        settingObj.enableHandleSvg = $("#enableHandleSvg").is(":checked") ? YES : NO;
        settingObj.enableSiteSvg = $("#enableSiteSvg").is(":checked") ? YES : NO;
        settingObj.enableCopySvg = $("#enableCopySvg").is(":checked") ? YES : NO;
        $("#hotkey-panel [id]").map(((i, el) => el.id)).get().forEach((containerId => {
            settingObj[containerId] = $(`#${containerId}`).val();
        }));
        settingObj.enableImageHotKey = $("#enableImageHotKey").is(":checked") ? YES : NO;
        await storageManager.saveSetting(settingObj);
        let reviewKeywordList = [];
        $("#reviewKeywordContainer .keyword-label").toArray().forEach((item => {
            let keyword = $(item).text().replace("×", "").replace(/[\r\n]+/g, " ").replace(/\s{2,}/g, " ").trim();
            reviewKeywordList.push(keyword);
        }));
        await storageManager.saveReviewFilterKeyword(reviewKeywordList);
        let filterKeywordList = [];
        $("#filterKeywordContainer .keyword-label").toArray().forEach((item => {
            let keyword = $(item).text().replace("×", "").replace(/[\r\n]+/g, " ").replace(/\s{2,}/g, " ").trim();
            filterKeywordList.push(keyword);
        }));
        await storageManager.saveTitleFilterKeyword(filterKeywordList);
        show.ok("保存成功");
        window.refresh();
        const newVideoPlugin = this.getBean("NewVideoPlugin");
        newVideoPlugin && newVideoPlugin.resetBtnTip();
        this.getBean("BlacklistPlugin").resetBtnTip();
        this.getBean("BlacklistPlugin").reloadTable();
    }
    addLabelTag(containerId, keyword) {
        const $tagBox = $(`${containerId} .tag-box`);
        let $label, color = "#333";
        if (/^[a-z]{2,}-/i.test(keyword) && isJavDb) {
            color = "#3477ad";
            $label = $(`\n                <a class="keyword-label" data-keyword="${keyword}" style="background-color: #cbd5e1; color: ${color}" href="/video_codes/${keyword.replace("-", "")}" target="_blank">\n                    ${keyword}\n                    <span class="keyword-remove">×</span>\n                </a>\n            `);
        } else $label = $(`\n                <div class="keyword-label" data-keyword="${keyword}" style="background-color: #cbd5e1; color: ${color}">\n                    ${keyword}\n                    <span class="keyword-remove">×</span>\n                </div>\n            `);
        $label.find(".keyword-remove").click((event => {
            event.stopPropagation();
            event.preventDefault();
            const $targetEl = $(event.currentTarget);
            const dataKeyword = $targetEl.closest(".keyword-label").attr("data-keyword").split(" ")[0];
            utils.q(event, `是否移除屏蔽词  ${dataKeyword}?`, (async () => {
                $targetEl.parent().remove();
            }));
        }));
        $tagBox.append($label);
    }
    addKeyword(event, containerId) {
        let $keywordInput = $(`${containerId} .keyword-input`);
        const keyword = $keywordInput.val().trim();
        if (keyword) {
            this.addLabelTag(containerId, keyword);
            $keywordInput.val("");
        }
    }
    importData() {
        try {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = ".json";
            input.onchange = e => {
                const file = e.target.files[0];
                if (!file) return;
                const reader = new FileReader;
                reader.onload = event => {
                    try {
                        const content = event.target.result.toString(), updateJsonData = JSON.parse(content);
                        layer.confirm("确定是否要覆盖导入？", {
                            icon: 3,
                            title: "确认覆盖",
                            btn: [ "确定", "取消" ]
                        }, (async function(index) {
                            await storageManager.importData(updateJsonData);
                            show.ok("数据导入成功");
                            layer.close(index);
                            location.reload();
                        }));
                    } catch (err) {
                        console.error(err);
                        show.error("导入失败：文件内容不是有效的JSON格式 " + err);
                    }
                };
                reader.onerror = () => {
                    show.error("读取文件时出错");
                };
                reader.readAsText(file);
            };
            document.body.appendChild(input);
            input.click();
            setTimeout((() => document.body.removeChild(input)), 1e3);
        } catch (err) {
            console.error(err);
            show.error("导入数据时出错: " + err.message);
        }
    }
    async backupData(event) {
        let loadObj = loading();
        try {
            const refresh_token = await storageManager.getSetting("refresh_token");
            if (!refresh_token) {
                show.error("请填写refresh_token并保存后, 再试此功能");
                return;
            }
            show.info("正在整理数据...");
            let fileName = utils.getNowStr("_", "_") + ".json", uploadContent = JSON.stringify(await storageManager.exportData());
            uploadContent = simpleEncrypt(uploadContent);
            const aliyunApi = new AliyunApi(refresh_token);
            await aliyunApi.backup(this.folderName, fileName, uploadContent);
            show.ok("备份完成");
        } catch (e) {
            console.error(e);
            show.error(e.toString());
        } finally {
            loadObj.close();
        }
    }
    async backupListBtn(event) {
        const refresh_token = await storageManager.getSetting("refresh_token");
        if (!refresh_token) {
            show.error("请填写refresh_token并保存后, 再试此功能");
            return;
        }
        let loadObj = loading();
        try {
            const aliyunApi = new AliyunApi(refresh_token), fileList = await aliyunApi.getBackupList(this.folderName);
            this.openFileListDialog(fileList, aliyunApi, "阿里云盘");
        } catch (e) {
            console.error(e);
            show.error(`发生错误: ${e ? e.message : e}`);
        } finally {
            loadObj.close();
        }
    }
    async backupDataByWebDav(event) {
        const settingObj = await storageManager.getSetting(), webDavUrl = settingObj.webDavUrl;
        if (!webDavUrl) {
            show.error("请填写webDav服务地址并保存后, 再试此功能");
            return;
        }
        const webDavUsername = settingObj.webDavUsername;
        if (!webDavUsername) {
            show.error("请填写webDav用户名并保存后, 再试此功能");
            return;
        }
        const webDavPassword = settingObj.webDavPassword;
        if (!webDavPassword) {
            show.error("请填写webDav密码并保存后, 再试此功能");
            return;
        }
        let fileName = utils.getNowStr("_", "_") + ".json", uploadContent = JSON.stringify(await storageManager.exportData());
        uploadContent = simpleEncrypt(uploadContent);
        let loadObj = loading();
        try {
            const webDavApi = new WebDavApi(webDavUrl, webDavUsername, webDavPassword);
            await webDavApi.backup(this.folderName, fileName, uploadContent);
            show.ok("备份完成");
        } catch (e) {
            console.error(e);
            show.error(e.toString());
        } finally {
            loadObj.close();
        }
    }
    async backupListBtnByWebDav(event) {
        const settingObj = await storageManager.getSetting(), webDavUrl = settingObj.webDavUrl;
        if (!webDavUrl) {
            show.error("请填写webDav服务地址并保存后, 再试此功能");
            return;
        }
        const webDavUsername = settingObj.webDavUsername;
        if (!webDavUsername) {
            show.error("请填写webDav用户名并保存后, 再试此功能");
            return;
        }
        const webDavPassword = settingObj.webDavPassword;
        if (!webDavPassword) {
            show.error("请填写webDav密码并保存后, 再试此功能");
            return;
        }
        let loadObj = loading();
        try {
            const webDavApi = new WebDavApi(webDavUrl, webDavUsername, webDavPassword), fileList = await webDavApi.getBackupList(this.folderName);
            this.openFileListDialog(fileList, webDavApi, "WebDav");
        } catch (e) {
            console.error(e);
            show.error(`发生错误: ${e ? e.message : e}`);
        } finally {
            loadObj.close();
        }
    }
    openFileListDialog(fileList, api, apiType) {
        layer.open({
            type: 1,
            title: apiType + "备份文件",
            content: '\n                <div style="height: 100%;overflow:hidden;"> \n                    <div id="table-container" style="height: calc(100%);"></div>\n                </div>\n            ',
            area: [ "800px", "70%" ],
            anim: -1,
            success: layero => {
                const tableObj = new Tabulator("#table-container", {
                    layout: "fitColumns",
                    placeholder: "暂无数据",
                    virtualDom: !0,
                    data: fileList,
                    responsiveLayout: "collapse",
                    responsiveLayoutCollapse: !0,
                    columnDefaults: {
                        headerHozAlign: "center",
                        hozAlign: "center"
                    },
                    columns: [ {
                        title: "文件名",
                        field: "name",
                        width: 200,
                        headerSort: !1,
                        responsive: 0
                    }, {
                        title: "文件大小",
                        field: "size",
                        responsive: 1,
                        headerSort: !1,
                        formatter: (cell, formatterParams, onRendered) => {
                            const units = [ "B", "KB", "MB", "GB", "TB", "PB" ];
                            let unitIndex = 0, adjustedSize = cell.getData().size;
                            for (;adjustedSize >= 1024 && unitIndex < units.length - 1; ) {
                                adjustedSize /= 1024;
                                unitIndex++;
                            }
                            return `${adjustedSize % 1 == 0 ? adjustedSize.toFixed(0) : adjustedSize.toFixed(2)} ${units[unitIndex]}`;
                        }
                    }, {
                        title: "备份日期",
                        field: "createTime",
                        responsive: 2,
                        headerSort: !1,
                        formatter: (cell, formatterParams, onRendered) => {
                            const item = cell.getData();
                            return `${utils.getNowStr("-", ":", item.createTime)}`;
                        }
                    }, {
                        title: "操作",
                        minWidth: 250,
                        responsive: 0,
                        headerSort: !1,
                        formatter: (cell, formatterParams, onRendered) => {
                            const item = cell.getData();
                            onRendered((() => {
                                const deleteButton = cell.getElement().querySelector(".a-danger"), downButton = cell.getElement().querySelector(".a-primary"), importButton = cell.getElement().querySelector(".a-success");
                                deleteButton && deleteButton.addEventListener("click", (e => {
                                    utils.q(e, `是否删除 ${item.name} ?`, (async index => {
                                        let loadObj = loading();
                                        try {
                                            await api.deleteFile(item.fileId);
                                            let newFileList = await api.getBackupList(this.folderName);
                                            tableObj.replaceData(newFileList);
                                            "阿里云盘" === apiType ? utils.alert(e, "已移至回收站, 请到阿里云盘回收站二次删除") : utils.alert(e, "删除成功");
                                        } catch (e2) {
                                            console.error(e2);
                                            show.error(`发生错误: ${e2 ? e2.message : e2}`);
                                        } finally {
                                            loadObj.close();
                                        }
                                    }));
                                }));
                                downButton && downButton.addEventListener("click", (async e => {
                                    let loadObj = loading();
                                    try {
                                        if ("阿里云盘" === apiType) {
                                            show.info("获取下载地址...");
                                            const url = await api.getDownloadUrl(item.fileId);
                                            show.info("获取文件内容...");
                                            let content = simpleDecrypt(await gmHttp.downloadFileInChunks(url, {
                                                Referer: "https://www.aliyundrive.com/"
                                            }));
                                            utils.download(content, item.name);
                                        } else {
                                            const content = simpleDecrypt(await api.getFileContent(item.fileId));
                                            utils.download(content, item.name);
                                        }
                                    } catch (e2) {
                                        clog.error(e2);
                                        show.error("下载失败: " + e2);
                                    } finally {
                                        loadObj.close();
                                    }
                                }));
                                importButton && importButton.addEventListener("click", (async e => {
                                    layer.confirm(`是否将该云备份数据 ${item.name} 导入?`, {
                                        icon: 3,
                                        title: "提示",
                                        btn: [ "确定", "取消" ]
                                    }, (async index => {
                                        layer.close(index);
                                        let loadObj = loading();
                                        try {
                                            let respData;
                                            if ("阿里云盘" === apiType) {
                                                show.info("获取下载地址...");
                                                const downUrl = await api.getDownloadUrl(item.fileId);
                                                show.info("获取文件内容...");
                                                respData = await gmHttp.downloadFileInChunks(downUrl, {
                                                    Referer: "https://www.aliyundrive.com/"
                                                });
                                            } else respData = await api.getFileContent(item.fileId);
                                            show.info("解密文件内容...");
                                            const content = simpleDecrypt(respData);
                                            show.info("解密完成, 开始导入...");
                                            const updateJsonData = JSON.parse(content);
                                            await storageManager.importData(updateJsonData);
                                            show.ok("导入成功!");
                                            window.location.reload();
                                        } catch (err) {
                                            console.error(err);
                                            show.error(err);
                                        } finally {
                                            loadObj.close();
                                        }
                                    }));
                                }));
                            }));
                            return '\n                                    <a class="a-danger">删除</a>\n                                    <a class="a-primary">下载</a>\n                                    <a class="a-success">导入</a>\n                                ';
                        }
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
        });
    }
    async exportData(event) {
        try {
            const backupData = JSON.stringify(await storageManager.exportData()), fileName = `${utils.getNowStr("_", "_")}.json`;
            utils.download(backupData, fileName);
            show.ok("数据导出成功");
        } catch (err) {
            console.error(err);
            show.error("导出数据时出错: " + err.message);
        }
    }
}


export { SettingPlugin };
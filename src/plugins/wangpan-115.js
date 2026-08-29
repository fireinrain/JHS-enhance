import { BasePlugin } from '../core/base-plugin.js';
import { __publicField, isJavBus, isJavDb, currentHref, NO } from '../core/constants.js';
import { searchFiles } from './wangpan-115-task.js';

class WangPan115Plugin extends BasePlugin {
    constructor() {
        super(...arguments);
        __publicField(this, "JHS_115_COOKIE", "jhs_115_cookie");
        __publicField(this, "JHS_115_MAX_AGE", "jhs_115_max_age");
    }
    getName() {
        return "WangPan115Plugin";
    }
    async initCss() {
        return "\n            <style>\n                .login-box .ltab-office {\n                    border: 1px solid #DEE4EE;\n                }\n                \n                .change-bg::before {\n                    background-color:#F9FAFB !important;\n                }\n                \n                .site-login-wrap {\n                    height: auto;\n                }\n                \n                #jhs-cookie-panel {\n                    width: 200px;\n                    position: fixed;\n                    bottom: 20px;\n                    right: 20px;\n                    z-index: 10000;\n                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;\n                    cursor: pointer;\n                    background-color: #FFFFFF;\n                    color: #333333;\n                    padding: 0;\n                    border-radius: 6px;\n                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);\n                    transition: all 0.3s ease;\n                    border: 1px solid #E0E0E0;\n                }\n    \n                #jhs-cookie-panel.expanded {\n                    padding: 0;\n                    border-radius: 8px;\n                    background-color: #FFFFFF;\n                    color: #333333;\n                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);\n                }\n    \n                #jhs-cookie-header {\n                    padding: 10px 15px;\n                    background-color: #0078D4;\n                    color: white;\n                    border-radius: 6px 6px 0 0;\n                    display: flex;\n                    justify-content: space-between;\n                    align-items: center;\n                    font-weight: 600;\n                }\n                \n                #jhs-cookie-panel:not(.expanded) #jhs-cookie-header {\n                    border-radius: 6px;\n                    padding: 8px 15px;\n                }\n    \n                #jhs-cookie-content {\n                    max-height: 0;\n                    overflow: hidden;\n                    transition: max-height 0.3s ease-out;\n                    padding: 0 15px;\n                }\n    \n                #jhs-cookie-panel.expanded #jhs-cookie-content {\n                    max-height: 250px;\n                    padding: 15px;\n                }\n    \n                #jhs-cookie-value {\n                    max-height: 100px;\n                    overflow-y: auto;\n                    white-space: pre-wrap;\n                    word-break: break-all;\n                    margin-bottom: 15px;\n                    padding: 10px;\n                    border: 1px solid #CCCCCC;\n                    background-color: #F8F8F8;\n                    font-size: 12px;\n                    border-radius: 4px;\n                    color: #555;\n                }\n    \n                #jhs-copy-btn {\n                    background-color: #10B981;\n                    color: white;\n                    border: none;\n                    padding: 8px 15px;\n                    text-align: center;\n                    text-decoration: none;\n                    display: inline-block;\n                    font-size: 14px;\n                    margin: 0;\n                    cursor: pointer;\n                    border-radius: 4px;\n                    width: 100%;\n                    font-weight: 600;\n                    transition: background-color 0.2s ease;\n                }\n                \n                #jhs-copy-btn:hover {\n                    background-color: #059669;\n                }\n            </style>\n        ";
    }
    async handle() {
        if (!currentHref.includes("&ac=userfile") && currentHref.includes("115")) {
            utils.loopDetector((() => $("#js-login-box").length > 0), (() => {
                if (0 !== $("#js-login-box").length) {
                    this.reLogin();
                    this.hookPage();
                    this.bindClick();
                }
            }), 20, 4e3, !0);
            this.createCookiePanel();
        }
    }
    reLogin() {
        utils.loopDetector((() => $(".login-finished").length > 0), (() => {
            if ($(".login-finished").length > 0 || 0 === $("#js-login-box").length) return;
            const jhs_115_cookie = localStorage.getItem(this.JHS_115_COOKIE), jhs_115_max_age = localStorage.getItem(this.JHS_115_MAX_AGE);
            document.cookie.includes("SEID") || null === jhs_115_cookie || utils.q(null, "检测到上次登录已有缓存cookie, 是否使用并登录?", (() => {
                utils.addCookie(jhs_115_cookie, {
                    maxAge: parseInt(jhs_115_max_age),
                    domain: ".115.com"
                });
                window.location.href = "https://115.com/?cid=0&offset=0&mode=wangpan";
            }));
        }), 20, 1500, !0);
    }
    hookPage() {
        const $cookieTab = $('<a id="jhs-cookie"><s>🔰 JHS-扫码</s></a>');
        $(".ltab-office").after($cookieTab);
        const $cookieScene = $(`\n            <div id="jhs_cookie_box" style="display: none; padding: 0 20px; max-width: 300px; margin: auto;">\n                <div style="margin-bottom: 15px; text-align: center;">\n                    <span style="font-size: 18px; font-weight: bold; color: #333; display: block; margin-bottom: 10px;"> 使用115App扫码登录 </span>\n                    <div style="text-align: left;">\n                        <select id="login-115-type" style="width: 100%; padding: 10px; border-radius: 4px; border: 1px solid #ddd; font-size: 14px; box-sizing: border-box; background-color: white;">\n                            <option value="" style="color: #999;">请选择登录方式</option>\n                            <option value="wechatmini">微信小程序</option>\n                            <option value="alipaymini">支付宝小程序</option>\n                        </select>\n                    </div>\n                </div>\n                \n                <div style="text-align: left;">\n                    <select id="cookie-expiry-select" style="width: 100%; padding: 10px; border-radius: 4px; border: 1px solid #ddd; font-size: 14px; box-sizing: border-box; background-color: white;">\n                        ${[ {
            label: "有效期: 会话 (关闭浏览器)",
            value: 0
        }, {
            label: "有效期: 1 天",
            value: 86400
        }, {
            label: "有效期: 7 天",
            value: 604800
        }, {
            label: "有效期: 30 天",
            value: 2592e3,
            default: !0
        }, {
            label: "有效期: 60 天",
            value: 5184e3
        }, {
            label: "有效期: 180 天",
            value: 15552e3
        } ].map((c => `<option value="${c.value}"  ${c.default ? "selected" : ""} > ${c.label} </option>`)).join("")}\n                    </select>\n                </div>\n                \n                <div id="qrcode-box" style="display: none; justify-content:center; min-height: 100px; border: 1px dashed #aaa; padding: 15px; text-align: center; margin-top: 15px; border-radius: 4px; background-color: #fff; line-height: 70px; color: #666;">\n                    二维码占位区域\n                </div>\n                \n                                \n                <div style="margin-bottom: 15px; text-align: center; margin-top:50px">\n                    <span style="font-size: 18px; font-weight: bold; color: #333; display: block; margin-bottom: 10px;">已有Cookie? 在此输入并回车</span>\n                    <div style="text-align: left;">\n                        <input type="text" id="cookie-str-input" style="width: 100%; padding: 10px; border-radius: 4px; border: 1px solid #ddd; font-size: 14px; box-sizing: border-box; background-color: white;">\n                    </div>\n                     <div style="text-align: center;margin-top:5px">\n                        <a class="a-primary" id="submit-cookie-btn">提交</a>\n                    </div>\n                </div>\n            </div>\n        `);
        $("#js-login_box").find(".login-footer").before($cookieScene);
    }
    bindClick() {
        $("#jhs-cookie").on("click", (() => {
            const finishedEl = document.querySelector('[lg_rel="finished"]');
            if (finishedEl) finishedEl.style.display = "none"; else {
                document.querySelector('[lg_rel="qrcode"]').style.display = "none";
                document.querySelector(".login-footer").style.display = "none";
                document.querySelector(".list-other-login").style.display = "none";
            }
            document.querySelectorAll("#js-login_way > *").forEach((tab => {
                tab.classList.remove("current");
            }));
            document.querySelector("#jhs_cookie_box").style.display = "block";
            $("#jhs-cookie").css("background", "#fff");
            $(".ltab-cloud").addClass("change-bg");
        }));
        $(".ltab-cloud").on("click", (() => {
            document.querySelector("#jhs_cookie_box").style.display = "none";
            const finishedEl = document.querySelector('[lg_rel="finished"]');
            if (finishedEl) finishedEl.style.display = "flex"; else {
                document.querySelector('[lg_rel="qrcode"]').style.display = "block";
                document.querySelector(".login-footer").style.display = "block";
                document.querySelector(".list-other-login").style.display = "block";
            }
            $("#jhs-cookie").css("background", "#F9FAFB");
            $(".ltab-cloud").removeClass("change-bg");
        }));
        let loginTimeout = null;
        $("#login-115-type").on("change", (async event => {
            let login115Type = $("#login-115-type").val();
            if (!login115Type) return;
            const loginInfo = (await (async loginType => {
                let url = `https://qrcodeapi.115.com/api/1.0/${loginType}/1.0/token/`;
                return await gmHttp.get(url);
            })(login115Type)).data, qrcode = loginInfo.qrcode, sign = loginInfo.sign, time = loginInfo.time, uid = loginInfo.uid;
            console.log("生成二维码:", loginInfo);
            const $qrcodeBox = $("#qrcode-box");
            $qrcodeBox.css("display", "flex");
            $qrcodeBox.html("");
            new QRCode($qrcodeBox[0], {
                text: qrcode,
                width: 150,
                height: 150,
                correctLevel: QRCode.CorrectLevel.H
            });
            loginTimeout && clearTimeout(loginTimeout);
            const checkLoginRecursive = async () => {
                try {
                    const loginResult = await (async (uid, time, sign) => {
                        let url = `https://qrcodeapi.115.com/get/status/?uid=${uid}&time=${time}&sign=${sign}`;
                        return await gmHttp.get(url);
                    })(uid, time, sign);
                    console.log("已扫码, 正在获取结果:", loginResult);
                    let data = loginResult.data, msg = data.msg, status = data.status;
                    if (msg) {
                        console.log(msg);
                        show.info(msg);
                    }
                    if (2 === status) {
                        show.ok("扫码登录成功");
                        const checkResult = await (async (loginType, uid) => {
                            const data = {
                                app: loginType,
                                account: uid
                            }, url = `https://passportapi.115.com/app/1.0/${loginType}/1.0/login/qrcode/`;
                            return await gmHttp.postFileFormData(url, data);
                        })(login115Type, uid);
                        console.log("扫码登录成功:", checkResult);
                        if (checkResult.data && checkResult.data.cookie) {
                            const cookie = checkResult.data.cookie, cookieStr = `UID=${cookie.UID}; CID=${cookie.CID}; SEID=${cookie.SEID}; KID=${cookie.KID}`;
                            console.log("解析出cookie:", cookieStr);
                            localStorage.setItem(this.JHS_115_COOKIE, cookieStr);
                            localStorage.setItem(this.JHS_115_MAX_AGE, $("#cookie-expiry-select").val());
                            window.location.href = "https://115.com/?cid=0&offset=0&mode=wangpan";
                        }
                        return;
                    }
                    loginTimeout = setTimeout(checkLoginRecursive, 500);
                } catch (error) {
                    console.error("登录检查失败:", error);
                }
            };
            await checkLoginRecursive();
        }));
        const handleCookie = () => {
            const cookieStr = cookieInput.value, expirySelect = document.getElementById("cookie-expiry-select");
            let maxAge = parseInt(expirySelect.value);
            utils.addCookie(cookieStr, {
                maxAge: maxAge,
                domain: ".115.com"
            });
            window.location.href = "https://115.com/?cid=0&offset=0&mode=wangpan";
        }, cookieInput = document.getElementById("cookie-str-input");
        cookieInput.addEventListener("keydown", (function(event) {
            if ("Enter" === event.key) {
                event.preventDefault();
                handleCookie();
            }
        }));
        $("#submit-cookie-btn").on("click", (() => {
            handleCookie();
        }));
    }
    showMessage(message) {
        const toast = document.createElement("div");
        toast.textContent = message;
        toast.style.cssText = "\n            position: fixed;\n            top: 20px;\n            right: 20px;\n            background-color: #333;\n            color: white;\n            padding: 10px 20px;\n            border-radius: 5px;\n            z-index: 20000;\n            opacity: 0;\n            transition: opacity 0.5s ease-in-out;\n        ";
        document.body.appendChild(toast);
        setTimeout((() => {
            toast.style.opacity = "1";
        }), 10);
        setTimeout((() => {
            toast.style.opacity = "0";
            setTimeout((() => toast.remove()), 500);
        }), 3e3);
    }
    createCookiePanel() {
        const cookieValue = localStorage.getItem(this.JHS_115_COOKIE);
        if (!cookieValue) return;
        const panel = document.createElement("div");
        panel.id = "jhs-cookie-panel";
        panel.innerHTML = `\n            <div id="jhs-cookie-header">\n                <span>JHS-115-Cookie</span>\n                <span id="jhs-toggle-icon">▼</span>\n            </div>\n            <div id="jhs-cookie-content">\n                <div id="jhs-cookie-value">${cookieValue}</div>\n                <button id="jhs-copy-btn">复制 Cookie</button>\n            </div>\n        `;
        document.body.appendChild(panel);
        const header = document.getElementById("jhs-cookie-header");
        document.getElementById("jhs-cookie-content");
        const toggleIcon = document.getElementById("jhs-toggle-icon"), copyButton = document.getElementById("jhs-copy-btn");
        header.addEventListener("click", (() => {
            const isExpanded = panel.classList.toggle("expanded");
            toggleIcon.textContent = isExpanded ? "▲" : "▼";
        }));
        copyButton.addEventListener("click", (async e => {
            e.stopPropagation();
            try {
                await navigator.clipboard.writeText(cookieValue);
                this.showMessage("Cookie 已成功复制到剪贴板!");
            } catch (err) {
                console.error("Failed to copy text using clipboard API: ", err);
                const tempTextArea = document.createElement("textarea");
                tempTextArea.value = cookieValue;
                document.body.appendChild(tempTextArea);
                tempTextArea.select();
                document.execCommand("copy");
                document.body.removeChild(tempTextArea);
                this.showMessage("Cookie 已复制! (回退方案)");
            }
        }));
        panel.classList.remove("expanded");
    }
}

const _WangPan115MatchPlugin = class _WangPan115MatchPlugin extends BasePlugin {
    constructor() {
        super(...arguments);
        __publicField(this, "loginStatus", _WangPan115MatchPlugin.LoginStatus.UNCHECKED);
    }
    getName() {
        return "WangPan115MatchPlugin";
    }
    async initCss() {
        return "\n            <style>\n                [class^='jhs-match-'] {\n                    padding: 1px 2px;\n                    margin-left: 0;\n                    margin-right: 5px;\n                }\n                \n                .jhs-match-detail {\n                    display: inline-block;\n                    width: 50%;\n                    z-index: 1000;\n                    background: #fff;\n                    border: 1px solid #ddd;\n                    border-radius: 4px;\n                    padding: 10px;\n                    overflow-y: auto;\n                }\n                .jhs-match-detail.isListPage{\n                    position: absolute;\n                    box-shadow: 0 2px 10px rgba(0,0,0,0.2);\n                }\n                .jhs-match-detail table {\n                    width: 100%;\n                    border-collapse: collapse;\n                }\n                .jhs-match-detail th, .jhs-match-detail td {\n                    padding: 4px 8px;\n                    border: 1px solid #eee;\n                    text-align: left;\n                }\n                .jhs-match-detail th {\n                    background-color: #f5f5f5;\n                }\n                .jhs-match-detail tr:hover {\n                    background-color: #f9f9f9;\n                }\n            </style>\n        ";
    }
    async handle() {
        $(document).on("click", ".jhs-match-no-login-btn", (async event => {
            event.preventDefault();
            event.stopPropagation();
            await this.handleLoginRedirect();
        }));
        $(document).on("click", ".jhs-match-btn", (event => {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.showMatchDetail(event.currentTarget);
        }));
        $(document).on("click", ".jhs-match-error-btn", (async event => {
            event.preventDefault();
            event.stopPropagation();
            await this.retryMatch(event.currentTarget);
        }));
        await this.matchDetailPage();
        $(document).on("click", ".jhs-match-detail-error-btn", (async event => {
            event.preventDefault();
            event.stopPropagation();
            $(event.currentTarget).replaceWith("<a class='jhs-match-btn' title=\"匹配中...\">匹配中...</a>");
            try {
                const carNum2 = this.getPageInfo().carNum, matchList = await this.searchFiles(carNum2);
                $(".jhs-115-match-detail").remove();
                await this.matchDetailPage(matchList);
            } catch (error) {
                console.error(`重新匹配失败 [${carNum}]:`, error);
                this.showMatchError($box, carNum, error);
            }
        }));
    }
    async matchDetailPage(matchList) {
        if (!window.isDetailPage) return;
        if (await storageManager.getSetting("enable115Match", NO) === NO) return;
        const $detail = $('\n            <div class="jhs-match-detail jhs-115-match-detail" id="115-match-table">\n                <table>\n                    <thead>\n                        <tr style="text-align: center">\n                            <th colspan="4">115匹配</th>\n                        </tr>\n                        <tr>\n                            <th>名称</th>\n                            <th>大小</th>\n                            <th>时间</th>\n                            <th>播放</th>\n                        </tr>\n                    </thead>\n                    <tbody>\n                    </tbody>\n                </table>\n            </div>\n        '), $tbody = $detail.find("tbody");
        try {
            const carNum2 = this.getPageInfo().carNum;
            matchList || (matchList = await this.searchFiles(carNum2));
            await this.checkLoginStatus();
            if (this.loginStatus === _WangPan115MatchPlugin.LoginStatus.LOGGED_OUT) $tbody.append(`<tr><td colspan="4">\n                     <a class='jhs-match-no-login-btn a-info'\n                        data-keyword="${carNum2}"\n                        title="未登录115网盘">未登录</a>\n                 </td></tr>`); else if (matchList.length > 0) {
                const rowsHtml = matchList.map((match => `\n                <tr>\n                    <td>${match.name}</td>\n                    <td>${this.formatSize(match.size)}</td>\n                    <td>${match.createTime}</td>\n                    <td>\n                        <a href="https://115vod.com/?pickcode=${match.videoId}&share_id=0"\n                           target="_blank"\n                           class="a-success"\n                           title="播放">播放</a>\n                    </td>\n                </tr>\n            `)).join("");
                $tbody.append(rowsHtml);
            } else $tbody.append(`<tr><td colspan="4">\n                     <a class='jhs-match-detail-error-btn a-info'\n                        data-keyword="${carNum2}"\n                        title="未匹配,点击重试">未匹配</a>\n                 </td></tr>`);
        } catch (error) {
            $tbody.append(`<tr><td colspan="4">\n                 <a class="a-danger jhs-match-detail-error-btn" title="${error.message || "加载失败"}">加载失败，请重试</a>\n             </td></tr>`);
            console.error("加载文件列表时发生错误:", error);
        }
        if (isJavDb) if ($("#all-match-box").length) $("#all-match-box").append($detail); else {
            $("#tabs-container").before("<div style='display: flex' id='all-match-box'></div>");
            $("#all-match-box").append($detail);
        } else $("#mag-submit-show").before($detail);
    }
    async matchMovieList(movieListElement) {
        if (await storageManager.getSetting("enable115Match", NO) !== NO) {
            await this.checkLoginStatus();
            await this.processMovieElements(movieListElement);
        } else $(".video-title [class^='jhs-match-']").remove();
    }
    showMatchDetail(buttonElement) {
        const $el = $(buttonElement), matchData = $el.attr("data-match");
        $(".jhs-match-detail").remove();
        const matches = this.parseMatchData(matchData);
        if (0 === matches.length) return;
        if (1 === matches.length) {
            const pickcode = matches[0].videoId;
            window.open(`https://115vod.com/?pickcode=${pickcode}&share_id=0`, "_blank");
            return;
        }
        const $detail = this.createMatchDetailElement(matches);
        this.positionDetailElement($detail, $el);
        this.addOutsideClickHandler($detail);
        $detail.on("click", (e => {
            e.stopPropagation();
        }));
    }
    parseMatchData(matchData) {
        try {
            return JSON.parse(matchData) || [];
        } catch (e) {
            console.error("解析匹配数据失败:", e);
            return [];
        }
    }
    createMatchDetailElement(matches) {
        const $detail = $(`\n            <div class="jhs-match-detail isListPage">\n                <table>\n                    <thead>\n                        <tr>\n                            <th>名称</th>\n                            <th>大小</th>\n                            <th>时间</th>\n                            <th>播放</th>\n                        </tr>\n                    </thead>\n                    <tbody>\n                        ${matches.map((match => `\n                            <tr>\n                                <td>${match.name}</td>\n                                <td>${this.formatSize(match.size)}</td>\n                                <td>${match.createTime}</td>\n                                <td>\n                                    <a href="https://115vod.com/?pickcode=${match.videoId}&share_id=0" \n                                       target="_blank" \n                                       class="a-success"\n                                       title="播放">播放</a>\n                                </td>\n                            </tr>\n                        `)).join("")}\n                    </tbody>\n                </table>\n            </div>\n        `);
        $("body").append($detail);
        return $detail;
    }
    positionDetailElement($detail, $trigger) {
        const offset = $trigger.offset();
        $detail.css({
            top: offset.top - $detail.outerHeight() + 20,
            left: offset.left
        });
    }
    addOutsideClickHandler($detail) {
        setTimeout((() => {
            $(document).on("click.jhs-match-detail", (e => {
                if (!$detail.is(e.target) && 0 === $detail.has(e.target).length) {
                    $detail.remove();
                    $(document).off("click.jhs-match-detail");
                }
            }));
        }), 100);
    }
    async retryMatch(buttonElement) {
        const $el = $(buttonElement), $box2 = $el.closest(".movie-box, .item"), carNum2 = $el.attr("data-keyword");
        $el.replaceWith("<a class='jhs-match-btn' title=\"匹配中...\">匹配中...</a>");
        try {
            const matchList = await this.searchFiles(carNum2);
            this.updateMatchStatus($box2, carNum2, matchList);
        } catch (error) {
            console.error(`重新匹配失败 [${carNum2}]:`, error);
            this.showMatchError($box2, carNum2, error);
        }
    }
    updateMatchStatus($box2, carNum2, matchList) {
        if (matchList.length > 0) {
            $box2.find(".jhs-match-btn").replaceWith(`<a class='jhs-match-btn a-success' \n                   data-keyword="${carNum2}"\n                   data-match='${JSON.stringify(matchList)}'\n                   title="点击查看匹配详情">匹配${matchList.length}个</a>`);
            const $deleteBtn = $box2.find(".delete115Svg");
            if ($deleteBtn.length > 0 && matchList[0].dirId) {
                $deleteBtn.attr("data-match", JSON.stringify(matchList));
                $deleteBtn.show();
            }
        } else {
            $box2.find(".jhs-match-btn").replaceWith(`<a class='jhs-match-error-btn a-info' data-keyword="${carNum2}" \n                  title="点击重新尝试匹配">未匹配</a>`);
            const $deleteBtn = $box2.find(".delete115Svg");
            if ($deleteBtn.length > 0) {
                $deleteBtn.removeAttr("data-match");
                $deleteBtn.hide();
            }
        }
    }
    async handleLoginRedirect() {
        window.open("https://115.com");
    }
    async searchFiles(carNum2) {
        var _a2;
        let searchKeyword = carNum2.toLowerCase().replace("fc2-", "");
        return (null == (_a2 = (await searchFiles(searchKeyword)).data) ? void 0 : _a2.map((data => ({
            folderId: data.fid,
            dirId: data.cid,
            videoId: data.pc,
            name: data.n,
            createTime: utils.formatDate(new Date(1e3 * data.te)),
            size: data.s,
            isVideo: [ ".mp4", ".avi", ".mov", ".mkv", ".flv", ".wmv" ].some((ext => {
                var _a3;
                return null == (_a3 = data.n) ? void 0 : _a3.toLowerCase().endsWith(ext);
            }))
        }))).filter((x => x.folderId && x.isVideo && x.name.toLowerCase().includes(searchKeyword)))) || [];
    }
    showMatchError($box2, carNum2, error) {
        $box2.find(".jhs-match-btn").replaceWith(`<a class='jhs-match-error-btn' data-keyword="${carNum2}" \n              title="匹配失败，点击重试">匹配失败</a>`);
        show.error(`${carNum2} 匹配失败: ${error.message || "网络错误"}`);
    }
    async checkLoginStatus() {
        var _a2;
        if (this.loginStatus === _WangPan115MatchPlugin.LoginStatus.UNCHECKED) try {
            const testResult = await searchFiles("test");
            this.loginStatus = (null == (_a2 = testResult.error) ? void 0 : _a2.includes("登录")) ? _WangPan115MatchPlugin.LoginStatus.LOGGED_OUT : _WangPan115MatchPlugin.LoginStatus.LOGGED_IN;
        } catch {
            this.loginStatus = _WangPan115MatchPlugin.LoginStatus.LOGGED_OUT;
        }
    }
    async processMovieElements(movieListElement) {
        const promises = Array.from(movieListElement).filter((ele => !utils.isHidden(ele))).filter((ele => !(isJavBus && $(ele).find(".avatar-box").length > 0))).map((ele => this.processSingleMovieElement(ele)));
        await Promise.all(promises);
    }
    async processSingleMovieElement(element) {
        const $box2 = $(element), {carNum: carNum2} = this.getBoxCarInfo($box2);
        if (!($box2.find("[class^='jhs-match-']").length > 0)) if (this.loginStatus !== _WangPan115MatchPlugin.LoginStatus.LOGGED_OUT) try {
            const matchList = await this.searchFiles(carNum2);
            this.addTag($box2, carNum2, matchList);
        } catch (error) {
            console.error(`搜索失败 [${carNum2}]:`, error);
            this.addTag($box2, carNum2, []);
        } else this.addTag($box2, carNum2, []);
    }
    addTag($box2, carNum2, matchList) {
        if (!($box2.find("[class^='jhs-match-']").length > 0)) if (this.loginStatus === _WangPan115MatchPlugin.LoginStatus.LOGGED_OUT) $box2.find(".video-title").prepend(`<a class='jhs-match-no-login-btn a-info' \n                   data-keyword="${carNum2}" \n                   title="未登录115网盘">未登录</a>`); else if (matchList.length > 0) {
            const title = 1 === matchList.length ? "点击直接播放" : `点击查看${matchList.length}个匹配结果`;
            $box2.find(".video-title").prepend(`<a class='jhs-match-btn a-success' \n                       data-keyword="${carNum2}"\n                       data-match='${JSON.stringify(matchList)}'\n                       title="${title}">匹配${matchList.length}个</a>`);
            const $deleteBtn = $box2.find(".delete115Svg");
            if ($deleteBtn.length > 0 && matchList[0].dirId) {
                $deleteBtn.attr("data-match", JSON.stringify(matchList));
                $deleteBtn.show();
            }
        } else $box2.find(".video-title").prepend(`<a class='jhs-match-error-btn a-info' \n                   data-keyword="${carNum2}" \n                   title="未匹配,点击重试">未匹配</a>`);
    }
    formatSize(bytes) {
        if (!bytes) return "-";
        const units = [ "B", "KB", "MB", "GB", "TB" ];
        let size = parseFloat(bytes), unit = 0;
        for (;size >= 1024 && unit < units.length - 1; ) {
            size /= 1024;
            unit++;
        }
        return `${size.toFixed(2)} ${units[unit]}`;
    }
};

__publicField(_WangPan115MatchPlugin, "LoginStatus", {
    UNCHECKED: -1,
    LOGGED_OUT: 0,
    LOGGED_IN: 1
});

let WangPan115MatchPlugin = _WangPan115MatchPlugin;


export { WangPan115Plugin, WangPan115MatchPlugin };
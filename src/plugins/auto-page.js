import { BasePlugin } from '../core/base-plugin.js';
import { __publicField, isJavBus, isJavDb, currentHref, NO, YES } from '../core/constants.js';
import { GM_xmlhttpRequest } from 'vite-plugin-monkey/dist/client';

class AutoPagePlugin extends BasePlugin {
    constructor() {
        super(...arguments);
        __publicField(this, "preloadDistance", 500);
        __publicField(this, "currentPage", this.getInitialPageNumber());
        __publicField(this, "pageItems", []);
    }
    getName() {
        return "AutoPagePlugin";
    }
    async initCss() {
        return "\n            <style>\n                .jhs-scroll {\n                    text-align: center;\n                    padding-top: 20px;\n                    font-size: 14px;\n                }\n                .jhs-scroll.waterfall-loading { color: #000; }\n                .jhs-scroll.waterfall-error { color: #f44336; cursor: pointer; }\n                .jhs-scroll.waterfall-no-more { color: #4CAF50; }\n            </style>\n        ";
    }
    async handle() {
        this.waterfall().then();
    }
    getInitialPageNumber() {
        if (isJavBus) {
            const match = currentHref.match(/\/(page|star\/[^/]+)\/(\d+)/);
            return match ? parseInt(match[2], 10) : 1;
        }
        if (isJavDb) {
            const match = currentHref.match(/[?&]page=(\d+)/);
            return match ? parseInt(match[1], 10) : 1;
        }
        return 1;
    }
    async waterfall() {
        if (await this.shouldDisablePaging()) return;
        const selector = this.getSelector();
        this.container = document.querySelector(selector.boxSelector);
        if (!this.container) {
            console.error("没有找到容器节点,停止瀑布流!");
            return;
        }
        this.loader = document.createElement("div");
        this.loader.className = "jhs-scroll";
        this.container.parentNode.insertBefore(this.loader, this.container.nextSibling);
        this.pageItems.push({
            page: this.currentPage,
            top: 0,
            url: window.location.href
        });
        this.loader.addEventListener("click", (() => {
            this.loader.classList.contains("waterfall-error") && this.loadNextPage().then();
        }));
        window.addEventListener("scroll", (() => {
            this.checkLoad();
            this.checkScrollPosition();
        }));
        const nextLink = document.querySelector(selector.nextPageSelector);
        this.nextUrl = null == nextLink ? void 0 : nextLink.href;
        this.hasMore = !!this.nextUrl;
        setTimeout((() => {
            this.checkLoad();
        }), 1e3);
        this.hasMore || this.setState("waterfall-no-more", "已经到底了");
    }
    async loadNextPage() {
        var _a2;
        if (await storageManager.getSetting("autoPage", YES) === NO) {
            this.setState("waterfall-loading", "");
            return;
        }
        if (this.isLoading || !this.nextUrl) return;
        this.isLoading = !0;
        this.setState("waterfall-loading", "加载中...");
        const selector = this.getSelector();
        try {
            const pageNum = utils.getUrlParam(this.nextUrl, "page");
            let maxPage = 60;
            currentHref.includes("c11") && (maxPage = 30);
            if (isJavDb && pageNum > maxPage || currentHref.includes("month")) {
                const beyond60Plugin = this.getBean("Beyond60Plugin");
                if (beyond60Plugin) {
                    const {html: html2, nextUrl: nextUrl, hasMore: hasMore} = await beyond60Plugin.handleBeyond60(this.nextUrl);
                    if (html2) {
                        const pageTop2 = this.container.scrollHeight;
                        this.pageItems.push({
                            page: this.currentPage + 1,
                            top: pageTop2,
                            url: this.nextUrl
                        });
                        $(".movie-list").append(html2);
                    }
                    this.hasMore = hasMore;
                    this.nextUrl = nextUrl;
                    const $ul = beyond60Plugin.createPagination(pageNum, hasMore);
                    $(".pagination").html($ul);
                    this.setState("waterfall-loading", "");
                    this.hasMore || this.setState("waterfall-no-more", "已经到底了");
                    return;
                }
            }
            const html = await gmHttp.get(this.nextUrl);
            clog.log("请求下一页内容:", this.nextUrl);
            const $dom = utils.htmlTo$dom(html);
            isJavBus && $dom.find(".avatar-box").length > 0 && $dom.find(".avatar-box").parent().remove();
            let itemList = $dom.find(this.getSelector().requestDomItemSelector);
            const currentBoxCarInfoList = this.getBoxCarInfoList(), nextPageBoxCarInfoList = this.getBoxCarInfoList(itemList);
            if (this.checkDuplicateCarNumbers(currentBoxCarInfoList, nextPageBoxCarInfoList)) {
                this.nextUrl = null;
                this.hasMore = !1;
                this.setState("waterfall-error", "翻页内容出现重复数据, 可能首页已更新了新视频 或 页码受JavDB限制, 停止瀑布流");
                return;
            }
            const pageTop = this.container.scrollHeight;
            this.pageItems.push({
                page: this.currentPage + 1,
                top: pageTop,
                url: this.nextUrl
            });
            const listPagePlugin = this.getBean("ListPagePlugin");
            let coverImgNodeList = $dom.find(this.getSelector().coverImgSelector);
            listPagePlugin.replaceHdImg(coverImgNodeList);
            $(this.getSelector().boxSelector).append(itemList);
            this.nextUrl = null == (_a2 = $dom.find(selector.nextPageSelector)) ? void 0 : _a2.attr("href");
            this.hasMore = !!this.nextUrl;
            let pagination = $dom.find(".pagination");
            $(".pagination").replaceWith(pagination);
            this.setState("waterfall-loading", "");
            this.hasMore || this.setState("waterfall-no-more", "已经到底了");
        } catch (e) {
            clog.error("加载失败:", e);
            this.setState("waterfall-error", "加载失败，点击重试");
        } finally {
            this.isLoading = !1;
        }
    }
    checkScrollPosition() {
        const scrollPosition = window.scrollY;
        for (let i = this.pageItems.length - 1; i >= 0; i--) {
            const page = this.pageItems[i];
            if (scrollPosition >= page.top) {
                if (this.currentPage !== page.page) {
                    this.currentPage = page.page;
                    this.updatePageUrl(page.url);
                }
                break;
            }
        }
    }
    checkLoad() {
        if (!this.loader) return;
        this.loader.getBoundingClientRect().top < window.innerHeight + this.preloadDistance && this.loadNextPage().then();
    }
    async shouldDisablePaging() {
        if (!window.isListPage) return !0;
        await storageManager.getSetting("autoPage", YES);
        return [ "search?q", "handlePlayback=1", "handleTop=1", "/want_watch_videos", "/watched_videos", "/advanced_search?type=100" ].some((path => currentHref.includes(path)));
    }
    updatePageUrl_old(href) {
        window.history.pushState({}, "", href);
        if (isJavBus) {
            const match = href.match(/\/(page|star\/.*?)\/(\d+)/), pageNumber = match ? parseInt(match[2], 10) : null;
            document.title = document.title.replace(/第\d+頁/, "第" + pageNumber + "頁");
        }
    }
    updatePageUrl(url) {
        window.history.replaceState({}, "", url);
        isJavBus && (document.title = document.title.replace(/第\d+頁/, `第${this.currentPage}頁`));
    }
    setState(state, text) {
        this.loader.className = `jhs-scroll ${state}`;
        this.loader.textContent = text;
    }
}

class AliyunApi {
    constructor(refresh_token) {
        this.baseApiUrl = "https://api.aliyundrive.com";
        this.refresh_token = refresh_token;
        this.authorization = null;
        this.default_drive_id = null;
        this.backupFolderId = null;
    }
    async getDefaultDriveId() {
        if (this.default_drive_id) return this.default_drive_id;
        this.userInfo = await this.getUserInfo();
        this.default_drive_id = this.userInfo.default_drive_id;
        return this.default_drive_id;
    }
    async getHeaders() {
        if (this.authorization) return {
            authorization: this.authorization
        };
        this.authorization = await this.getAuthorization();
        return {
            authorization: this.authorization
        };
    }
    async getAuthorization() {
        let url = this.baseApiUrl + "/v2/account/token", data = {
            refresh_token: this.refresh_token,
            grant_type: "refresh_token"
        };
        try {
            return "Bearer " + (await gmHttp.post(url, data)).access_token;
        } catch (e) {
            throw e.message.includes("is not valid") ? new Error("refresh_token无效, 请重新填写并保存") : e;
        }
    }
    async getUserInfo() {
        const headers = await this.getHeaders();
        let url = this.baseApiUrl + "/v2/user/get";
        return await gmHttp.post(url, {}, headers);
    }
    async deleteFile(file_id, drive_id = null) {
        if (!file_id) throw new Error("未传入file_id");
        drive_id || (drive_id = await this.getDefaultDriveId());
        let data = {
            file_id: file_id,
            drive_id: drive_id
        }, url = this.baseApiUrl + "/v2/recyclebin/trash";
        const headers = await this.getHeaders();
        await gmHttp.post(url, data, headers);
        return {};
    }
    async createFolder(name2, drive_id = null, parent_folder_id = "root") {
        drive_id || (drive_id = await this.getDefaultDriveId());
        let url = this.baseApiUrl + "/adrive/v2/file/createWithFolders", data = {
            name: name2,
            type: "folder",
            parent_file_id: parent_folder_id,
            check_name_mode: "auto_rename",
            content_hash_name: "sha1",
            drive_id: drive_id
        };
        const headers = await this.getHeaders();
        return await gmHttp.post(url, data, headers);
    }
    async getFileList(parent_folder_id = "root", drive_id = null) {
        drive_id || (drive_id = await this.getDefaultDriveId());
        let url = this.baseApiUrl + "/adrive/v3/file/list";
        const data = {
            drive_id: drive_id,
            parent_file_id: parent_folder_id,
            limit: 200,
            all: !1,
            url_expire_sec: 14400,
            image_thumbnail_process: "image/resize,w_256/format,avif",
            image_url_process: "image/resize,w_1920/format,avif",
            video_thumbnail_process: "video/snapshot,t_120000,f_jpg,m_lfit,w_256,ar_auto,m_fast",
            fields: "*",
            order_by: "updated_at",
            order_direction: "DESC"
        }, headers = await this.getHeaders();
        return (await gmHttp.post(url, data, headers)).items;
    }
    async uploadFile(folder_id, fileName, uploadContent, drive_id = null) {
        show.info("请求存储空间中...");
        let createFileUrl = this.baseApiUrl + "/adrive/v2/file/createWithFolders";
        drive_id || (drive_id = await this.getDefaultDriveId());
        let data = {
            drive_id: drive_id,
            part_info_list: [ {
                part_number: 1
            } ],
            parent_file_id: folder_id,
            name: fileName,
            type: "file",
            check_name_mode: "auto_rename"
        };
        const headers = await this.getHeaders(), createFileResult = await gmHttp.post(createFileUrl, data, headers), upload_id = createFileResult.upload_id, upload_file_id = createFileResult.file_id, upload_url = createFileResult.part_info_list[0].upload_url;
        show.info("开始上传文件...");
        await this._doUpload(upload_url, uploadContent);
        await gmHttp.post("https://api.aliyundrive.com/v2/file/complete", data = {
            drive_id: drive_id,
            file_id: upload_file_id,
            upload_id: upload_id
        }, headers);
    }
    _doUpload(upload_url, uploadContent) {
        return new Promise(((resolve, reject) => {
            $.ajax({
                type: "PUT",
                url: upload_url,
                data: uploadContent,
                contentType: " ",
                processData: !1,
                success: (res, status, xhr) => {
                    200 === xhr.status ? resolve({}) : reject(xhr);
                },
                error: xhr => {
                    clog.error("上传失败", xhr.responseText);
                    reject(xhr);
                }
            });
        }));
    }
    async getDownloadUrl(file_id, drive_id = null) {
        drive_id || (drive_id = await this.getDefaultDriveId());
        let url = this.baseApiUrl + "/v2/file/get_download_url";
        const headers = await this.getHeaders();
        let data = {
            file_id: file_id,
            drive_id: drive_id
        };
        return (await gmHttp.post(url, data, headers)).url;
    }
    async _createBackupFolder(folderName) {
        const fileList = await this.getFileList();
        let folderObj = null;
        for (let i = 0; i < fileList.length; i++) {
            let file = fileList[i];
            if (file.name === folderName) {
                folderObj = file;
                break;
            }
        }
        if (!folderObj) {
            show.info("不存在备份目录, 进行创建");
            folderObj = await this.createFolder(folderName);
        }
        this.backupFolderId = folderObj.file_id;
    }
    async backup(folderName, fileName, uploadContent) {
        if (this.backupFolderId) await this.uploadFile(this.backupFolderId, fileName, uploadContent); else {
            await this._createBackupFolder(folderName);
            await this.uploadFile(this.backupFolderId, fileName, uploadContent);
        }
    }
    async getBackupList(folderName) {
        let dataList;
        if (this.backupFolderId) dataList = await this.getFileList(this.backupFolderId); else {
            await this._createBackupFolder(folderName);
            dataList = await this.getFileList(this.backupFolderId);
        }
        const fileList = [];
        dataList.forEach((data => {
            fileList.push({
                name: data.name,
                fileId: data.file_id,
                createTime: data.created_at,
                size: data.size
            });
        }));
        return fileList;
    }
}

class WebDavApi {
    constructor(davUrl, username, password) {
        this.davUrl = davUrl.endsWith("/") ? davUrl : davUrl + "/";
        this.username = username;
        this.password = password;
        this.folderName = null;
    }
    _getAuthHeaders() {
        return {
            Authorization: `Basic ${btoa(`${this.username}:${this.password}`)}`,
            Depth: "1"
        };
    }
    _sendRequest(method, path, headers = {}, data) {
        return new Promise(((resolve, reject) => {
            const url = this.davUrl + path, allHeaders = {
                ...this._getAuthHeaders(),
                ...headers
            };
            GM_xmlhttpRequest({
                method: method,
                url: url,
                headers: allHeaders,
                data: data,
                onload: response => {
                    if (response.status >= 200 && response.status < 300) resolve(response); else {
                        console.error(response);
                        reject(new Error(`请求失败 ${response.status}: ${response.statusText}`));
                    }
                },
                onerror: response => {
                    console.error("请求WebDav发生错误:", response);
                    reject(new Error("请求WebDav失败, 请检查服务是否启动, 凭证是否正确"));
                }
            });
        }));
    }
    async backup(folderName, fileName, uploadContent) {
        await this._sendRequest("MKCOL", folderName);
        const path = folderName + "/" + fileName;
        await this._sendRequest("PUT", path, {
            "Content-Type": "text/plain"
        }, uploadContent);
    }
    async getFileList(folderName) {
        var _a2, _b, _c;
        const xmlResponse = (await this._sendRequest("PROPFIND", folderName, {
            "Content-Type": "application/xml"
        }, '<?xml version="1.0"?>\n                <d:propfind xmlns:d="DAV:">\n                    <d:prop>\n                        <d:displayname />\n                        <d:getcontentlength />\n                        <d:creationdate />\n                        <d:getlastmodified />\n                        <d:iscollection />\n                    </d:prop>\n                </d:propfind>\n            ')).responseText, items = (new DOMParser).parseFromString(xmlResponse, "text/xml").getElementsByTagNameNS("DAV:", "response"), fileList = [];
        for (let i = 0; i < items.length; i++) {
            if (0 === i) continue;
            let item = items[i];
            console.log(item);
            const name2 = item.getElementsByTagNameNS("DAV:", "displayname")[0].textContent, size = (null == (_a2 = item.getElementsByTagNameNS("DAV:", "getcontentlength")[0]) ? void 0 : _a2.textContent) || "0", createTime = (null == (_b = item.getElementsByTagNameNS("DAV:", "creationdate")[0]) ? void 0 : _b.textContent) || (null == (_c = item.getElementsByTagNameNS("DAV:", "getlastmodified")[0]) ? void 0 : _c.textContent) || "";
            "0" !== size && fileList.push({
                fileId: name2,
                name: name2,
                size: Number(size),
                createTime: createTime
            });
        }
        fileList.reverse();
        return fileList;
    }
    async deleteFile(fileId) {
        let path = this.folderName + "/" + encodeURI(fileId);
        await this._sendRequest("DELETE", path, {
            "Cache-Control": "no-cache"
        });
    }
    async getBackupList(folderName) {
        this.folderName = folderName;
        await this._sendRequest("MKCOL", folderName);
        return this.getFileList(folderName);
    }
    async getFileContent(filePath) {
        let path = this.folderName + "/" + filePath;
        return (await this._sendRequest("GET", path, {
            Accept: "application/octet-stream"
        })).responseText;
    }
}

const SALT = "x7k9p3";

function simpleEncrypt(str) {
    return (SALT + str + SALT).split("").map((char => {
        const code = char.codePointAt(0);
        return String.fromCodePoint(code + 5);
    })).join("");
}

function simpleDecrypt(encryptedStr) {
    return encryptedStr.split("").map((char => {
        const code = char.codePointAt(0);
        return String.fromCodePoint(code - 5);
    })).join("").slice(SALT.length, -SALT.length);
}


export { AutoPagePlugin, AliyunApi, WebDavApi, SALT, simpleEncrypt };
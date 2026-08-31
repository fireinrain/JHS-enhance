import { BasePlugin } from '../core/base-plugin.js';
import { __publicField } from '../core/constants.js';

class ImageRecognitionPlugin extends BasePlugin {
    constructor() {
        super(...arguments);
        __publicField(this, "siteList", [ {
            name: "Google旧版",
            url: "https://www.google.com/searchbyimage?image_url={占位符}&client=firefox-b-d",
            ico: "https://www.google.com/favicon.ico"
        }, {
            name: "Google",
            url: "https://lens.google.com/uploadbyurl?url={占位符}",
            ico: "https://www.google.com/favicon.ico"
        }, {
            name: "Yandex",
            url: "https://yandex.ru/images/search?rpt=imageview&url={占位符}",
            ico: "https://yandex.ru/favicon.ico"
        } ]);
        __publicField(this, "isUploading", !1);
    }
    getName() {
        return "ImageRecognitionPlugin";
    }
    async initCss() {
        return "\n            <style>\n                #upload-area {\n                    border: 2px dashed #85af68;\n                    border-radius: 8px;\n                    padding: 40px;\n                    text-align: center;\n                    margin-bottom: 20px;\n                    transition: all 0.3s;\n                    background-color: #f9f9f9;\n                }\n                #upload-area:hover {\n                    border-color: #76b947;\n                    background-color: #f0f0f0;\n                }\n                /* 拖拽进入 */\n                #upload-area.highlight {\n                    border-color: #2196F3;\n                    background-color: #e3f2fd;\n                }\n                \n                \n                #select-image-btn {\n                    background-color: #4CAF50;\n                    color: white;\n                    border: none;\n                    padding: 10px 20px;\n                    border-radius: 4px;\n                    cursor: pointer;\n                    font-size: 16px;\n                    transition: background-color 0.3s;\n                }\n                #select-image-btn:hover {\n                    background-color: #45a049;\n                }\n                \n                \n                #handle-btn, #cancel-btn {\n                    padding: 8px 16px;\n                    border-radius: 4px;\n                    cursor: pointer;\n                    font-size: 14px;\n                    border: none;\n                    transition: opacity 0.3s;\n                }\n                #handle-btn {\n                    background-color: #2196F3;\n                    color: white;\n                }\n                #handle-btn:hover {\n                    opacity: 0.9;\n                }\n                #cancel-btn {\n                    background-color: #f44336;\n                    color: white;\n                }\n                #cancel-btn:hover {\n                    opacity: 0.9;\n                }\n                \n                .search-img-site-btns-container {\n                    display: flex;\n                    flex-wrap: wrap;\n                    gap: 10px;\n                    margin-top: 15px;\n                }\n                .search-img-site-btn {\n                    display: flex;\n                    align-items: center;\n                    padding: 8px 12px;\n                    background-color: #f5f5f5;\n                    border-radius: 4px;\n                    text-decoration: none;\n                    color: #333;\n                    transition: all 0.2s;\n                    font-size: 14px;\n                    border: 1px solid #ddd;\n                }\n                .search-img-site-btn:hover {\n                    background-color: #e0e0e0;\n                    transform: translateY(-2px);\n                    box-shadow: 0 2px 5px rgba(0,0,0,0.1);\n                }\n                .search-img-site-btn img {\n                    width: 16px;\n                    height: 16px;\n                    margin-right: 6px;\n                }\n                .search-img-site-btn span {\n                    white-space: nowrap;\n                }\n            </style>\n        ";
    }
    open(onOpenFun) {
        layer.open({
            type: 1,
            title: "以图识图",
            content: '\n            <div style="padding: 20px">\n                <div id="upload-area">\n                    <div style="color: #555;margin-bottom: 15px;">\n                        <p>拖拽图片到此处 或 点击按钮选择图片</p>\n                        <p>也可以直接 Ctrl+V 粘贴图片或 图片URL</p>\n                    </div>\n                    <button id="select-image-btn">选择图片</button>\n                    <input type="file" style="display: none" id="image-file" accept="image/*">\n                </div>\n                \n                <div id="url-input-container" style="margin-top: 15px;display: none;">\n                    <input type="text" id="image-url" placeholder="粘贴图片URL地址..." style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box;">\n                </div>\n                \n                <div id="preview-area" style="margin-bottom: 20px; text-align: center; display: none;">\n                    <img id="preview-image" alt="" src="" style="max-width: 100%; max-height: 300px; border-radius: 4px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">\n                    <div style="margin-top: 15px; display: flex; justify-content: center; gap: 10px;" id="action-btns">\n                        <button id="handle-btn">搜索图片</button>\n                        <button id="cancel-btn">取消</button>\n                    </div>\n                    \n                    <div id="search-results" style="display: none;">\n                        <p style="margin: 20px auto">请选择识图网站：<a id="openAll" style="cursor: pointer">全部打开</a></p>\n                        <div class="search-img-site-btns-container" id="search-img-site-btns-container"></div>\n                    </div>\n                </div>\n                \n            </div>\n        ',
            area: utils.isMobile() ? utils.getResponsiveArea() : [ "40%", "80%" ],
            success: async layero => {
                this.initEventListeners();
                onOpenFun && onOpenFun();
            },
            end: () => {
                $(document).off("paste.searchImg");
            }
        });
    }
    initEventListeners() {
        const $uploadArea = $("#upload-area"), $fileInput = $("#image-file"), $selectBtn = $("#select-image-btn"), $previewArea = $("#preview-area"), $previewImage = $("#preview-image"), $actionBtns = $("#action-btns"), $searchImage = $("#handle-btn"), $cancelBtn = $("#cancel-btn"), $urlInputContainer = $("#url-input-container"), $imageUrlInput = $("#image-url"), $searchResults = $("#search-results"), $siteBtnsContainer = $("#search-img-site-btns-container");
        $uploadArea.on("dragover", (e => {
            e.preventDefault();
            $uploadArea.addClass("highlight");
        })).on("dragleave", (() => {
            $uploadArea.removeClass("highlight");
        })).on("drop", (e => {
            e.preventDefault();
            $uploadArea.removeClass("highlight");
            if (e.originalEvent.dataTransfer.files && e.originalEvent.dataTransfer.files[0]) {
                this.handleImageFile(e.originalEvent.dataTransfer.files[0]);
                this.resetSearchUI();
            }
        }));
        $selectBtn.on("click", (() => {
            $fileInput.trigger("click");
        }));
        $fileInput.on("change", (e => {
            if (e.target.files && e.target.files[0]) {
                this.handleImageFile(e.target.files[0]);
                this.resetSearchUI();
            }
        }));
        $(document).on("paste.searchImg", (async e => {
            const items = e.originalEvent.clipboardData.items;
            for (let i = 0; i < items.length; i++) if (-1 !== items[i].type.indexOf("image")) {
                const blob = items[i].getAsFile();
                this.handleImageFile(blob);
                this.resetSearchUI();
                return;
            }
            const text = e.originalEvent.clipboardData.getData("text");
            if (text && utils.isUrl(text)) {
                $urlInputContainer.show();
                $imageUrlInput.val(text);
                $previewImage.attr("src", text);
                $previewArea.show();
                this.resetSearchUI();
            }
        }));
        $searchImage.on("click", (async () => {
            const imageSrc = $previewImage.attr("src");
            if (imageSrc) {
                if (!this.isUploading) {
                    this.isUploading = !0;
                    try {
                        const imgUrl = await this.searchByImage(imageSrc);
                        $actionBtns.hide();
                        $searchResults.show();
                        $siteBtnsContainer.empty();
                        const key = "jhs_selectedSites", selectedSites = JSON.parse(localStorage.getItem(key) || "{}");
                        this.siteList.forEach((site => {
                            const siteUrl = site.url.replace("{占位符}", encodeURIComponent(imgUrl)), isChecked = !1 !== selectedSites[site.name];
                            $siteBtnsContainer.append(`\n                        <a href="${siteUrl}" class="search-img-site-btn" target="_blank" title="${site.name}">\n                        <input type="checkbox" \n                               class="site-checkbox" \n                               data-site-name="${site.name}" \n                               style="margin-right: 5px"\n                               ${isChecked ? "checked" : ""}>\n                            <img src="${site.ico}" alt="${site.name}">\n                            <span>${site.name}</span>\n                        </a>\n                    `);
                        }));
                        $siteBtnsContainer.on("change", ".site-checkbox", (function() {
                            const siteName = $(this).data("site-name");
                            selectedSites[siteName] = $(this).is(":checked");
                            localStorage.setItem(key, JSON.stringify(selectedSites));
                        }));
                        $siteBtnsContainer.show();
                    } finally {
                        this.isUploading = !1;
                    }
                }
            } else show.info("请粘贴或上传图片");
        }));
        $cancelBtn.on("click", (() => {
            $previewArea.hide();
            $urlInputContainer.hide();
            $fileInput.val("");
            $imageUrlInput.val("");
        }));
        $imageUrlInput.on("change", (() => {
            if (utils.isUrl($imageUrlInput.val())) {
                $previewImage.attr("src", $imageUrlInput.val());
                $previewArea.show();
            }
        }));
        $("#openAll").on("click", (() => {
            $(".search-img-site-btn").each((function() {
                $(this).find(".site-checkbox").is(":checked") && window.open($(this).attr("href"));
            }));
        }));
    }
    resetSearchUI() {
        $("#action-btns").show();
        $("#search-results").hide();
        $("#search-img-site-btns-container").hide().empty();
    }
    handleImageFile(file) {
        const previewImage = document.getElementById("preview-image"), previewArea = document.getElementById("preview-area"), urlInputContainer = document.getElementById("url-input-container");
        if (!file.type.match("image.*")) {
            show.info("请选择图片文件");
            return;
        }
        const reader = new FileReader;
        reader.onload = e => {
            previewImage.src = e.target.result;
            previewArea.style.display = "block";
            urlInputContainer.style.display = "none";
            $("#handle-btn")[0].click();
        };
        reader.readAsDataURL(file);
    }
    async searchByImage(imageSrc) {
        let loadObj = loading();
        try {
            let imageUrl = imageSrc;
            if (imageSrc.startsWith("data:")) {
                show.info("开始上传图片...");
                const imgurUrl = await async function(base64Data) {
                    var _a2;
                    const matches = base64Data.match(/^data:(.+);base64,(.+)$/);
                    if (!matches || matches.length < 3) throw new Error("无效的Base64图片数据");
                    const mimeType = matches[1], imageData = matches[2], byteCharacters = atob(imageData), byteNumbers = new Array(byteCharacters.length);
                    for (let i = 0; i < byteCharacters.length; i++) byteNumbers[i] = byteCharacters.charCodeAt(i);
                    const byteArray = new Uint8Array(byteNumbers), blob = new Blob([ byteArray ], {
                        type: mimeType
                    }), formData = new FormData;
                    formData.append("image", blob);
                    const idKey = "jhs_imgurClientId";
                    let clientId = localStorage.getItem(idKey);
                    if (!clientId) {
                        clientId = window.prompt("请输入您自己的Imgur Client-ID（可前往 https://api.imgur.com/oauth2/addclient 免费申请）用于图片上传搜索:");
                        if (!clientId) throw new Error("未提供Imgur Client-ID，无法上传图片");
                        localStorage.setItem(idKey, clientId);
                    }
                    const response = await fetch("https://api.imgur.com/3/image", {
                        method: "POST",
                        headers: {
                            Authorization: `Client-ID ${clientId}`
                        },
                        body: formData
                    }), data = await response.json();
                    if (data.success && data.data && data.data.link) return data.data.link;
                    throw new Error((null == (_a2 = data.data) ? void 0 : _a2.error) || "上传到Imgur失败");
                }(imageSrc);
                if (!imgurUrl) {
                    show.error("上传到失败");
                    return;
                }
                imageUrl = imgurUrl;
            }
            return imageUrl;
        } catch (error) {
            show.error(`搜索失败: ${error.message}`);
            console.error("搜索失败:", error);
        } finally {
            loadObj.close();
        }
    }
}


export { ImageRecognitionPlugin };

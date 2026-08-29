import { BasePlugin } from '../core/base-plugin.js';
import { __publicField } from '../core/constants.js';

class NavBarPlugin extends BasePlugin {
    getName() {
        return "NavBarPlugin";
    }
    async initCss() {
        return "\n            .highlight-red {\n    /* 核心要求：高亮红色文本 */\n    color: red !important; \n    \n    /* 建议：增加字体加粗，效果更明显 */\n    font-weight: bold;\n    \n    /* 建议：增加背景色，效果更突出 */\n    /* background-color: yellow; */ \n}\n        ";
    }
    handle() {
        this.margeNav();
        this.hookSearch();
        this.hookOldSearch();
        this.toggleOtherNavItem();
        $(window).resize(this.toggleOtherNavItem);
        if (window.location.href.includes("/search")) {
            const urlParams = new URLSearchParams(window.location.search);
            let q = urlParams.get("q"), f = urlParams.get("f");
            $("#search-keyword").val(q);
            f && $("#search-type").val(f);
            q && this.highlightKeyword(q);
        }
    }
    highlightKeyword(keyword) {
        const trimedKeyword = keyword.trim();
        if (!trimedKeyword) return;
        const lowerCaseKeyword = trimedKeyword.toLowerCase();
        $(".video-title strong, .actor-box strong").each((function() {
            const $strongElement = $(this);
            $strongElement.text().toLowerCase().includes(lowerCaseKeyword) && $strongElement.addClass("highlight-red");
        }));
    }
    hookSearch() {
        $("#navbar-menu-hero").after('\n            <div class="navbar-menu" id="search-box">\n                <div class="navbar-start" style="display: flex; align-items: center; gap: 5px;">\n                    <select id="search-type" style="padding: 8px 12px; border: 1px solid #555; border-radius: 4px; background-color: #333; color: #eee; font-size: 14px; outline: none;">\n                        <option value="all">影片</option>\n                        <option value="actor">演員</option>\n                        <option value="series">系列</option>\n                        <option value="maker">片商</option>\n                        <option value="director">導演</option>\n                        <option value="code">番號</option>\n                        <option value="list">清單</option>\n                    </select>\n                    <input id="search-keyword" type="text" placeholder="輸入影片番號，演員名等關鍵字進行檢索" style="padding: 8px 12px; border: 1px solid #555; border-radius: 4px; flex-grow: 1; font-size: 14px; background-color: #333; color: #eee; outline: none;">\n                    <a href="/advanced_search?noFold=1" title="進階檢索" style="padding: 6px 12px; background-color: #444; border-radius: 4px; text-decoration: none; color: #ddd; font-size: 14px; border: 1px solid #555;"><span>...</span></a>\n                    <a id="search-img-btn" style="padding: 6px 16px; background-color: #444; color: #fff; border-radius: 4px; text-decoration: none; font-weight: 500; cursor: pointer; border: 1px solid #555;">识图</a>\n                    <a id="search-btn" style="padding: 6px 16px; background-color: #444; color: #fff; border-radius: 4px; text-decoration: none; font-weight: 500; cursor: pointer; border: 1px solid #555;">檢索</a>\n                </div>\n            </div>\n        ');
        $("#search-keyword").on("paste", (event => {
            const items = event.originalEvent.clipboardData.items;
            for (let i = 0; i < items.length; i++) if (-1 !== items[i].type.indexOf("image")) {
                const blob = items[i].getAsFile();
                $("#search-keyword").blur();
                const imageRecognitionPlugin = this.getBean("ImageRecognitionPlugin");
                imageRecognitionPlugin.open((() => {
                    imageRecognitionPlugin.handleImageFile(blob);
                    imageRecognitionPlugin.resetSearchUI();
                }));
                return;
            }
            setTimeout((() => {
                $("#search-btn").click();
            }), 0);
        })).on("keypress", (event => {
            "Enter" === event.key && setTimeout((() => {
                $("#search-btn").click();
            }), 0);
        }));
        $("#search-btn").on("click", (event => {
            let keyword = $("#search-keyword").val(), searchCurrentType = $("#search-type option:selected").val();
            "" !== keyword && (window.location.href.includes("/search") ? window.location.href = "/search?q=" + keyword + "&f=" + searchCurrentType : window.open("/search?q=" + keyword + "&f=" + searchCurrentType));
        }));
        $("#search-img-btn").on("click", (() => {
            this.getBean("ImageRecognitionPlugin").open();
        }));
    }
    hookOldSearch() {
        const searchImage = document.querySelector(".search-image");
        if (!searchImage) return;
        const clonedImage = searchImage.cloneNode(!0);
        searchImage.parentNode.replaceChild(clonedImage, searchImage);
        $("#button-search-image").attr("data-tooltip", "以图识图");
        $(".search-image").on("click", (event => {
            this.getBean("ImageRecognitionPlugin").open();
        }));
    }
    margeNav() {
        $('a[href*="/feedbacks/new"]').remove();
        $('a[href*="theporndude.com"]').remove();
        $('a.navbar-link[href="/makers"]').parent().after('\n            <div class="navbar-item has-dropdown is-hoverable">\n                <a class="navbar-link">其它</a>\n                <div class="navbar-dropdown is-boxed">\n                  <a class="navbar-item" href="/feedbacks/new" target="_blank" >反饋</a>\n                  <a class="navbar-item" rel="nofollow noopener" target="_blank" href="https://theporndude.com/zh">ThePornDude</a>\n                </div>\n              </div>\n        ');
    }
    toggleOtherNavItem() {
        let $searchBox = $("#search-box"), $oldSearchBox = $("#search-bar-container");
        if ($(window).width() < 1600 && $(window).width() > 1023) {
            $searchBox.hide();
            $oldSearchBox.show();
        }
        if ($(window).width() > 1600) {
            $searchBox.show();
            $oldSearchBox.hide();
        }
    }
}

export { NavBarPlugin };
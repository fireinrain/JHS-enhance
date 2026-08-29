import { BasePlugin } from '../core/base-plugin.js';
import { __publicField, currentHref, NO, YES } from '../core/constants.js';

class FoldCategoryPlugin extends BasePlugin {
    getName() {
        return "FoldCategoryPlugin";
    }
    async initCss() {
        const settingObj = await storageManager.getSetting();
        return `\n            <style>\n                #tags a.tag, .tags a.tag {\n                    position:relative;\n                }\n                .highlight-btn {\n                    position: absolute;\n                    top: -10px;\n                    right: -10px;\n                    background-color: #4CAF50;\n                    color: white;\n                    border: none;\n                    border-radius: 50%;\n                    width: 24px;\n                    height: 24px;\n                    font-size: 14px;\n                    line-height: 24px;\n                    text-align: center;\n                    cursor: pointer;\n                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);\n                    display: none;\n                    z-index: 999;\n                }\n                /* 当父元素被高亮时，按钮变为其他颜色 */\n                .highlighted .highlight-btn {\n                    background-color: #FF5722;\n                }\n                /* 高亮状态下的标签样式 */\n                .highlighted {\n                    /* 浅黄色 */\n                    border: ${settingObj.highlightedTagNumber || 1}px solid ${settingObj.highlightedTagColor || "#ce2222"};\n                }\n            </style>\n        `;
    }
    async handle() {
        if (window.isListPage && !currentHref.includes("advanced_search")) {
            this.highlightTag();
            utils.loopDetector((() => $("#waitCheckBtn").length), (() => {
                this.createFoldBtn();
            }), 1, 1e4, !0);
            $("#tags .tag-category .tag-expand").each(((index, el) => {
                $(el).parent().hasClass("collapse") && el.click();
            }));
        }
    }
    highlightTag() {
        (async () => {
            const tags = await storageManager.getHighlightedTags();
            tags && tags.forEach((text => {
                $(`#tags a.tag:contains(${text})`).addClass("highlighted");
                $(`.tags a.tag:contains(${text})`).addClass("highlighted");
            }));
        })().then();
        $("#tags a.tag, .tags a.tag").hover((function() {
            const $tag = $(this), button = $('<button class="highlight-btn" title="高亮显示">★</button>');
            $tag.append(button);
            button.fadeIn(0);
        }), (function() {
            $(this).find(".highlight-btn").fadeOut(0, (function() {
                $(this).remove();
            }));
        }));
        $(document).on("click", ".highlight-btn", (async function(e) {
            e.stopPropagation();
            e.preventDefault();
            const $tag = $(this).closest("a.tag"), clonedTag = $tag.clone();
            clonedTag.find(".highlight-btn").remove();
            const tagText = clonedTag.text().trim().replace(/\s*\(\d+\)$/, "");
            let highlightedTags = await storageManager.getHighlightedTags();
            if (highlightedTags.includes(tagText)) {
                highlightedTags = highlightedTags.filter((item => item !== tagText));
                $tag.removeClass("highlighted");
            } else {
                highlightedTags.push(tagText);
                $tag.addClass("highlighted");
            }
            await storageManager.setHighlightedTags(highlightedTags);
        }));
    }
    async createFoldBtn() {
        const foldCategoryHotKey = await storageManager.getSetting("foldCategoryHotKey");
        let $subTags = $("#tags"), checkTagStr = $("#tags dl div.tag.is-info").map((function() {
            return $(this).text().replaceAll("\n", "").replaceAll(" ", "");
        })).get().join(" ");
        if (!checkTagStr) return;
        $(".tabs").append(`\n            <div style="display: flex;align-items: center;flex-grow:1;justify-content: flex-end;">\n                <div>已选分类: <span id="jhs-check-tag">${checkTagStr}</span></div>\n                <a class="menu-btn  main-tab-btn" id="foldCategoryBtn" style="background-color:#d23e60 !important;">\n                    <span></span>\n                    ${foldCategoryHotKey ? ` (${foldCategoryHotKey})` : ""}\n                    <i style="margin-left: 10px"></i>\n                </a>\n\n            </div>\n        `);
        let $section = $("h2.section-title");
        if ($section.length > 0) {
            $section.append('\n                <div id="foldCategoryBtn">\n                    <a class="menu-btn" style="background-color:#d23e60 !important;margin-left: 20px;border-bottom:none !important;border-radius:3px;">\n                        <span></span>\n                        <i style="margin-left: 10px"></i>\n                    </a>\n                </div>\n            ');
            $subTags = $("section > div > div.box");
        }
        if (!$subTags) return;
        let $foldCategoryBtn = $("#foldCategoryBtn"), isFolded = localStorage.getItem("jhs_foldCategory") === YES, [newText, newIcon] = isFolded ? [ "展开", "icon-angle-double-down" ] : [ "折叠", "icon-angle-double-up" ];
        $foldCategoryBtn.find("span").text(newText).end().find("i").attr("class", newIcon);
        window.location.href.includes("noFold=1") || $subTags[isFolded ? "hide" : "show"]();
        $foldCategoryBtn.on("click", (async event => {
            event.preventDefault();
            isFolded = !isFolded;
            localStorage.setItem("jhs_foldCategory", isFolded ? YES : NO);
            const [newText2, newIcon2] = isFolded ? [ "展开", "icon-angle-double-down" ] : [ "折叠", "icon-angle-double-up" ];
            $foldCategoryBtn.find("span").text(newText2).end().find("i").attr("class", newIcon2);
            $subTags[isFolded ? "hide" : "show"]();
        }));
    }
}


export { FoldCategoryPlugin };

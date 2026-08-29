import { BasePlugin } from '../core/base-plugin.js';
import { __publicField } from '../core/constants.js';

class BusDetailPagePlugin extends BasePlugin {
    getName() {
        return "BusDetailPagePlugin";
    }
    async initCss() {
        if (!window.isDetailPage) return "";
        $("h4:contains('推薦')").hide();
    }
    async handle() {
        if (window.location.href.includes("/star/")) {
            const $avatarBox = $(".avatar-box");
            if ($avatarBox.length > 0) {
                let parent2 = $avatarBox.parent();
                parent2.css("position", "initial");
                parent2.insertBefore(parent2.parent());
            }
        }
        $(".genre a").each((function() {
            const href2 = $(this).attr("href");
            href2 && (href2.startsWith("http://") || href2.startsWith("https://") || href2.startsWith("/")) && $(this).attr("target", "_blank");
        }));
        this.addCopyCarNumBtn();
    }
    addCopyCarNumBtn() {
        let headerSpan = null;
        const headerSpans = document.querySelectorAll("span.header");
        for (const span of headerSpans) if ("識別碼:" === span.textContent.trim()) {
            headerSpan = span;
            break;
        }
        if (headerSpan) {
            const targetSpan = headerSpan.nextElementSibling;
            if (targetSpan && "SPAN" === targetSpan.tagName) {
                const identifierText = targetSpan.textContent.trim(), copyButton = document.createElement("button");
                copyButton.textContent = "复制";
                copyButton.style.marginLeft = "10px";
                copyButton.style.padding = "0 10px";
                copyButton.style.cursor = "pointer";
                copyButton.style.border = "1px solid #ccc";
                copyButton.style.borderRadius = "5px";
                copyButton.style.backgroundColor = "#f0f0f0";
                copyButton.style.fontSize = "12px";
                copyButton.addEventListener("click", (function(event) {
                    event.preventDefault();
                    const copyAction = text => {
                        this.textContent = "已复制";
                        setTimeout((() => {
                            this.textContent = "复制";
                        }), 1500);
                    };
                    navigator.clipboard && navigator.clipboard.writeText && navigator.clipboard.writeText(identifierText).then((() => copyAction())).catch((err => {
                        console.error("无法通过标准API复制:", err);
                        alert("复制失败，请手动复制: " + identifierText);
                    }));
                }));
                targetSpan.parentNode.insertBefore(copyButton, targetSpan.nextSibling);
            }
        }
    }
}


export { BusDetailPagePlugin };

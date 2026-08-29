import { BasePlugin } from '../core/base-plugin.js';
import { __publicField, isJavBus, YES } from '../core/constants.js';
import { translateText } from './list-page-button.js';

class TranslatePlugin extends BasePlugin {
    getName() {
        return "TranslatePlugin";
    }
    async initCss() {
        return "\n            <style> \n                .translated-title {\n                    margin-top: 8px; \n                    padding: 12px; \n                    border-radius: 5px; \n                    border-left: 4px solid rgb(76, 175, 80);\n                    background: linear-gradient(135deg, rgb(255, 255, 255) 0%, rgb(245, 245, 245) 100%); \n                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.08);\n                    font-size: 20px;\n                }\n            </style>\n        ";
    }
    handle() {
        window.isDetailPage && this.translate();
    }
    async translate(carNum2, showCarNum = !0) {
        if (await storageManager.getSetting("translateTitle", YES) !== YES) return;
        isJavBus && (showCarNum = !1);
        let $titleElement = $(".origin-title");
        $titleElement.length || ($titleElement = $(".current-title"));
        $titleElement.length || ($titleElement = $("h3"));
        if (!$titleElement.length) return;
        const originalText = $titleElement.text().trim();
        if (!originalText) {
            show.error("获取标题失败, 无法进行翻译");
            return;
        }
        $titleElement.after('<div class="translated-title">翻译中...</div>');
        const $loadingElement = $titleElement.next(".translated-title");
        carNum2 || (carNum2 = this.getPageInfo().carNum);
        const cache = localStorage.getItem("jhs_translate") ? JSON.parse(localStorage.getItem("jhs_translate")) : {};
        cache[carNum2] ? $loadingElement.html(showCarNum ? carNum2 + "&nbsp;&nbsp;&nbsp;" + cache[carNum2] : cache[carNum2]) : translateText(originalText, "ja", "zh-CN").then((translatedText => {
            $loadingElement.html(showCarNum ? carNum2 + "&nbsp;&nbsp;&nbsp;" + translatedText : translatedText);
        })).catch((error => {
            console.error("翻译失败:", error);
            $loadingElement.replaceWith(`<div class="translated-title" style="color: red;">翻译失败: ${error.message}</div>`);
        }));
    }
}


export { TranslatePlugin };
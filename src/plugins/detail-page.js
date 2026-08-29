import { BasePlugin } from '../core/base-plugin.js';
import { __publicField } from '../core/constants.js';

const _unsafeWindow = (() => typeof unsafeWindow !== 'undefined' ? unsafeWindow : window)();

class DetailPagePlugin extends BasePlugin {
    getName() {
        return "DetailPagePlugin";
    }
    constructor() {
        super();
    }
    handle() {
        if (window.isDetailPage) {
            $(".video-meta-panel a").each((function() {
                const href = $(this).attr("href");
                href && (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("/")) && $(this).attr("target", "_blank");
            }));
            this.handleFancyBox();
        }
    }
    handleFancyBox() {
        document.addEventListener("click", (function(e) {
            if (e.target.closest(".fancybox-button--thumbs")) {
                const isVisible = !$(".fancybox-thumbs").is(":hidden");
                localStorage.setItem("jhs_fancyboxThumbs", isVisible.toString());
                _unsafeWindow.$.fancybox.defaults.thumbs.autoStart = isVisible;
            }
        }));
        if (void 0 !== _unsafeWindow.$.fancybox) {
            const savedState = localStorage.getItem("jhs_fancyboxThumbs");
            _unsafeWindow.$.fancybox.defaults.thumbs.autoStart = "true" === savedState;
        }
    }
}



export { DetailPagePlugin };
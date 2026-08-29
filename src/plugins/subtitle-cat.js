import { BasePlugin } from '../core/base-plugin.js';
import { __publicField } from '../core/constants.js';

class SubTitleCatPlugin extends BasePlugin {
    getName() {
        return "SubTitleCatPlugin";
    }
    handle() {
        $(".t-banner-inner").hide();
        $("#navbar").hide();
        let keyword = new URLSearchParams(window.location.search).get("search").toLowerCase(), findList = $(".sub-table tr td a").toArray(), visibleCount = 0;
        findList.forEach((el => {
            let item = $(el);
            item.text().toLowerCase().includes(keyword) ? visibleCount++ : item.parent().parent().hide();
        }));
        0 === visibleCount && show.error("该番号无字幕!");
        const $secTitle = $(".sec-title"), newHTML = $secTitle.html().replace(/^\d+/, visibleCount);
        $secTitle.html(newHTML);
    }
}


export { SubTitleCatPlugin };

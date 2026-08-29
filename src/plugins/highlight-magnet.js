import { BasePlugin } from '../core/base-plugin.js';
import { __publicField, isJavBus, isJavDb } from '../core/constants.js';

class HighlightMagnetPlugin extends BasePlugin {
    getName() {
        return "HighlightMagnetPlugin";
    }
    doFilterMagnet() {
        this.handleDb();
        this.handleBus();
    }
    handleDb() {
        if (!isJavDb) return;
        let magnetNameList = $("#magnets-content .name");
        if (0 === magnetNameList.length) return;
        const HIGH_QUALITY_KEYWORDS = [ "4k", "-c", "-u", "-uc" ];
        let hasHighQuality = !1;
        magnetNameList.each(((_, el) => {
            const $el = $(el), text = $el.text().toLowerCase(), isHighQuality = HIGH_QUALITY_KEYWORDS.some((keyword => text.includes(keyword)));
            $el.parent().parent().parent().addClass("magnet-row");
            text.includes("4k") && $el.css("color", "#f40");
            if (isHighQuality) {
                hasHighQuality = !0;
                $el.parent().parent().parent().addClass("high-quality");
            }
        }));
        hasHighQuality ? $("#magnets-content .magnet-row").not(".high-quality").hide() : $("#enable-magnets-filter").addClass("do-hide");
    }
    handleBus() {
        isJavBus && window.isDetailPage && utils.loopDetector((() => $("#magnet-table td a").length > 0), (() => {
            const rows = $("#magnet-table tr"), QUALITY_KEYWORDS = [ "4k", "-c", "-u", "-uc" ];
            let hasHighQuality = !1;
            rows.each(((_, row) => {
                const $row = $(row), $firstTd = $row.find("td:first-child"), $firstLink = $firstTd.find("a:first-child"), $secondLink = $firstTd.find("a:nth-child(2)"), linkText = $firstLink.text().toLowerCase();
                linkText.includes("4k") && $firstLink.css("color", "#f40");
                if (QUALITY_KEYWORDS.some((keyword => linkText.includes(keyword))) || $secondLink.length && $secondLink.text().includes("字幕")) {
                    hasHighQuality = !0;
                    $row.addClass("high-quality");
                }
            }));
            hasHighQuality ? rows.each(((_, row) => {
                const $row = $(row);
                $row.hasClass("high-quality") || $row.hide();
            })) : $("#enable-magnets-filter").addClass("do-hide");
        }));
    }
    showAll() {
        if (isJavDb) {
            $("#magnets-content .item").toArray().forEach((el => $(el).show()));
        }
        isJavBus && $("#magnet-table tr").toArray().forEach((el => $(el).show()));
    }
}


export { HighlightMagnetPlugin };
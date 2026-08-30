import { BasePlugin } from '../core/base-plugin.js';
import { __publicField, isJavBus, isJavDb } from '../core/constants.js';

class HighlightMagnetPlugin extends BasePlugin {
    getName() {
        return "HighlightMagnetPlugin";
    }

    parseDateFromAttr(dateStr) {
        if (!dateStr) return 0;
        if (dateStr.length === 8) {
            const y = parseInt(dateStr.substring(0, 4), 10);
            const m = parseInt(dateStr.substring(4, 6), 10) - 1;
            const d = parseInt(dateStr.substring(6, 8), 10);
            const date = new Date(y, m, d);
            return isNaN(date.getTime()) ? 0 : date.getTime();
        }
        const d = new Date(dateStr);
        return isNaN(d.getTime()) ? 0 : d.getTime();
    }

    parseSizeToBytes(sizeText) {
        if (!sizeText) return 0;
        const s = sizeText.trim().toUpperCase();
        const num = parseFloat(s);
        if (isNaN(num)) return 0;
        if (s.includes('TB')) return num * 1024 * 1024 * 1024 * 1024;
        if (s.includes('GB')) return num * 1024 * 1024 * 1024;
        if (s.includes('MB')) return num * 1024 * 1024;
        if (s.includes('KB')) return num * 1024;
        return num;
    }

    getRowInfo(row) {
        const $row = $(row);
        const nameText = $row.find('.name').text().toLowerCase();
        const tags = [];
        $row.find('.tags .tag').each((_, tag) => tags.push($(tag).text().toLowerCase()));
        const sizeMB = parseInt($row.attr('data-size'), 10) || 0;
        const files = parseInt($row.attr('data-files'), 10) || 0;
        const dateStr = $row.attr('data-date') || '';
        return {
            row: row,
            $row: $row,
            nameText: nameText,
            date: this.parseDateFromAttr(dateStr),
            dateStr: dateStr,
            size: sizeMB * 1024 * 1024,
            files: files,
            tags: tags,
            is4K: nameText.includes('4k') || nameText.includes('[4k]') || tags.includes('4k'),
            isHD: nameText.includes('高清') || tags.includes('高清'),
            isSubtitle: nameText.includes('字幕') || nameText.includes('-c') || nameText.includes('.chs') || nameText.includes('.cht') || nameText.includes('.chi') || tags.includes('字幕'),
            isUncensored: nameText.includes('无码') || nameText.includes('無碼') || nameText.includes('-u') || nameText.includes('-uc') || tags.includes('无码') || tags.includes('無碼'),
        };
    }

    getRowInfoForBus(row) {
        const $row = $(row);
        const $nameCell = $row.find('td:first-child');
        const nameText = ($nameCell.find('a:first-child').text() || '').toLowerCase().trim();
        const sizeText = ($row.find('td:nth-child(2)').text() || '').trim();
        const dateText = ($row.find('td:nth-child(3)').text() || '').trim();
        const hasHDButton = $nameCell.find('a.btn-primary').text().includes('高清');
        return {
            row: row,
            $row: $row,
            nameText: nameText,
            date: this.parseDateFromAttr(dateText),
            dateStr: dateText,
            size: this.parseSizeToBytes(sizeText),
            files: 0,
            tags: [],
            is4K: nameText.includes('4k') || nameText.includes('[4k]'),
            isHD: hasHDButton || nameText.includes('高清'),
            isSubtitle: nameText.includes('字幕') || nameText.includes('-c') || nameText.includes('.chs') || nameText.includes('.cht') || nameText.includes('.chi'),
            isUncensored: nameText.includes('无码') || nameText.includes('無碼') || nameText.includes('-u') || nameText.includes('-uc'),
        };
    }

    async applySortAndFilter(settings) {
        if (isJavBus) {
            return this.applySortAndFilterForBus(settings);
        }
        if (!isJavDb) return;
        const $container = $("#magnets-content");
        const $rows = $container.find(".item[data-rank]");
        if (0 === $rows.length) return;
        const rowInfos = $rows.toArray().map(row => this.getRowInfo(row));
        const {filterHD, filter4K, filterSubtitle, filterUncensored, sortOrder} = settings;
        const anyFilterEnabled = filterHD || filter4K || filterSubtitle || filterUncensored;
        let visibleInfos = rowInfos;
        if (anyFilterEnabled) {
            visibleInfos = rowInfos.filter(info => {
                if (filterHD && info.isHD) return !0;
                if (filter4K && info.is4K) return !0;
                if (filterSubtitle && info.isSubtitle) return !0;
                if (filterUncensored && info.isUncensored) return !0;
                return !1;
            });
        }
        if (sortOrder && sortOrder.length > 0) {
            visibleInfos.sort((a, b) => {
                for (const key of sortOrder) {
                    let cmp = 0;
                    switch (key) {
                        case 'date':
                            cmp = b.date - a.date;
                            break;
                        case 'size':
                            cmp = b.size - a.size;
                            break;
                        case 'files':
                            cmp = a.files - b.files;
                            break;
                    }
                    if (0 !== cmp) return cmp;
                }
                return 0;
            });
        }
        const container = document.getElementById("magnets-content");
        if (!container) return;
        const hiddenInfos = rowInfos.filter(info => !visibleInfos.includes(info));
        const reviewsContainer = document.getElementById("reviewsContainer");
        const insertRef = reviewsContainer && reviewsContainer.parentNode === container
            ? (reviewsContainer.previousElementSibling || reviewsContainer)
            : null;
        const fragment = document.createDocumentFragment();
        visibleInfos.forEach(info => fragment.appendChild(info.row));
        hiddenInfos.forEach(info => fragment.appendChild(info.row));
        if (insertRef) {
            container.insertBefore(fragment, insertRef);
        } else {
            container.appendChild(fragment);
        }
        visibleInfos.forEach(info => {
            if (info.is4K) {
                info.$row.addClass('magnet-4k-highlight');
            }
        });
        hiddenInfos.forEach(info => $(info.row).hide());
    }

    applySortAndFilterForBus(settings) {
        const $table = $("#magnet-table");
        if (!$table.length) return;
        const allRows = $table.find("tr").toArray();
        const headerRow = allRows.find(r => $(r).find('td').length === 0 || $(r).css('font-weight') === 'bold' || $(r).css('fontWeight') === 'bold' || $(r).css('font-weight') === '700');
        const dataRows = headerRow ? allRows.filter(r => r !== headerRow) : allRows.slice(1);
        if (0 === dataRows.length) return;
        const rowInfos = dataRows.map(row => this.getRowInfoForBus(row));
        const {filterHD, filter4K, filterSubtitle, filterUncensored, sortOrder} = settings;
        const anyFilterEnabled = filterHD || filter4K || filterSubtitle || filterUncensored;
        let visibleInfos = rowInfos;
        if (anyFilterEnabled) {
            visibleInfos = rowInfos.filter(info => {
                if (filterHD && info.isHD) return !0;
                if (filter4K && info.is4K) return !0;
                if (filterSubtitle && info.isSubtitle) return !0;
                if (filterUncensored && info.isUncensored) return !0;
                return !1;
            });
        }
        if (sortOrder && sortOrder.length > 0) {
            visibleInfos.sort((a, b) => {
                for (const key of sortOrder) {
                    let cmp = 0;
                    switch (key) {
                        case 'date':
                            cmp = b.date - a.date;
                            break;
                        case 'size':
                            cmp = b.size - a.size;
                            break;
                    }
                    if (0 !== cmp) return cmp;
                }
                return 0;
            });
        }
        const hiddenInfos = rowInfos.filter(info => !visibleInfos.includes(info));
        const fragment = document.createDocumentFragment();
        visibleInfos.forEach(info => fragment.appendChild(info.row));
        hiddenInfos.forEach(info => fragment.appendChild(info.row));
        const insertAnchor = headerRow || $table.find("tr").first()[0];
        if (insertAnchor && insertAnchor.nextSibling) {
            $(insertAnchor).after(fragment);
        } else {
            $table.append(fragment);
        }
        visibleInfos.forEach(info => {
            if (info.is4K) {
                info.$row.addClass('magnet-4k-highlight');
            }
        });
        hiddenInfos.forEach(info => $(info.row).hide());
    }

    showAll() {
        if (isJavDb) {
            $("#magnets-content .item[data-rank]").toArray().forEach((el => {
                $(el).show();
                $(el).removeClass('magnet-4k-highlight');
            }));
        }
        if (isJavBus) {
            $("#magnet-table tr").toArray().forEach((el => {
                $(el).show();
                $(el).removeClass('magnet-4k-highlight');
            }));
        }
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
}


export { HighlightMagnetPlugin };
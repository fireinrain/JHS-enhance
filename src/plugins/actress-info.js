import { BasePlugin } from '../core/base-plugin.js';
import { __publicField } from '../core/constants.js';

class ActressInfoPlugin extends BasePlugin {
    constructor() {
        super(...arguments);
        __publicField(this, "apiUrl", "https://ja.wikipedia.org/wiki/");
    }
    getName() {
        return "ActressInfoPlugin";
    }
    async handle() {
        "yes" === await storageManager.getSetting("enableLoadActressInfo", "yes") && this.loadActressInfo();
    }
    loadActressInfo() {
        this.handleDetailPage().then();
        this.handleStarPage().then();
    }
    async initCss() {
        return "\n            <style>\n                .info-tag {\n                    background-color: #ecf5ff;\n                    display: inline-block;\n                    height: 32px;\n                    padding: 0 10px;\n                    line-height: 30px;\n                    font-size: 12px;\n                    color: #409eff;\n                    border: 1px solid #d9ecff;\n                    border-radius: 4px;\n                    box-sizing: border-box;\n                    white-space: nowrap;\n                }\n            </style>\n        ";
    }
    async handleDetailPage() {
        if ($(".actress-info").length > 0) return;
        let nameList = $(".female").prev().map(((i, el) => $(el).text().trim())).get();
        if (!nameList.length) return;
        const cacheKey = "jhs_actress_info", cacheData = localStorage.getItem(cacheKey) ? JSON.parse(localStorage.getItem(cacheKey)) : {};
        let result = null, infoHtml = "";
        for (let i = 0; i < nameList.length; i++) {
            let name2 = nameList[i];
            result = cacheData[name2];
            if (!result) try {
                result = await this.searchInfo(name2);
                result && (cacheData[name2] = result);
            } catch (e) {
                console.error("该名称查询失败,尝试其它名称");
            }
            let contentHtml = "";
            contentHtml = result ? `\n                    <div class="panel-block actress-info">\n                        <strong>${name2}:</strong>\n                        <a href="${result.url}" style="margin-left: 5px" target="_blank">\n                            <span class="info-tag">${result.birthday} ${result.age}</span>\n                            <span class="info-tag">${result.height} ${result.weight}</span>\n                            <span class="info-tag">${result.threeSizeText} ${result.braSize}</span>\n                        </a>\n                    </div>\n                ` : `<div class="panel-block actress-info"><a href="${this.apiUrl + name2}" target="_blank"><strong>${name2}:</strong></a></div> `;
            infoHtml += contentHtml;
        }
        $('strong:contains("演員")').parent().after(infoHtml);
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    }
    async handleStarPage() {
        if ($(".actress-info").length > 0) return;
        let nameList = [], $actor = $(".actor-section-name");
        $actor.length && $actor.text().trim().split(",").forEach((name2 => {
            nameList.push(name2.trim());
        }));
        let $sectionMeta = $(".section-meta:not(:contains('影片'))");
        $sectionMeta.length && $sectionMeta.text().trim().split(",").forEach((name2 => {
            nameList.push(name2.trim());
        }));
        if (!nameList.length) return;
        const cacheKey = "jhs_actress_info", cacheData = localStorage.getItem(cacheKey) ? JSON.parse(localStorage.getItem(cacheKey)) : {};
        let result = null;
        for (let i = 0; i < nameList.length; i++) {
            let name2 = nameList[i];
            result = cacheData[name2];
            if (result) break;
            try {
                result = await this.searchInfo(name2);
            } catch (e) {
                console.error("该名称查询失败,尝试其它名称");
            }
            if (result) break;
        }
        result && nameList.forEach((name2 => {
            cacheData[name2] = result;
        }));
        let contentHtml = '<div class="actress-info" style="font-size: 17px; font-weight: normal; margin-top: 5px;">无此相关演员信息</div>';
        result && (contentHtml = `\n                <a class="actress-info" href="${result.url}" target="_blank">\n                    <div style="font-size: 17px; font-weight: normal; margin-top: 5px;">\n                        <div style="display: flex; margin-bottom: 10px;">\n                            <span style="width: 300px;">出生日期: ${result.birthday}</span>\n                            <span style="width: 200px;">年龄: ${result.age}</span>\n                            <span style="width: 200px;">身高: ${result.height}</span>\n                        </div>\n                        <div style="display: flex; margin-bottom: 10px;">\n                            <span style="width: 300px;">体重: ${result.weight}</span>\n                            <span style="width: 200px;">三围: ${result.threeSizeText}</span>\n                            <span style="width: 200px;">罩杯: ${result.braSize}</span>\n                        </div>\n                    </div>\n                </a>\n            `);
        $actor.parent().append(contentHtml);
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    }
    async searchInfo(name2) {
        "三上悠亞" === name2 && (name2 = "三上悠亜");
        let url = this.apiUrl + name2;
        const html = await gmHttp.get(url), parser = new DOMParser, $dom = $(parser.parseFromString(html, "text/html"));
        let birthday = $dom.find('a[title="誕生日"]').parent().parent().find("td").text().trim(), age = $dom.find("th:contains('現年齢')").parent().find("td").text().trim() ? parseInt($dom.find("th:contains('現年齢')").parent().find("td").text().trim()) + "岁" : "", height = $dom.find('tr:has(a[title="身長"]) td').text().trim().split(" ")[0] + "cm", weight = $dom.find('tr:has(a[title="体重"]) td').text().trim().split("/")[1].trim();
        "― kg" === weight && (weight = "");
        return {
            birthday: birthday,
            age: age,
            height: height,
            weight: weight,
            threeSizeText: $dom.find('a[title="スリーサイズ"]').closest("tr").find("td").text().replace("cm", "").trim(),
            braSize: $dom.find('th:contains("ブラサイズ")').next("td").contents().first().text().trim(),
            url: url
        };
    }
}


export { ActressInfoPlugin };

import { BasePlugin } from '../core/base-plugin.js';
import { __publicField, YES } from '../core/constants.js';

class FavoriteActressesPlugin extends BasePlugin {
    getName() {
        return "FavoriteActressesPlugin";
    }
    async handle() {
        this.bindEvent();
        await this.highlightActress();
        this.replaceActressAvatar();
    }
    async highlightActress() {
        if (!window.isDetailPage) return;
        if (await storageManager.getSetting("enableFavoriteActresses", YES) !== YES) return;
        const favoriteActressesInfoList = await storageManager.getFavoriteActressList();
        if (!favoriteActressesInfoList || 0 === favoriteActressesInfoList.length) return;
        const favoriteStarIdSet = new Set;
        favoriteActressesInfoList.forEach((actress => {
            actress.starId && favoriteStarIdSet.add(String(actress.starId).trim());
        }));
        0 !== favoriteStarIdSet.size && $(".female").prev().each(((index, element) => {
            const $element = $(element), href = $element.attr("href");
            let elementStarId = null;
            if (href) {
                const parts = (href.endsWith("/") ? href.slice(0, -1) : href).split("/"), lastPart = parts[parts.length - 1];
                lastPart && (elementStarId = lastPart.trim());
            }
            let isFavorite = !1;
            elementStarId && (isFavorite = favoriteStarIdSet.has(elementStarId));
            if (isFavorite) {
                $element.addClass("highlighted");
                $element.attr("title", "高亮已收藏演员, 可在设置-基础配置中关闭");
            }
        }));
    }
    async removeActorFromStorage(actorId) {
        await storageManager.removeFavoriteActress(actorId) && clog.log("移除演员成功");
    }
    bindEvent() {
        const listIdRegex = /\/actors\/(\w+)\/(collect|uncollect)/;
        $(document).on("confirm:complete", 'a[href*="/actors/"][href*="/uncollect"]', (async event => {
            const [userConfirmed] = event.detail;
            if (!userConfirmed) return;
            const match = $(event.currentTarget).attr("href").match(listIdRegex), actorId = match ? match[1] : null;
            actorId && await this.removeActorFromStorage(actorId);
        }));
        $("#button-collect-actor").click((async event => {
            const match = $("#button-collect-actor").attr("href").match(listIdRegex), actorId = match ? match[1] : null;
            let nameList = [], $actor = $(".actor-section-name");
            $actor.length && $actor.text().trim().split(",").forEach((name2 => {
                nameList.push(name2.trim());
            }));
            let $sectionMeta = $(".section-meta:not(:contains('影片'))");
            $sectionMeta.length && $sectionMeta.text().trim().split(",").forEach((name2 => {
                nameList.push(name2.trim());
            }));
            if (!nameList) {
                clog.error("获取演员名称失败");
                return;
            }
            const actorName = nameList[0];
            if (!actorId) {
                clog.error("无法获取演员ID进行收藏操作。");
                return;
            }
            const avatar = ($(".avatar").first().css("background-image") || "").replace(/^url\(["']?|["']?\)$/g, ""), actressInfo = {
                starId: actorId,
                name: actorName,
                allName: nameList,
                avatar: avatar
            };
            1 === await storageManager.addFavoriteActressList([ actressInfo ]) ? clog.log(`收藏演员成功: ${actorName} (ID: ${actorId})`) : clog.log(`收藏演员失败: ${actorName} (ID: ${actorId})`);
        }));
        $("#button-uncollect-actor").click((async event => {
            const match = $("#button-uncollect-actor").attr("href").match(listIdRegex), actorId = match ? match[1] : null;
            actorId ? await this.removeActorFromStorage(actorId) : clog.error("无法获取演员ID进行取消收藏操作。");
        }));
    }
    async replaceActressAvatar() {
        const actressId = this.getActressId();
        if (!actressId) return;
        const actress = (await storageManager.getFavoriteActressList()).find((item => item.starId === actressId));
        if (actress && actress.avatar) {
            const newAvatarUrl = `url('${actress.avatar}')`;
            let $avatarElement = $(".avatar").first();
            if (0 === $avatarElement.length) {
                const newAvatarHtml = '<div class="column actor-avatar"> <div class="image"> <span class="avatar"></span> </div> </div>';
                $(".section-columns").prepend(newAvatarHtml);
                $avatarElement = $(".avatar").first();
            }
            if (0 === $avatarElement.length) return;
            if ($avatarElement.css("background-image").trim().toLowerCase() !== newAvatarUrl.trim().toLowerCase()) {
                $avatarElement.css("background-image", newAvatarUrl);
                $avatarElement.css("background-size", "cover");
                $avatarElement.css("background-position", "top center");
                $avatarElement.css("background-repeat", "no-repeat");
            }
        }
    }
}


export { FavoriteActressesPlugin };
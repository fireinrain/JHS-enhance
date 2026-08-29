import { BasePlugin } from '../core/base-plugin.js';
import { __publicField, NO, YES } from '../core/constants.js';

class BusImgPlugin extends BasePlugin {
    getName() {
        return "BusImgPlugin";
    }
    handle() {}
    async getVisibleImageItems(itemSelector, imgSelector) {
        let itemList = [];
        const allItems = document.querySelectorAll(itemSelector);
        for (const item of allItems) {
            if (!utils.isHidden(item)) {
                const imgElement = item.querySelector(imgSelector);
                if (!(imgElement instanceof HTMLImageElement)) continue;
                imgElement.style.removeProperty("height");
                let imageHeight = imgElement.offsetHeight;
                imageHeight > 0 && itemList.push({
                    element: item,
                    imgElement: imgElement,
                    height: imageHeight
                });
            }
        }
        return itemList;
    }
    async logImageHeightsByRow() {
        if (await storageManager.getSetting("enableVerticalModel", NO) === YES) return;
        const itemSelector = this.getSelector().itemSelector, containerColumns = await storageManager.getSetting("containerColumns", 5), itemList = await this.getVisibleImageItems(itemSelector, "img");
        if (0 === itemList.length) return;
        const groupedItems = [];
        for (let i = 0; i < itemList.length; i++) {
            const rowIndex = Math.floor(i / containerColumns);
            groupedItems[rowIndex] || (groupedItems[rowIndex] = []);
            groupedItems[rowIndex].push(itemList[i]);
        }
        groupedItems.forEach(((row, rowIndex) => {
            const originalHeights = row.map((item => item.height));
            if (originalHeights.length < 2) return;
            const minHeight = Math.min(...originalHeights), maxHeight = Math.max(...originalHeights);
            let targetHeight = 0;
            if (maxHeight - minHeight > 50) {
                targetHeight = minHeight;
                row.forEach((item => {
                    if (item.height !== targetHeight) {
                        const heightValue = `${targetHeight}px`;
                        item.imgElement.style.setProperty("height", heightValue, "important");
                    }
                }));
            }
        }));
    }
}


export { BusImgPlugin };

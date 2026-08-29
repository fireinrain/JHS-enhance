import { BasePlugin } from '../core/base-plugin.js';
import { __publicField } from '../core/constants.js';

class BusNavBarPlugin extends BasePlugin {
    getName() {
        return "BusNavBarPlugin";
    }
    handle() {
        $("#navbar > div > div > span").append('\n            <button class="btn btn-default" style="color: #0d9488" id="search-img-btn">识图</button>\n       ');
        $("#search-img-btn").on("click", (() => {
            this.getBean("ImageRecognitionPlugin").open();
        }));
    }
}


export { BusNavBarPlugin };

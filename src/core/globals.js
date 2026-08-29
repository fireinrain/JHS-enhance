import $ from 'jquery';
import localforage from 'localforage';
import Toastify from 'toastify-js';
import md5 from 'blueimp-md5';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import Viewer from 'viewerjs';
import QRCode from 'qrcodejs';
import { currentHref, isJavDb, isJavBus, isSearchPage, Status_RUNNING, Status_SUCCESS, Status_FAIL, Status_LOADING, Status_FILTER, Status_FAVORITE, Status_HAS_DOWN, Status_HAS_WATCH, NO, YES } from './constants.js';

window.$ = window.jQuery = $;
window.localforage = localforage;
window.Toastify = Toastify;
window.md5 = md5;
window.Tabulator = Tabulator;
window.Viewer = Viewer;
window.QRCode = QRCode;

window.currentHref = currentHref;
window.isJavDb = isJavDb;
window.isJavBus = isJavBus;
window.isSearchPage = isSearchPage;
window.Status_RUNNING = Status_RUNNING;
window.Status_SUCCESS = Status_SUCCESS;
window.Status_FAIL = Status_FAIL;
window.Status_LOADING = Status_LOADING;
window.Status_FILTER = Status_FILTER;
window.Status_FAVORITE = Status_FAVORITE;
window.Status_HAS_DOWN = Status_HAS_DOWN;
window.Status_HAS_WATCH = Status_HAS_WATCH;
window.NO = NO;
window.YES = YES;

import 'layui-layer';

require.config({
    urlArgs: '_t=VERSION',
    baseUrl: '/Template/Tpl_2016/jscripts/',
    map: {
        '*': {
            'css': 'lib/css'
        }
    },
    packages: [{name: 'crypt', location: 'lib/crypt', main: 'index'}],
    paths: {
        'domReady': 'lib/domReady',
        'text': 'lib/text',
        'css': 'lib/css.min',
        // custom tools
        // tool
        'commonValidator': "/js2016/modules/validator/commonValidator-2.0",
        'validateRules': "/js2016/modules/validator/validateRules-2.0",
        'validateRules-3.0': "/js2016/modules/validator/validateRules-3.0",
        // common plugins
        // 'jquery': 'lib/jquery/jquery-1.11.3.min',
        // jquery已经被默认加载了 所以此处为了兼容其他插件代码 提供jquery模块
        'jquery': 'https://www.west.cn/js2016/lib/jquery/jquery_tool',
        'laypage': 'lib/require/laypage-x',
        'jsrender': 'https://www.west.cn/js2016/lib/jsrender/jsrender.min',
        // 通用模板
        'template': 'https://www.west.cn/js2016/root/template',
        'datetimepicker': 'https://www.west.cn/js2016/lib/jquery.datetimepicker/jquery.datetimepicker.full.min',
        'jquery-mousewheel': '/js2016/lib/jquery.datetimepicker/jquery-mousewheel.min',
        'Clipboard': '/js2016/lib/clipboard/clipboard-1.7.1.min',
        'clipboard': '/js2016/lib/clipboard/clipboard-1.7.1.min',
        // 登陆模块
        'Login': '/jscripts/kf/login',
        // --> 待完善使用该函数以便减少JS加载以及其他兼容处理
        'LoginUtil': '/js2016/lib/login/LoginUtil',
        // 通用弹层框
        'layer': 'https://www.west.cn/js2016/lib/layer/layer',
        // WJF模块
        'WJF': 'lib/wjf-2.0.0',
        // 1.0.7 只能使用该版本
        'webuploader': "https://www.west.cn/paas/dist/script/lib/webuploader/webuploader",

        // 使用未压缩的 且 修改过源码 注释掉 buffer的引用
        'BASE64': '/js2016/lib/encrypt/base64/base64',

        'ELEMENT': 'lib/element-ui/@2.13.0/index',
        //================ 自定义组件

        //=============以下为VUE相关模块配置========
        // WJF3.0 基于VUE+elementUI 不再依赖jquery
        'WJF3.0': 'lib/require/WJF-vue',
        // 新的AJAX请求工具
        'axios': 'lib/require/axios',
        
        'vue': 'https://www.west.cn/paas/dist/script/lib/vue/vue-2.6.10/vue.min',
        'echarts': 'lib/echarts/echarts.min',

        // 前台非ElementUI页面使用的UI 模块
        'vSelect': 'modules/components/v-select',

        // 密码加密
        'Encrypter': 'modules/utils/Encrypter',

        // ElementUI 相关扩展
        'table-list-footer-control': '/js2016/manager/servernew/components/table-list-footer-control',

        //===================页面相关
        "svc_form": 'page/user/trademark/common/svc-form',
        "applicant-info": 'lib/applicant-info',
        "wait-proc": 'lib/require/mgr/trademark/common/wait-proc',
        //==================FSS
        'FSSCommon': 'page/mgr/fss/common/FSSCommon',
        'DirTree': 'page/mgr/fss/common/DirTree'
    },
    shim: {
        'layer': {
            deps: ['css!/js2016/lib/layer/skin/layer.css']
        },       
        'vue': {
            exports: "Vue",
        },
        'applicant-info': {            
            deps: ['vue']
        },
        'laypage': {
            deps: ['css!/Template/Tpl_2016/jscripts/lib/require/laypage.css']
        },
        'datetimepicker': {
            deps: ['css!/js2016/lib/jquery.datetimepicker/jquery.datetimepicker.min.css']
        },
        'LoginUtil': {
            deps: ['/js2016/root/plugin/lhgdialognew.min.js?skin=west&self=true']
        }
    },
    // 为了兼容主站ASP与PC站 添加charset关系
    charsetMapping: {
        'WJF3.0': 'gbk',
        'laypage': 'gbk',
        'Login': 'gbk',
        'table-list-footer-control': 'gbk',
        'applicant-info':'gbk',
        'webuploader': 'gbk',
        'jquery': 'gbk',
        'vue': 'gbk',
        'ELEMENT': 'gbk',
        'axios': 'gbk'
    },
    waitSeconds: 15
});

window._require = require;

window['require'] = function (a, b, c) {
    if (c && c.showLoading) {
        var _b = b;
        var loadingId = WJF.ui.alert.loadingSTip('加载中...');
        b = function () {
            WJF.ui.alert.close(loadingId);
            _b.apply(null, Array.prototype.slice.call(arguments));
        }
    }
    return window._require(a, b);
};

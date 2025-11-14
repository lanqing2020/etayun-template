/**
 * 新版本 推荐使用该版本代码 代替 1.0.0
 * 提供常用的表单处理、ajax请求、弹层统一等,非VUE 模式
 */
window.console = window.console || function () {
};

function f(layer, template) {
    /**
     * 扩展前暂时使用
     * @type {{}}
     */
    window._WJF_ = {
        version: '2.0.0'
    };
    _WJF_.constants = {
        // AJAX 是否优先采用遮罩
        AJAX_LOADING_ENABLE: true
    };
    _WJF_.util = {
        storage: window.localStorage || null,
        _count: 0,
        // 唯一序列
        _prefix: new Date().getTime(),
        // 返回唯一ID
        generateId: function () {
            return this._prefix + '_' + (this._count++);
        },
        cookie: function (name, value, options) {
            if (typeof value != 'undefined') {
                options = options || {};
                if (value === null) {
                    value = '';
                    options = $.extend({},
                        options);
                    options.expires = -1;
                }
                var expires = '';
                if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
                    var date;
                    if (typeof options.expires == 'number') {
                        date = new Date();
                        date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
                    } else {
                        date = options.expires;
                    }
                    expires = '; expires=' + date.toUTCString();
                }
                options.path = options.path || '/';
                var path = options.path ? '; path=' + (options.path) : '';
                var domain = options.domain ? '; domain=' + (options.domain) : '';
                var secure = options.secure ? '; secure' : '';
                document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
            } else {
                var cookieValue = null;
                if (document.cookie && document.cookie != '') {
                    var cookies = document.cookie.split(';');
                    for (var i = 0; i < cookies.length; i++) {
                        var cookie = jQuery.trim(cookies[i]);
                        if (cookie.substring(0, name.length + 1) == (name + '=')) {
                            cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                            break;
                        }
                    }
                }
                return cookieValue;
            }
        },
        /*localstorage操作*/
        setItem: function (key, value, opts) {
            opts = opts || {};
            if (this.storage) {
                if (this.storage.getItem(key)) {
                    this.storage.removeItem(key);
                }
                try {
                    this.storage.setItem(key, value);
                    return true;
                } catch (e) {
                    var isHandleError = false;
                    if (opts.error) {
                        isHandleError = opts.error(e);
                    }
                    if (isHandleError === false) {
                        // 超出限额
                        if (e.name == 'QuotaExceededError') {
                            window.localStorage.clear();
                            window.console.warn('存储超额[已清空]');
                        } else {
                            console.error(e.message);
                            console.error(e);
                        }
                    }
                    return false;
                }
            }
        },
        removeItem: function (key) {
            if (this.storage) {
                this.storage.removeItem(key);
            }
        },
        getItem: function (key, defaultValue) {
            if (this.storage) {
                return this.storage.getItem(key) || defaultValue;
            }
            return defaultValue;
        },
        // 日期格式化
        formatDate: function (fmt, date) {
            date = date || new Date();
            fmt = fmt || "yyyy-MM-dd hh:mm:ss";
            var o = {
                "M+": date.getMonth() + 1, //月份
                "d+": date.getDate(), //日
                "h+": date.getHours(), //小时
                "m+": date.getMinutes(), //分
                "s+": date.getSeconds(), //秒
                "q+": Math.floor((date.getMonth() + 3) / 3), //季度
                "S": date.getMilliseconds() //毫秒
            };
            if (/(y+)/.test(fmt)) {
                fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length))
            }
            for (var k in o) {
                if (new RegExp("(" + k + ")").test(fmt)) {
                    fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)))
                }
            }
            return fmt;
        },
        /**
         *
         * @param key
         * @param urlStr 必须是location.search部分，即：最多以?开头
         * @returns {{}}
         */
        getUrlParams: function (key, urlStr, defaultValue) {
            urlStr = (urlStr || window.location.search);
            // 非? 开头 并且有 ？ 情况 ，适用于 https://www.yunyou.top/mbox/tag?tid=11
            if (!urlStr.match(/^\?/) && urlStr.match(/\?/)) {
                urlStr = urlStr.split('?')[1];
            } else {
                urlStr = urlStr.replace(/^\?/, "");
            }

            var regExp = /(&|^)([^=]+)=([^&]*)(&|$)/;
            var matched = urlStr.match(regExp);
            var obj = {};
            while (matched) {
                // 兼容处理数组情况
                if (obj[matched[2]] != null) {
                    obj[matched[2]] = [obj[matched[2]]];
                    obj[matched[2]].push(matched[3]);
                } else {
                    obj[matched[2]] = matched[3];
                }
                urlStr = urlStr.replace(matched[0], "");
                matched = urlStr.match(regExp);
            }
            if (key) {
                return obj[key] === undefined ? defaultValue : obj[key];
            } else {
                return obj;
            }
        },
        /**
         * 获取间隔多久之后的时间
         * @param curDate
         * @param gapDays  {month:0,days:0} 间隔指定日期之后的时间
         * @returns {Date}
         */
        getNextMonthDate: function (curDate, gapDays) {
            curDate = curDate || new Date();
            var monthDayCount = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            // 指定了 month
            if ((gapDays.month == 0) || (gapDays.month == null)) {
                return new Date(curDate.getTime() + (gapDays.days || 0) * 24 * 60 * 60 * 1000);
            }

            // 判断是否为闰年
            var years = curDate.getFullYear();
            var month = curDate.getMonth(); // 0-11
            var day = curDate.getDate();
            month += gapDays.month;
            if (month > 11) {
                years++;
            }
            month = month % 12;

            var targetDate = new Date(years + '/' + (month + 1) + '/' + day);
            // 目标月份不一样 说明目标月份没有那一天 则设置month+该month的最后一天
            if (targetDate.getMonth() != month) {
                monthDayCount[1] = (((years % 4 == 0) && (years % 100 != 0) || (years % 400 == 0)) ? 29 : 28);
                targetDate = new Date(years + '/' + (month + 1) + '/' + monthDayCount[month]);
            }
            return targetDate;
        },
        /**
         *  返回两个时间间隔天数
         * @param sDate1
         * @param sDate2 sDate1和sDate2是2006-12-18格式
         * @returns {number|*}
         */
        getDateDifference: function (sDate1, sDate2) {
            var dateSpan,
                iDays;
            sDate1 = Date.parse(sDate1);
            sDate2 = Date.parse(sDate2);
            dateSpan = sDate2 - sDate1;
            dateSpan = Math.abs(dateSpan);
            iDays = Math.floor(dateSpan / (24 * 3600 * 1000));
            return iDays
        },
        /**
         * 同getNextMonthDate 用于修正命名
         * @param curDate
         * @param gapDays
         * @returns {*}
         */
        getNextDate: function (curDate, gapDays) {
            return this.getNextDate(curDate, gapDays);
        },
        createInstance: function (opts) {
            var instance = new _WJF_.component.view(opts);
            window.PAGE_INSTANCE = instance;
            instance.init(this.generateId(), _WJF_.util.getUrlParams());
            return instance;
        },
        /**
         *  打印信息
         * @param message 指定的模板
         * 后续可能有多个参数  ...args
         * @returns {*|{}}
         */
        i18n: function (message) {
            message = message || "";
            var args = arguments[1] || "";
            if (!(arguments[1] instanceof Array)) {
                args = Array.prototype.slice.call(arguments, 1);
            }
            var regExp = /%s/;
            var matched = message.match(regExp);
            var obj = {};
            var index = 0, str;
            while (matched) {
                str = args[index++];
                message = message.replace(matched[0], str === undefined ? "" : str);
                matched = message.match(regExp);
            }
            return message;
        },
        /**
         * 只支持标准的JSON格式
         */
        str2json: (window.JSON && window.JSON.parse) || function (s) {
            try {
                return new Function('return ' + s).call();
            } catch (err) {
                return {};
            }
        },
        callBindFn: function (selectorDom, context, target) {
            selectorDom = $(selectorDom);
            target = $(target);
            var fnName = selectorDom.attr('data-op');
            // 是否仅仅是调用方法 不传递参数
            var isPure = selectorDom.attr('data-pure') == '1';
            // null 默认 ， false and, true or
            var andOrOpFlag = null;
            var andOrOpResult;
            if (/&|\|/.test(fnName)) {
                if (/&/.test(fnName)) {
                    fnName = fnName.split('&');
                    andOrOpFlag = false;
                } else {
                    fnName = fnName.split('|');
                    andOrOpFlag = true;
                }
                for (var i = 0, len = fnName.length; i < len; i++) {
                    var subFnName = fnName[i];
                    if (context[subFnName]) {
                        // 后续均采用该方式 selectorDom  target
                        andOrOpResult = isPure ? context[subFnName]() : context[subFnName](selectorDom, target);
                    }
                    // 后续均采用该方式 selectorDom  target
                    if (context.callbackMapping && context.callbackMapping[subFnName]) {
                        andOrOpResult = isPure ? context.callbackMapping[subFnName].call(context) : context.callbackMapping[subFnName].call(context, selectorDom, target);
                    }
                    // and 操作 ，只要有一个返回false 则不做后续操作 ； 可能会存在事件处理上的问题 ，暂时不考虑该问题
                    // or 操作 ，只要有一个返回true 则不做后续操作 ； 可能会存在事件处理上的问题 ，暂时不考虑该问题
                    if (andOrOpResult === andOrOpFlag) {
                        return andOrOpResult;
                    }
                }
                return andOrOpResult;
            }
            if (context[fnName]) {
                // 后续均采用该方式 selectorDom  target
                return isPure ? context[fnName]() : context[fnName](selectorDom, target);
            }
            // 后续均采用该方式 selectorDom  target
            if (context.callbackMapping && context.callbackMapping[fnName]) {
                return isPure ? context.callbackMapping[fnName].call(context) : context.callbackMapping[fnName].call(context, selectorDom, target);
            }

            return true;
        },
        /**
         * tab切换 辅助函数
         * @param tabSelector
         * @param opts
         */
        initTabs: function (tabSelector, opts) {
            opts = $.extend({
                clickSelector: 'li',
                activeCls: 'active', // tab 激活添加的cls
                tabContentCls: 'tab-content',
                activeTabContentCls: 'active' // 内容区激活添加的cls
            }, opts);
            var lastActiveTab = $(tabSelector).find(opts.clickSelector + '.' + opts.activeCls);
            $(tabSelector).on('click', opts.clickSelector, function (event) {
                var clickItem = $(this);
                if (this.tagName.toUpperCase() != 'LI') {
                    clickItem = clickItem.parents('li:first');
                }
                if (lastActiveTab.length && (lastActiveTab[0] !== this)) {
                    if (opts.onBeforeTabChange && opts.onBeforeTabChange(lastActiveTab, clickItem) === false) {
                        return;
                    }
                }
                // 没有指定 则不做处理
                if (!clickItem.attr('data-target')) {
                    return;
                }
                lastActiveTab.removeClass(opts.activeCls);
                $(lastActiveTab.attr('data-target')).removeClass(opts.activeTabContentCls);
                clickItem.addClass(opts.activeCls);
                $(clickItem.attr('data-target')).addClass(opts.activeTabContentCls);
                opts.onAfterTabChange && opts.onAfterTabChange(clickItem, lastActiveTab);
                // 当前tab 之前的tab
                opts.onTabChange && opts.onTabChange(clickItem, lastActiveTab);
                lastActiveTab = clickItem;
            });

            if (opts.triggerEnable) {
                lastActiveTab.trigger('click');
            }

            return {
                selectTabByIndex: function (index) {
                    $(tabSelector).find('li').eq(index).trigger('click');
                }
            }
        },
        destroyTabs: function (tabSelector) {
            $(tabSelector).off();
        },
        /**
         * 渲染分页栏
         * @param selector //容器。值支持id名、原生dom对象，jquery对象。【如该容器为】：<div id="page1"></div>
         * @param totalPage 总共多少页
         * @param currPage 当前第几页
         * @param callback
         */
        renderPager: function (selector, totalPage, currPage, callback) {
            if (typeof (callback) === "function") {
                callback = {
                    jump: callback
                }
            }
            require(['laypage'], function (laypage) {
                laypage($.extend({
                    cont: selector, //容器。值支持id名、原生dom对象，jquery对象。【如该容器为】：<div id="page1"></div>
                    pages: totalPage, //通过后台拿到的总页数
                    curr: currPage || 1, //当前页
                    skip: true,
                    prevBtnName: '上一页',
                    nextBtnName: '下一页',
                    confirmBtnName: '确定',
                    firstPageName: '首页',
                    lastPageName: '末页',
                    lang: 'zh-CN'
                }, callback, {
                    jump: function (obj, first) { //触发分页后的回调
                        if (!first) { //点击跳页触发函数自身，并传递当前页：obj.curr
                            callback && callback.jump && callback.jump(obj.curr, first, obj, callback);
                        }
                    }
                }));
            })
        },
        /**
         * 根据文件字节数 得到 尺寸
         * @param byte
         * @returns {string}
         */
        fileSizeParse: function (size) {
            var kb = 1024;
            var mb = kb * 1024;
            var gb = mb * 1024;
            var tb = gb * 1024;
            var num, unit;
            if (!size || size < kb) {
                num = size || 0;
                unit = 'B';
            } else if (size < mb) {
                num = size / kb;
                unit = 'KB';
            } else if (size < gb) {
                num = size / mb;
                unit = 'MB';
            } else if (size < tb) {
                num = size / gb;
                unit = 'GB';
            } else {
                num = size / tb;
                unit = 'TB';
            }

            return num.toFixed(2) + unit;
        },
        getSystemLang: function () {
            return 'zh-CN'
        },
        isPartialMode: function () {
            return false;
        },

        // 模板相关的
        renderTpl: function (tpl, data) {
            if (typeof (tpl) === 'string') {
                tpl = template.compile(tpl);
            }
            return tpl(data || {});
        },
        filterUrl: function (reqUrl) {
            // null undefiend
            if (reqUrl == null) {
                return reqUrl;
            }
            // 如果是以/开头（除掉域名信息外） 则需要判断是否需要添加自定义路径
            var reg = new RegExp('^' + window.location.origin);
            reqUrl = reqUrl.replace(reg, '');
            // 如果以 // 开头的
            if (reqUrl.match(/^\/\//)) {
                // 加上当前protocol
                reqUrl = window.location.protocol + reqUrl;
            } else {
                // 以 根开头的 才做操作 且位于测试环境
                if (reqUrl.match(/^\//)) {
                    // 特殊替换地址
                    if (window.location.pathname.match(/^\/paasdev\//)) {
                        reqUrl = reqUrl.replace(/\/paas\//, '/paasdev/');
                    }
                    // 特殊替换地址
                    if (window.location.pathname.match(/^\/webdev\//)) {
                        reqUrl = reqUrl.replace(/\/web\//, '/webdev/');
                    }
                }
            }
            return reqUrl;
        },
        debounce: function (func, wait, options) {
            var lastArgs,
                lastThis,
                maxWait,
                result,
                timerId,
                lastCallTime

            var lastInvokeTime = 0
            var leading = false
            var maxing = false
            var trailing = true

            if (typeof func != 'function') {
                throw new TypeError('Expected a function')
            }
            wait = +wait || 0
            if ((options)) {
                leading = !!options.leading
                maxing = 'maxWait' in options
                maxWait = maxing ? Math.max(+options.maxWait || 0, wait) : maxWait
                trailing = 'trailing' in options ? !!options.trailing : trailing
            }

            function invokeFunc(time) {
                var args = lastArgs
                var thisArg = lastThis

                lastArgs = lastThis = undefined
                lastInvokeTime = time
                result = func.apply(thisArg, args)
                return result
            }

            function leadingEdge(time) {
                // Reset any `maxWait` timer.
                lastInvokeTime = time
                // Start the timer for the trailing edge.
                timerId = setTimeout(timerExpired, wait)
                // Invoke the leading edge.
                return leading ? invokeFunc(time) : result
            }

            function remainingWait(time) {
                var timeSinceLastCall = time - lastCallTime
                var timeSinceLastInvoke = time - lastInvokeTime
                var timeWaiting = wait - timeSinceLastCall

                return maxing ?
                    Math.min(timeWaiting, maxWait - timeSinceLastInvoke) :
                    timeWaiting
            }

            function shouldInvoke(time) {
                var timeSinceLastCall = time - lastCallTime
                var timeSinceLastInvoke = time - lastInvokeTime

                // Either this is the first call, activity has stopped and we're at the
                // trailing edge, the system time has gone backwards and we're treating
                // it as the trailing edge, or we've hit the `maxWait` limit.
                return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
                    (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait))
            }

            function timerExpired() {
                var time = Date.now()
                if (shouldInvoke(time)) {
                    return trailingEdge(time)
                }
                // Restart the timer.
                timerId = setTimeout(timerExpired, remainingWait(time))
            }

            function trailingEdge(time) {
                timerId = undefined

                // Only invoke if we have `lastArgs` which means `func` has been
                // debounced at least once.
                if (trailing && lastArgs) {
                    return invokeFunc(time)
                }
                lastArgs = lastThis = undefined
                return result
            }

            function cancel() {
                if (timerId !== undefined) {
                    clearTimeout(timerId)
                }
                lastInvokeTime = 0
                lastArgs = lastCallTime = lastThis = timerId = undefined
            }

            function flush() {
                return timerId === undefined ? result : trailingEdge(Date.now())
            }

            function debounced() {
                var time = Date.now()
                var isInvoking = shouldInvoke(time)

                lastArgs = Array.prototype.slice.call(arguments);
                lastThis = this;
                lastCallTime = time;

                if (isInvoking) {
                    if (timerId === undefined) {
                        return leadingEdge(lastCallTime)
                    }
                    if (maxing) {
                        // Handle invocations in a tight loop.
                        timerId = setTimeout(timerExpired, wait)
                        return invokeFunc(lastCallTime)
                    }
                }
                if (timerId === undefined) {
                    timerId = setTimeout(timerExpired, wait)
                }
                return result
            }

            debounced.cancel = cancel
            debounced.flush = flush
            return debounced
        },
        /**
         * fn是我们需要包装的事件回调, delay是时间间隔的阈值
         *
         * 在指定时间内 多次调用， 只会执行最后一个
         * @param fn
         * @param delay
         * @returns {Function}
         */
        throttle: function (fn, delay) {
            // last为上一次触发回调的时间, timer是定时器
            var last = 0,
                timer = null;
            // 将throttle处理结果当作函数返回
            return function () {
                // 保留调用时的this上下文
                var context = this;
                // 保留调用时传入的参数
                var args = Array.prototype.slice.call(arguments);
                // 记录本次触发回调的时间
                var now = (+new Date());

                // 判断上次触发的时间和本次触发的时间差是否小于时间间隔的阈值
                if (now - last < delay) {
                    // 如果时间间隔小于我们设定的时间间隔阈值，则为本次触发操作设立一个新的定时器
                    clearTimeout(timer);
                    timer = setTimeout(function () {
                        last = now;
                        return fn.apply(context, args);
                    }, delay);
                } else {
                    // 如果时间间隔超出了我们设定的时间间隔阈值，那就不等了，无论如何要反馈给用户一次响应
                    last = now;
                    return fn.apply(context, args);
                }
            }
        },
        trim: function (text) {
            return text == null ?
                "" :
                (text + "").replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
        }
    }
    _WJF_.event = {
        types: {
            'CLICK_BODY': 'click_body',
            'WINDOW_RESIZE': 'window_resize'
        },
        _callbackMapping: {},
        on: function (name, callback, opts) {
            opts = opts || {};
            if (this._callbackMapping[name]) {
                if (opts.first === true) {
                    this._callbackMapping[name].splice(0, 0, callback);
                } else {
                    this._callbackMapping[name].push(callback);
                }
            } else {
                this._callbackMapping[name] = [callback];
            }
        },
        once: function (name, callback) {
            callback.__once__ = true;
            this.on(name, callback);
        },
        off: function (name, callback) {
            if (!callback) {
                delete this._callbackMapping[name];
            }

            var callbackList = this._callbackMapping[name];
            if (!callbackList) {
                return;
            }
            for (var i = 0, len = callbackList.length; i < len; i++) {
                if (callbackList[i] === callback) {
                    callbackList.splice(i, 1);
                    break;
                }
            }
        },
        trigger: function (name) {
            var callbackList = this._callbackMapping[name];
            if (!callbackList) {
                return false;
            }
            var params = Array.prototype.slice.call(arguments, 1);
            if (typeof (callbackList) === 'function') {
                return callbackList.apply(null, params);
            } else {
                var resultArr = [];
                for (var i = 0; i < callbackList.length; i++) {
                    var callback = callbackList[i];
                    var result = callback.apply(null, params);
                    if (callback.__once__ === true) {
                        // 删除只调用一次情况
                        callbackList.splice(i, 1);
                        i--;
                    }
                    // 兼容 需要返回其他数据时
                    if (result === false || (result && result.result === false)) {
                        break;
                    }
                    resultArr.push(result);
                }
                return resultArr;
            }
        },
        triggerDocument: function () {
            $(document).trigger('click');
        }
    }
    _WJF_.html = {
        /**
         * 获取表单内容数据
         * @param formSelector form表单选择器 支持jquery选择器\form对象 等
         * @param opts trim 默认trim
         * @returns {{}}
         */
        getFormData: function (formSelector, opts) {
            var $form;
            if (typeof (formSelector) == 'string') {
                $form = $('#' + formSelector);
            } else {
                $form = $(formSelector);
            }
            opts = opts || {};
            var data = $form.serializeArray();
            var result = {};
            for (var i = 0, len = data.length; i < len; i++) {
                var item = data[i];
                var name = item.name;
                var value = opts.trim === false ? item.value : $.trim(item.value);
                if (result[name] !== undefined) {
                    if (result[name] instanceof Array) {
                        result[name].push(value);
                    } else {
                        result[name] = [result[name]];
                        result[name].push(value);
                    }
                } else {
                    result[name] = value;
                }
            }
            return result;
        },
        /**
         * 获取完整的表单数据 只有要name 无论是否有值与否 都要返回
         * @param formSelector
         * @param opts
         * @returns {{}}
         */
        getFormData2: function (formSelector, opts) {
            var $form;
            if (typeof (formSelector) == 'string') {
                // 扩展支持.cls #id 模式
                if (formSelector.match(/^(\.|#)/)) {
                    $form = $(formSelector).eq(0);
                } else {
                    $form = $('#' + formSelector);
                }
            } else {
                $form = $(formSelector);
            }
            opts = $.extend({
                radioDefaultValue: '',
                checkboxDefaultValue: []
            }, opts || {});
            var result = {};
            $form.find('input,textarea,select').each(function () {
                var nodeName = this.nodeName.toUpperCase();
                var name = this.name;
                // 过滤掉没有字段名的情况
                if (name == '') {
                    return;
                }
                var value = null;
                switch (nodeName) {
                    case 'INPUT':
                        var type = this.type.toUpperCase();
                        switch (type) {
                            case 'TEXT':
                            case 'PASSWORD':
                            case 'HIDDEN':
                                value = this.value;
                                break;
                            case 'RADIO':
                                if (this.checked) {
                                    value = this.value;
                                } else {
                                    // 如果没有选中 则确认是否没有一个选中的
                                    if (result[name] === undefined) {
                                        var checkedItem = $form.find('input[type="' + type + '"][name="' + name + '"]:checked');
                                        // 当前没有一个选中的 则默认情况下 需要保留该字段 即使设置为空字符串或者自定义值
                                        if (checkedItem.length == 0) {
                                            result[name] = opts.radioDefaultValue;
                                        }
                                    }
                                }
                                break;
                            case 'CHECKBOX':
                                if (this.checked) {
                                    value = this.value;
                                } else {
                                    if (result[name] === undefined) {
                                        var checkedItem = $form.find('input[type="' + type + '"][name="' + name + '"]:checked');
                                        if (checkedItem.length == 0) {
                                            result[name] = opts.checkboxDefaultValue;
                                        } else {
                                            result[name] = [];
                                            $.each(checkedItem, function (index, item) {
                                                result[name].push(this.value);
                                            });
                                        }
                                    }
                                }
                                break;
                        }
                        break;
                    case 'TEXTAREA':
                    case 'SELECT':
                        value = this.value;
                        break;
                    default:
                }
                value !== null && addValue(name, value);
            });
            return result;

            function addValue(name, value) {
                // 考虑直接过滤字符串空白
                if (opts.trim === true && value && typeof (value) === 'string') {
                    value = value.replace(/\s/g, '');
                }
                if (result[name] !== undefined) {
                    if (result[name] instanceof Array) {
                        result[name].push(value);
                    } else {
                        result[name] = [result[name]];
                        result[name].push(value);
                    }
                } else {
                    result[name] = value;
                }
            }

        },
        /**
         * 创建表单 并执行数据提交
         * @param formData
         */
        submitForm: function (url, formData, opts) {
            opts = $.extend({
                method: 'post',
                target: '_blank'
            }, opts);
            var formDom = $('<form action="' + url + '" method="' + opts.method + '" target="' + opts.target + '" style="display: none;"></form>').appendTo($('body'));
            formDom = formDom[0];
            var fragment = document.createDocumentFragment();

            for (var x in formData) {
                var item = formData[x];
                if (item instanceof Array) {
                    $.each(item, function (index, _value) {
                        createNodeInFragement(x + '[' + index + ']', _value);
                    })
                } else {
                    createNodeInFragement(x, item);
                }
            }
            formDom.appendChild(fragment);
            formDom.submit();
            if (opts.target != '_self') {
                formDom.innerHTML = "";
                formDom.remove();
            }

            function createNodeInFragement(name, value) {
                // 针对 value 为 JSON 情况 暂时支持一层
                if (value != null && typeof (value) == 'object') {
                    for (var key in value) {
                        createNodeInFragement(name + '[' + key + ']', value[key]);
                    }
                    return;
                }
                var tmpNode = document.createElement("input");
                tmpNode.type = "text";
                tmpNode.name = name;
                tmpNode.value = value;
                fragment.appendChild(tmpNode);
            }
        }
    }
    _WJF_.communication = {
        // 用于hack，增加默认参数
        _baseParams: {},
        /**
         * 通用ajax请求
         * 默认情况下 启用局部遮罩 页面可点
         * @param opts
         * lock 全屏遮罩 则全局不可点
         * @returns {*}
         */
        ajax: function (opts) {
            var self = this;

            opts = $.extend({
                // 兼容命名
                showMask: null,
                showLoading: null,
                type: 'post',
                dataType: 'json',
                data: {},
                _failure: function (data) {
                    _WJF_.communication.handleFailure(data);
                }
            }, opts);
            if (opts.type == "post") {
                $.extend(opts.data, _WJF_.constants.AJAX_PARAM);
            }
            var loadingId = null;
            // 全局启用loading 则默认都启用
            if ((_WJF_.constants.AJAX_LOADING_ENABLE === true && (opts.showMask !== false && opts.showLoading !== false)) || opts.lock === true || opts.showMask || opts.showLoading) {
                loadingId = this.showLoading(opts.maskMsg || opts.loadingMsg, {
                    // 判断是否需要全屏锁定遮罩
                    lock: opts.lock
                });
            }
            var reqData = opts.data;
            if (reqData && typeof (reqData) !== 'string') {
                // 浅拷贝一次 以免变更到外部变量
                if (opts.type == "post" && window.BASE_AJAX_PARAM) {
                    reqData = $.extend({}, reqData, window.BASE_AJAX_PARAM);
                } else {
                    reqData = $.extend({}, reqData);
                }

                for (var x in reqData) {
                    // 适配arr.length为0情况 避免做JSON.stringify操作
                    // 默认情况下 空数组字段丢失
                    if ((reqData[x] instanceof Array) && reqData[x].length == 0 && opts.supportEmptyArray !== true) {
                        reqData[x] = null;
                    }
                }
            }
            var reqUrl = opts.url;
            if (reqUrl.match(/\?/)) {
                reqUrl = reqUrl + '&r=' + Math.random();
            } else {
                reqUrl = reqUrl + '?r=' + Math.random();
            }
            // 添加自定义url适配
            reqUrl = _WJF_.util.filterUrl(reqUrl);
            // 记录请求开始时间
            var startTime = new Date().getTime();
            return $.ajax($.extend({
                    url: reqUrl,
                    type: opts.type,
                    data: reqData,
                    async: opts.async === false ? false : true,
                    dataType: opts.dataType,
                    timeout: opts.timeout || 60000,
                    beforeSend: opts.beforeSend,
                    success: function (data) {
                        // 未登陆情况或者登陆超时
                        // if (data.code == "401") {
                        //     _WJF_.ui.alert.warn('登陆超时，请重新登录', function () {
                        //         window.location.href = '/login.asp';
                        //     });
                        //     return;
                        // }
                        var flag = true;
                        // 针对非JSON返回数据情况
                        if (typeof (data) === 'string') {
                            flag = opts.success && opts.success.call(opts.context || null, data);
                            if (flag === false) {
                                var result = opts.failure ? opts.failure.call(opts.context || null, data) : false;
                                if (result === false) {
                                    opts._failure(data);
                                }
                            }
                            return;
                        }


                        if (data.code == "200" || data.result == '200') {
                            flag = opts.success && opts.success.call(opts.context || null, data);
                        }
                        // 通讯成功下 业务逻辑错误
                        if ((data.code != "200" && data.result != '200') || flag === false) {
                            if (opts.failure) {
                                var result = opts.failure ? opts.failure.call(opts.context || null, data) : false;
                                if (result === false) {
                                    opts._failure(data);
                                }
                            } else {
                                opts._failure(data);
                            }
                        }
                    },
                    error: function (XMLHttpRequest, textStatus, errorThrown) {
                        var handleResult = null;
                        if (opts.error) {
                            handleResult = opts.error.apply(opts.context || null, Array.prototype.slice.call(arguments));
                        }
                        // 未处理(也就是没有error回调时) 或者 返回false进入统一错误处理流程
                        if (handleResult === null || handleResult === false) {
                            if (textStatus == 'abort') {
                                console.warn('取消请求');
                            } else {
                                if (textStatus == 'timeout') {
                                    _WJF_.ui.alert.error('网络超时');
                                } else if (textStatus == 'parsererror') {
                                    _WJF_.ui.alert.error('系统返回数据格式错误');
                                } else {
                                    if (textStatus == 'error') {
                                        _WJF_.ui.alert.error('网络错误，请稍后重试');
                                    } else {
                                        _WJF_.ui.alert.error(textStatus);
                                    }
                                }
                            }
                        }
                    },
                    complete: function () {
                        console.log('请求[' + opts.url + '] 耗时 ' + (new Date() - startTime) + ' ms , ' + _WJF_.util.formatDate());
                        loadingId && self.hideLoading(loadingId);
                        opts.complete && opts.complete.apply(opts.context || null);
                    }
                },
                // 添加_baseParams 用于做相关参数控制
                this._baseParams
            ));
        },
        post: function (url, params, success, error, opts) {
            _WJF_.communication.ajax($.extend({
                url: url,
                data: params,
                type: 'post',
                success: success,
                error: error
            }, opts));
        },
        get: function (url, params, success, error, opts) {
            _WJF_.communication.ajax($.extend({
                url: url,
                data: params,
                type: 'get',
                success: success,
                error: error
            }, opts));
        },
        handleFailure: function (data) {
            if (typeof (data) === 'string') {
                _WJF_.ui.alert.error(data);
                return;
            }
            var errorInfo = data.msg || data.error || data.errors || data.message;
            if (typeof (errorInfo) === "string") {
                _WJF_.ui.alert.error(errorInfo);
            } else {
                var errorMsgArr = [];
                for (var x in errorInfo) {
                    if (x in _WJF_.constants.AJAX_PARAM) {
                        continue;
                    }
                    if (typeof (errorInfo[x]) == "string") {
                        errorMsgArr.push(errorInfo[x]);
                    } else {
                        errorMsgArr.push(errorInfo[x].join(','));
                    }
                }
                _WJF_.ui.alert.error(errorMsgArr.join('<br>'));
            }
        },
        /*ajax请求通用*/
        showLoading: function (msg, opts) {
            if (opts && opts.lock === true) {
                return _WJF_.ui.alert.loading(msg || '加载中....');
            } else {
                return _WJF_.ui.alert.loadingSTip(msg || '加载中....');
            }
        },
        hideLoading: function (id) {
            return _WJF_.ui.alert.close(id);
        }
    }
    _WJF_.serviceManager = {
        // 组装参数
        prepareParams: function (url, data, success, error, opts) {

            // 传了error 但不是function 则从第4个参数开始为conf
            if (error && typeof (error) !== "function") {
                opts = $.extend({}, opts, error);
            } else {
                // 如果传了第4个参数 则格式为 success error failure
                if (typeof (opts) === 'function') {
                    opts = {
                        failure: opts
                    }
                }
            }
            return $.extend({
                url: url,
                data: data,
                success: success,
                error: typeof (error) === "function" ? error : null
            }, opts);
        },
        service: function (url, data, success, error, opts) {
            var params = this.prepareParams(url, data, success, error, opts);
            return _WJF_.communication.ajax(params);
        },
        get: function (url, data, success, error, opts) {
            opts = opts || {};
            var params = this.prepareParams(url, data, success, error, opts);
            params.type = 'get';
            return _WJF_.communication.ajax(params);
        },
        post: function (url, data, success, error, opts) {
            opts = opts || {};
            var params = this.prepareParams(url, data, success, error, opts);
            params.type = 'post';
            return _WJF_.communication.ajax(params);
        }
    }

// 以下为扩展方法
    layer.__prepareParams__ = function (args, defaultConf) {
        args[1] = args[1] || {};
        if (typeof (args[1]) === 'function') {
            args.splice(1, 0, {});
        }
        $.extend(args[1], {
            title: '温馨提示'
        }, defaultConf);
        return args;
    }
    layer.error = function (msg, config) {
        var params = Array.prototype.slice.call(arguments);
        params = layer.__prepareParams__(params, {
            icon: 2
        });
        return layer.alert.apply(layer, params);
    }
    layer.warn = function (msg, config) {
        var params = Array.prototype.slice.call(arguments);
        params = layer.__prepareParams__(params, {
            icon: 0
        });
        return layer.alert.apply(layer, params);
    }
    layer.success = function (msg, config) {
        var params = Array.prototype.slice.call(arguments);
        params = layer.__prepareParams__(params, {
            icon: 1
        });
        return layer.alert.apply(layer, params);
    }

    _WJF_.ui = {};
    var LAYER_CONTENT_TPL = '<div class="dialog-wrap-container">\
        <div class="dialog-wrap-title">\
            <i class="{{iconType}}"></i>\
            <div>\
                {{#content}}\
            </div>\
        </div>\
        {{ if subContent}}\
        <div class="dialog-wrap-line"></div>\
        <div class="dialog-wrap-txt">\
            <div class="blue-link dialog-detail-switcher" onclick="_WJF_.event.trigger(\"TOGGLE_COMMON_CLS\",this)">' + '详细信息' + '<i></i></div>\
            <div class="dialog-detail-text">\
                {{#subContent}}\
            </div>\
        </div>\
        {{/if}}\
    </div>';
    /**
     * msg为内容
     * config: {title:"xxx",btns:[]}
     *
     * @type {{success: _WJF_.ui.alert.success, error: _WJF_.ui.alert.error, warn: _WJF_.ui.alert.warn}}
     */
    _WJF_.ui.alert = {};
    $.extend(_WJF_.ui.alert, {
        _layerContentTplFn: template.compile(LAYER_CONTENT_TPL),
        _parseParams: function (msg, title, config) {
            var conf;
            // alert(msg)
            if (!title) {
                if (typeof (msg) === 'string') {
                    conf = {
                        msg: msg,
                        config: {}
                    };
                } else {
                    conf = msg;
                    conf.config = conf.config || {};
                }
            } else if (typeof (title) == 'string') {
                // alert(msg,'title',{})
                config = config || {};
                config.title = title === false ? false : (title || '温馨提示');
                // msg config
                conf = {
                    msg: msg,
                    config: config
                };
            } else if (typeof (title) === 'function') {
                // alert(msg,fn,fn)
                if (typeof (config) === 'function') {
                    var _config = {
                        yes: title,
                        cancel: config
                    };
                    conf = {
                        msg: msg,
                        config: _config
                    };
                } else {
                    conf = $.extend(true, {
                        msg: msg,
                        config: {
                            yes: title
                        }
                    }, config);
                }
            } else {
                // msg config
                title = title || {};
                title.title = title.title === false ? false : (title.title || '温馨提示');
                conf = {
                    msg: msg,
                    config: title
                };
            }
            conf.config.__cancel__ = conf.config.cancel;
            conf.config.__destroy__ = function (index, proxyLayerObj) {
                console.log('---------call conf.config.__destroy__--------------');
                proxyLayerObj.destroyShortcut();
                // 弹层销毁前回调
                conf.config.onBeforeDestroy && conf.config.onBeforeDestroy.call(conf.config.bindContext);
                // 解绑popEvents
                var wrapper = $("#layui-layer" + index + ' .layui-layer-content');
                wrapper.off();
                if (conf.config.bindContext && conf.config.bindContext.popEvents) {
                    var popEvents = conf.config.bindContext.popEvents;
                    for (var name in popEvents) {
                        wrapper.off(name);
                    }
                }
                conf.config.bindContext = null;
                delete conf.config.bindContext;
                // layer.close(index);
            }
            conf.config.cancel = function (index, layero) {
                var isClose = true;
                // 有cancel回调的情况下
                if (conf.config.__cancel__) {
                    // 不关闭情况时
                    if (conf.config.__cancel__(index, layero) === false) {
                        _WJF_.ui.alert.hide(index);
                        return false;
                    } else {
                        conf.config.__destroy__(index, conf.config.proxyLayerObj);
                        return true;
                    }
                } else {
                    // 默认做cache操作的
                    if (conf.config.cache === true) {
                        if (conf.config.onBeforeHide && conf.config.onBeforeHide(index, layero) !== false) {
                            _WJF_.ui.alert.hide(index);
                        }
                        return false;
                    } else {
                        conf.config.__destroy__(index, conf.config.proxyLayerObj);
                        return true;
                    }
                }
            }
            if (conf.content) {
                conf.msg = conf.content;
            }
            return conf;
        },
        _pareseLayerObj: function (layerId, config, layerOpts) {
            var obj = {
                _layerId: layerId,
                getId: function () {
                    return this._layerId;
                },
                hide: function () {
                    _WJF_.ui.alert.hide(this._layerId);
                },
                show: function () {
                    _WJF_.ui.alert.show(this._layerId);
                },
                close: function () {
                    config.__destroy__ && config.__destroy__(this._layerId, this);
                    _WJF_.ui.alert.close(this._layerId);
                },
                setContent: function (content) {
                    this.getContent().html(content);
                },
                updateContent: function (content) {
                    this.setContent(content);
                },
                getContent: function () {
                    return $("#layui-layer" + this._layerId + ' .layui-layer-content');
                },
                getWrapper: function () {
                    return this.getContent();
                },
                destroy: function () {
                    // config.__destroy__(this._layerId);
                    this.close();
                },
                handleKeyDown: function (keyDownData) {
                    if (config.shortcut !== true) {
                        return;
                    }
                    var event = keyDownData.event;
                    if (event.shiftKey || event.ctrlKey || event.altKey) {
                        return;
                    }
                    var keyCode = keyDownData.keyCode;
                    switch (keyCode) {
                        case 13: // enter
                        case 89: // y
                            console.log('enter')
                            config.yes && config.yes();
                            layer.close(layerId);
                            throw 'SKIP TRIGGER';
                            break;
                        case 27: // esc
                            // case 78: // n
                            console.log('esc')
                            if (config.cancel) {
                                config.cancel() !== false && layer.close(layerId);
                            } else {
                                layer.close(layerId);
                            }
                            throw 'SKIP TRIGGER';
                            break;
                        default:
                            break;

                    }
                },
                // 代理快捷键操作
                proxyShortcut: function () {
                    _WJF_.event.on('KEYDOWN', this.handleKeyDown, {
                        first: true
                    });
                },
                destroyShortcut: function () {
                    _WJF_.event.off('KEYDOWN', this.handleKeyDown);
                }
            };
            if (config.noPadding) {
                config.appendCls = (config.appendCls || "") + ' no-padding';
            }
            config.appendCls = config.appendCls || "";
            config.appendCls += ' wjf-layui-layer-page ' + _WJF_.util.getSystemLang();
            if (config && config.appendCls) {
                $("#layui-layer" + layerId).addClass(config.appendCls);
            }
            // 内联模式下 为内部DOM关联绑定事件
            var wrapper = obj.getWrapper();
            if (config.bindContext) {
                // 片段模式才补充绑定
                if (_WJF_.util.isPartialMode() === true) {
                    wrapper.on('click', '.J-op', function (event) {
                        // 回传参数
                        var callbackName = $(this).attr('data-op');
                        if (!callbackName) {
                            return false;
                        }
                        var result = _WJF_.util.callBindFn(this, config.bindContext, event.target);
                        if (result !== undefined) {
                            return result;
                        }
                        return false;
                    });
                }
                // 由View代理绑定事件
                if (config.proxyBindDomEvent === true) {
                    _WJF_.component.view.prototype._bindDomEvent.call(config.bindContext, wrapper, config.bindContext.popEvents || null);
                } else {
                    config.bindContext._bindDomEvent(wrapper, config.bindContext.popEvents || null);
                }
            }
            config.proxyLayerObj = obj;
            // 让焦点focus
            config.focus !== false && wrapper.find('input,textarea')[0] && wrapper.find('input,textarea')[0].focus();
            return obj;
        },
        open: function (msg, title, config, iconType) {
            var params = this._parseParams(msg, title, config, iconType);

            var layerOpts = $.extend({
                resize: false,
                type: 1,
                title: (params.config && params.config.title) || '温馨提示', //默认不显示标题 用于显示内容做相关操作的
                content: params.msg,
                iconType: iconType
            }, params.config);


            // 默认创建确定、取消按钮
            if (layerOpts.btn !== false && (!layerOpts.btn || layerOpts.btn.length == 0)) {
                layerOpts.btn = [];
                if (layerOpts.yes) {
                    layerOpts.btn.push('确定');
                }
                if (layerOpts.btn.length == 0) {
                    if (layerOpts.__cancel__ !== false) {
                        layerOpts.btn.push('确定');
                    }
                } else {
                    if (layerOpts.__cancel__ !== false) {
                        layerOpts.btn.push('取消');
                    }
                }
                if (layerOpts.btn.length == 0) {
                    layerOpts.btn.push('确定');
                }
            }

            // if (layerOpts.btn !== false && layerOpts.btn.length == 1) {
            //     layerOpts.btnAlign = 'r';
            // }
            if (iconType) {
                layerOpts.content = this._layerContentTplFn(layerOpts);
            }
            var layerId = layer.open(layerOpts);
            var proxyLayerObj = this._pareseLayerObj(layerId, params.config, layerOpts);
            // 当前弹层启用快捷键
            setTimeout(function () {
                if (config && config.shortcut === true) {
                    proxyLayerObj.proxyShortcut();
                }
            }, 0);

            return proxyLayerObj;
        },
        success: function (msg, title, config) {
            return this.open(msg, title, config, 'success');
        },
        error: function (msg, title, config) {
            return this.open(msg, title, config, 'error');
        },
        warn: function (msg, title, config) {
            return this.open(msg, title, config, 'warn');
        },
        alert: function (msg, title, config) {
            return this.open(msg, title, config, 'alert');
        },
        confirm: function (msg, title, config) {
            return this.open(msg, title, config, 'confirm');
        },
        prompt: function (options, yes) {
            return layer.prompt(options, yes);
        },
        msg: function (msg, options, yes, no) {
            if (typeof (options) == 'function') {
                options = {
                    yes: options,
                    no: yes
                }
                var params = this._parseParams(msg, options);
                var layerId = layer.msg(params.msg, params.config);
                return this._pareseLayerObj(layerId, params.config);
            } else {
                options = $.extend({
                    title: false
                }, options);
                var params = this._parseParams(msg, options);
                var layerId = layer.msg(params.msg, params.config, yes, no);
                return this._pareseLayerObj(layerId, params.config);
            }
        },
        _prepareTipMsg: function (msg, status) {
            msg = '<div class="tip-container"><div class="tip-msg ' + status + '"><i></i>' + msg + '</div></div>';
            return msg;
        },
        _prepareTipConfig: function (options) {
            options = $.extend({
                time: 2000,
                appendCls: 'layui-layer-custom-tip',
                offset: ['39px', '50%'],
                // 是否聚焦
                showFocusAssistant: false
            }, options);
            return options;
        },
        warnTip: function (msg, options) {
            return this.msg(this._prepareTipMsg(msg, 'warn'), this._prepareTipConfig(options));
        },
        loadingTip: function (msg, options) {
            options = options || {
                time: 20000000
            }
            return this.msg(this._prepareTipMsg(msg, 'loading'), this._prepareTipConfig(options));
        },
        loadingSTip: function (msg, options) {
            options = options || {
                time: 20000000
            }
            return this.msg(this._prepareTipMsg(msg, 'small-loading'), this._prepareTipConfig(options));
        },
        // 全屏遮罩
        loading: function (msg) {
            return layer.load(2, {
                shade: [0.1, '#fff'] //0.1透明度的白色背景
            });
        },
        successTip: function (msg, options) {
            return this.msg(this._prepareTipMsg(msg, 'success'), this._prepareTipConfig(options));
        },
        close: function (id) {
            if (id._layerId) {
                id.close();
                return;
            }
            id = id._layerId || id;
            layer.close(id);
        },
        hide: function (id) {
            id = id._layerId || id;
            $("#layui-layer" + id).hide();
            $("#layui-layer-shade" + id).hide();
        },
        show: function (id) {
            id = id._layerId || id;
            $("#layui-layer-shade" + id).show();
            $("#layui-layer" + id).show();
        }
    });

    /**
     * 对外暴露参数：
     * 1、pageWrapper （当前页面最外层容器）
     * 2、pageViewParams 当前页面对应url参数
     */
    _WJF_.component = {};
    _WJF_.component.view = function (options) {
        $.extend(this, options);
        this.componentId = _WJF_.util.generateId();
        this._init = this.init;
        this.viewData = {
            sceneHistory: []
        };
        this.init = function (id, pageViewParams) {
            this.pageId = id;
            this.beforeCreate(pageViewParams);
            this._init(id, pageViewParams);
        }
    }
    $.extend(_WJF_.component.view.prototype, {
        /**
         * 场景切换
         * @param sceneId
         * @param params
         */
        switchScene: function (sceneId, params, opts) {
            // 默认传递的是 id 字符串
            // 或者没有传 本身是点击的dom节点
            if (!sceneId || (sceneId.attr && (sceneId.attr('data-op') == 'switchScene'))) {
                if (this.viewData.sceneHistory.length) {
                    this.viewData.sceneHistory.pop();
                    this.switchScene(this.viewData.sceneHistory.pop());
                }
                return;
            }
            var isReload = false, opts = opts || {};

            /*sceneId 为dom对象*/
            var targetDC = null;
            if (typeof (sceneId) != 'string') {
                targetDC = $(sceneId);
                sceneId = targetDC.attr('id');
            } else {
                targetDC = this.pageWrapper.find("#" + sceneId);
            }

            // 当前就已经打开了
            if (sceneId == this.viewData.sceneHistory[this.viewData.sceneHistory.length - 1]) {
                if (opts.reload === true) {
                    isReload = true;
                } else {
                    return;
                }
            }
            if (targetDC.hasClass('active') && !isReload) {
                return;
            }
            targetDC.addClass('active').siblings('.scene-content').removeClass('active');
            // 屏蔽掉不返回的情况 , isReload===true 时 不再push到“历史记录”中
            if (targetDC.attr('backable') !== "0" && !isReload) {
                this.viewData.sceneHistory.push(sceneId);
            }
            // 每个子项可能有的初始化方法
            var targetInitFn = targetDC.attr('data-init');
            // 默认情况下 不重复调用初始化函数
            if (typeof (this[targetInitFn]) === "function") {
                this[targetInitFn](targetDC, params);
            }
        },
        destroyScene: function (sceneId) {
            var self = this;
            if (sceneId) {
                destroyScene(sceneId);
                return;
            }
            $.each(this.viewData.sceneHistory, function (index, item) {
                destroyScene(sceneId);
            });
            this.viewData.sceneHistory = [];

            function destroyScene(sceneId) {
                var targetScene = self.pageWrapper.find("#" + sceneId);
                targetScene.off();
                targetScene.remove();
            }
        },
        beforeCreate: function (pageViewParams) {
            var self = this;
            this.pageWrapper = $("body");
            this.pageViewParams = pageViewParams || {};
            // 辅助获取
            if (this.pageViewParams._cacheKey_ && typeof (CommonTool) != 'undefined') {
                this.pageViewParams._cacheData_ = CommonTool.getCacheData(this.pageViewParams._cacheKey_, false);
            }
        },
        init: function () {
            this._error('function init must be implemented ....');
        },
        bindEvent: function () {
            var self = this;
            // 其他页面自身快捷配置的自定义事件
            if (this.customEvents) {
                for (var name in this.customEvents) {
                    _WJF_.event.on(name, (function (eName) {
                        return function () {
                            // 回传参数
                            var args = Array.prototype.slice.call(arguments);
                            args.splice(1, 0, this);
                            var callback = self.customEvents[eName];
                            return typeof (callback) == "string" ? self[callback].apply(self, args) :
                                callback.apply(self, args);
                        }
                    })(name));
                }
            }

            if (!this.events) {
                return;
            }
            this._bindDomEvent();
        },
        _bindDomEvent: function (pageWrapper, events) {
            if (events === null) {
                return;
            }
            events = events || this.events;
            // 默认扩展下
            events = $.extend({
                /**
                 *
                 * @param event
                 * @param selectorDom  事件绑定时的选择器 如.J-op 表示为该className对应的DOM对象
                 * @returns {*}
                 */
                'click .J-op': function (event, selectorDom) {
                    // 回调绑定的函数 并传递触发元素  this代表的是当前实例 ， event.target表示的是当前点击的元素 与 selectDom 可能是同一个，也可能不是
                    var result = _WJF_.util.callBindFn(selectorDom, this, event.target);
                    // 默认情况下 result都是undefined 所以默认返回false 阻止冒泡
                    if (result !== undefined) {
                        return result;
                    }
                    return false;
                }
            }, events);
            var self = this;
            pageWrapper = pageWrapper || self.pageWrapper;
            for (var selector in events) {
                var callbackName = events[selector];
                var selectors = $.trim(selector).split(' ');
                var eventName = selectors[0];
                selector = $.trim(selectors.splice(1).join(' '));
                pageWrapper.on(eventName, selector, (function (callbackName) {
                    return function () {
                        // 回传参数
                        var args = Array.prototype.slice.call(arguments);
                        args.splice(1, 0, this);
                        return typeof (callbackName) == "string" ? self[callbackName].apply(self, args) :
                            callbackName.apply(self, args);
                    }
                })(callbackName));
                console.log("**" + eventName + "**", "**" + selector + "**");
            }
        },
        unBindEvent: function () {
            console.log('**********unBindEvent**********');
            this.pageWrapper.off();
            if (this.customEvents) {
                for (var name in this.customEvents) {
                    _WJF_.event.off(name);
                }
            }
            this._unbindEvent = true;
        },
        _onBeforeDestroy: function () {
            // 调用基类通用事件解绑等  务必保留该行代码
            this.unBindEvent();
            this.onBeforeDestroy && this.onBeforeDestroy();
        },
        _error: function (msg) {
            alert('[ Error: ' + title + ' ]\n' + msg);
            throw msg;
        },
        post: function () {
            if (this.data.AJAX_LOADING_ENABLE !== false) {
                _WJF_.constants.AJAX_LOADING_ENABLE = true;
            }
            var xhr = _WJF_.serviceManager.post.apply(_WJF_.serviceManager, Array.prototype.slice.call(arguments));
            _WJF_.constants.AJAX_LOADING_ENABLE = false;

            // CommonTool.xhrMapping[this.pageId] = CommonTool.xhrMapping[this.pageId] || [];
            // xhr.always = function () {
            //     console.log('post xxxx this is always');
            // }
            // CommonTool.xhrMapping[this.pageId].push(xhr);
            return xhr;
        },
        get: function () {
            if (this.data.AJAX_LOADING_ENABLE !== false) {
                _WJF_.constants.AJAX_LOADING_ENABLE = true;
            }
            var xhr = _WJF_.serviceManager.get.apply(_WJF_.serviceManager, Array.prototype.slice.call(arguments));
            _WJF_.constants.AJAX_LOADING_ENABLE = false;

            // CommonTool.xhrMapping[this.pageId] = CommonTool.xhrMapping[this.pageId] || [];
            // xhr.always = function () {
            //     console.log('get xxxx this is always');
            // }
            // CommonTool.xhrMapping[this.pageId].push(xhr);
            return xhr;
        },
        log: function (msg) {
            var title = $("#tab_" + this.pageId).text() || "";
            console.log('[ log: ' + title + ' ]\n');
            console.log(msg);
        },
        /**
         * 通用的销毁动作
         * @private
         */
        destroy: function () {
            if (!this._unbindEvent) {
                this.unBindEvent();
            }
            // $.each(CommonTool.xhrMapping[this.pageId] || [], function (index, item) {
            //     item.abort();
            // });
            // delete  CommonTool.xhrMapping[this.pageId];
            // 销毁可能存在的iframe
            this.pageWrapper.find('iframe').each(function (index, item) {
                item.src = "";
            });
            // 销毁可能存在的校验器
            this.pageWrapper.find('.J_Common_Validator').each(function () {
                var validator = $(this).data('Common_validator');
                validator && validator.destory();
            });
            // 销毁各个scene
            this.destroyScene();
            // 调用当前页面的destroy操作
            this._onBeforeDestroy();
            var data = this.data;
            for (var x in data) {
                data[x] = null;
            }
            for (var x in this) {
                delete this[x];
            }
            this.destroyed = true;
        }
    });

    // 为Vue扩展东东
    if (typeof (Vue) != 'undefined') {
        Vue.prototype.get = _WJF_.serviceManager.get;
        Vue.prototype.post = _WJF_.serviceManager.post;

        // 过滤器
        Vue.filter('filterUrl', function (url) {
            return _WJF_.util.filterUrl(url);
        });

        // 添加通用的混入
        var baseMixin = {
            created: function () {

                // 存在系统错误 页面不该继续下一步渲染 则直接退出
                if (window.PAGE_CONFIG && window.PAGE_CONFIG.SERVER_ERROR_MSG) {
                    _WJF_.ui.alert.error(window.PAGE_CONFIG.SERVER_ERROR_MSG);
                    throw 'Error:' + window.PAGE_CONFIG.SERVER_ERROR_MSG;
                }
                if (this.queryParams) {
                    Object.assign(this.queryParams, _WJF_.util.getUrlParams());
                } else {
                    this.queryParams = _WJF_.util.getUrlParams();
                }

                if (this.leftMenuId != null && window.leftMenuBar) {
                    window.leftMenuBar.setMenu(this.leftMenuId);
                }
            },
            methods: {}
        }
        _WJF_.util.createVueInstance = function (opts) {
            opts.mixins = [].concat([baseMixin]).concat(opts.mixins || []);
            var newOpts = {};
            for (var x in opts) {
                if (opts.hasOwnProperty(x)) {
                    newOpts[x] = opts[x];
                }
            }
            window.PAGE_INSTANCE = new Vue(newOpts);
            return window.PAGE_INSTANCE;
        };
    }


    // 为避免重复加载执行或者版本冲突 如有相关版本了 则直接退出
    if (!window.WJF) {
        window.WJF = window._WJF_;
    } else {
        console.warn('WJF版本重复 请确认！');
    }
}


// 临时修改
if (("function" == typeof define) && define.amd) {
    if (window.layer && window.template) {
        define(function () {
            f(window.layer, window.template);
            return window._WJF_;
        });
    } else {
        define(['layer', 'template'], function (layer, template) {
            f(layer, template);
            return window._WJF_;
        });
    }
    /*
    *  define(['layer', 'template'], function (layer, template) {
        f(layer, template);
        return window._WJF_;
    });
    * */
} else {
    f(window.layer, window.template);
}

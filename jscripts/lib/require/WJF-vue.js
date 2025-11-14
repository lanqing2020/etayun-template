/**
 * 基于VUE+elementUI的公共库
 * 提供常用的表单处理、ajax请求、弹层统一等,非VUE 模式
 * 不再依赖jQuery , 浏览器支持到IE9+
 * 只维护front目录独一份，其他均copy自此处
 */
window.console = window.console || function () {
};
/**
 * 临时扩展Object.assign方法
 */
Object.assign = Object.assign || function (target) {
    let args = Array.prototype.slice.call(arguments).slice(1);
    for (var i = 0, len = args.length; i < len; i++) {
        var item = args[i];
        if (typeof (item) == 'object') {
            for (var x in item) {
                target[x] = item[x];
            }
        }
    }
    return target;
}

Array.prototype.forEach = Array.prototype.forEach || function (iterator, context) {
    for (var index = 0, len = this.length; index < len; index++) {
        iterator.call(context || window, this[index], index);
    }
};

function f(Vue, axios) {
    /**
     * 扩展前暂时使用
     * @type {{}}
     */
    var WJF = {
        version: '3.0.0'
    };
    WJF.constants = {
        // AJAX 是否优先采用遮罩
        AJAX_LOADING_ENABLE: true,
        // 测试环境地址
        BASE_DEV_SERVER_ROOT: (window.PAGE_CONFIG && window.PAGE_CONFIG.BASE_DEV_SERVER_ROOT) || '',
        // 正式环境地址
        BASE_SERVER_ROOT: (window.PAGE_CONFIG && window.PAGE_CONFIG.BASE_SERVER_ROOT) || '',
        AJAX_PARAM: {},
        ONLINE_PAY_PAGE: '/manager/OnlinePay.asp',

        AJAX_STATUS_KEY: '',
        AJAX_SUCCESS_CODE: 200
    };
    WJF.util = {
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
                    options = Object.assign({},
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
        /**
         * @deprecated 不再推荐使用
         * @param fmt  默认为  yyyy-MM-dd hh:mm:ss
         * @param date 默认为 当前日期(new Date()) ，支持 日期对象，2020-05-05 或者 时间戳纯数字
         * @returns {*}
         */
        formatDate: function (fmt, date) {
            // 支持数组或者字符串类型的日期
            // 如果 2020-05-05 或者  时间戳 ms
            if (/^\d+$/.test(date)) {
                date = new Date(+date);
            } else if (typeof (date) === 'string') {
                date = new Date(date);
            }
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
         * @param date 默认为 当前日期(new Date()) ，支持 日期对象，2020-05-05 或者 时间戳纯数字
         * @param fmt  默认为  yyyy-MM-dd
         * @returns {*} String
         */
        dateFormatter: function (date, fmt) {
            fmt = fmt || 'yyyy-MM-dd';
            return this.formatDate(fmt, date);
        },
        /**
         * 对时间进行舍入 修正为当天第一ms或者最后一ms
         * @param date
         * @param flag true 为当天的最后一ms  false 为第一ms 默认为false
         * @returns {Date}
         */
        roundDate: function (date, flag) {
            if (typeof (flag) === 'undefined') {
                flag = false;
            }
            if (typeof (date) == 'number' || typeof (date) == 'string') {
                date = new Date(date);
            }
            if (flag === true) {
                date.setHours(23);
                date.setMinutes(59);
                date.setSeconds(59);
                date.setMilliseconds(999);
            } else if (flag === false) {
                date.setHours(0);
                date.setMinutes(0);
                date.setSeconds(0);
                date.setMilliseconds(0);
            }
            return date;
        },
        /**
         * 获取间隔多久之后的时间
         * @deprecated  该函数废除，之后使用 getGapDate
         * @param curDate
         * @param gapOptions  {month:0,days:0} 间隔指定日期之后的时间
         * @returns {Date}
         */
        getNextMonthDate: function (curDate, gapOptions) {
            return this.getGapDate(curDate, gapOptions);
        },
        isLeapYear: function (years) {
            if (years % 4 == 0 && years % 100 != 0) {
                return true;
            }
            return years % 400 === 0;
        },
        /**
         * 获取间隔多久之后的时间
         * @param curDate  Date实例 默认为当前时间
         * @param gapOptions  {month:0,days:0} 间隔指定日期之后的时间
         * @returns {Date}
         */
        getGapDate: function (curDate, gapOptions) {
            curDate = curDate || new Date();
            var monthDayCount = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
            // 指定了 month
            if ((gapOptions.month == 0) || (gapOptions.month == null)) {
                return new Date(curDate.getTime() + (gapOptions.days || 0) * 24 * 60 * 60 * 1000);
            }

            // 判断是否为闰年
            var years = curDate.getFullYear();
            var month = curDate.getMonth(); // 0-11
            var day = curDate.getDate();
            month += +gapOptions.month;
            if (month > 11) {
                years += Math.floor(month / 12);
            }
            month = month % 12;

            var targetDate = new Date(years + '/' + (month + 1) + '/' + day);
            // 目标月份不一样 说明目标月份没有那一天 则设置month+该month的最后一天
            if (targetDate.getMonth() != month) {
                monthDayCount[1] = this.isLeapYear(years) ? 29 : 28;
                targetDate = new Date(years + '/' + (month + 1) + '/' + monthDayCount[month]);
            }
            return targetDate;
        },
        /**
         * 返回两个时间间隔天数 后一个减去 前一个
         * @param sDate1
         * @param sDate2  sDate1和sDate2 可以是2006-12-18格式 或者 Date
         * @param isAbs {Boolean,Object} 是否返回绝对值 默认为 true ,始终返回正数 或者  {isAbs:false,minute:false,hours:false}
         * @returns {number}
         */
        getDateDifference: function (sDate1, sDate2, isAbs) {
            var dateSpan,
                iDays;
            var opts;
            if (typeof (isAbs) === 'undefined') {
                opts = {};
            } else if (typeof (isAbs) === 'boolean') {
                opts = {
                    isAbs: isAbs
                };
            } else {
                opts = isAbs || {};
            }

            // 计算间隔天数 时间将设置为当天的开始
            var isFixDate = opts.hours !== true && opts.minute !== true;


            // 组装时间 设定基准
            sDate1 = Date.parse(sDate1);
            sDate1 = new Date(sDate1);


            if (isFixDate) {
                sDate1.setHours(0);
                sDate1.setMinutes(0);
                sDate1.setSeconds(0);
                sDate1.setMilliseconds(0);
            }

            sDate2 = Date.parse(sDate2);
            sDate2 = new Date(sDate2);

            if (isFixDate) {
                sDate2.setHours(0);
                sDate2.setMinutes(0);
                sDate2.setSeconds(0);
                sDate2.setMilliseconds(0);
            }

            dateSpan = sDate2 - sDate1;
            // 默认情况下 返回的是 正数
            if (opts.isAbs !== false) {
                dateSpan = Math.abs(dateSpan);
            }

            if (opts.minute === true) {
                return Math.floor(dateSpan / (60 * 1000));
            }

            if (opts.hours === true) {
                return Math.floor(dateSpan / (60 * 60 * 1000));
            }

            iDays = Math.floor(dateSpan / (24 * 3600 * 1000));
            return iDays;
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
        /**
         * 根据文件字节数 得到 尺寸 ， 传入的计量单位 为 B
         * @param byte
         * @returns {string}
         */
        fileSizeParse: function (size) {
            size = +size;
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
                // 以 根开头的 才做操作 且位于测试环境 ， 正式环境 则不做处理
                if (window.PAGE_CONFIG && window.PAGE_CONFIG.DEV === true && reqUrl.match(/^\//)) {
                    var serverRootReg = new RegExp('^' + WJF.constants.BASE_SERVER_ROOT);
                    // 已经是新规则开头的 则不用管
                    if (reqUrl.match(serverRootReg)) {
                        // 将正式环境替换为测试环境地址
                        reqUrl = reqUrl.replace(serverRootReg, WJF.constants.BASE_DEV_SERVER_ROOT);
                    }
                }
            }
            return reqUrl;
        },
        navigateTo: function (reqUrl) {
            window.location.href = this.filterUrl(reqUrl);
        },
        openUrl: function (reqUrl) {
            window.open(this.filterUrl(reqUrl));
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

        // 该日志不会被屏蔽掉
        log: function (title) {
            window.console.log(title);
        },
        error: function (title) {
            window.console.error(title);
        },
        warn: function (title) {
            window.console.warn(title);
        },
        trim: function (text) {
            return text == null ?
                "" :
                (text + "").replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
        },
        isEmptyObject: function (obj) {
            if (obj == null) {
                return true;
            }
            var name;
            for (name in obj) {
                return false;
            }
            return true;
        },
        //=========Array相关
        /**
         * 删除数组中的某一个元素  根据Key 来比较 或者 采用 === 比较
         * @param arr
         * @param item
         */
        removeArrayItem: function (arr, item, key) {
            var index = arr.findIndex((_item) => {
                if (key != null) {
                    return item[key] === _item[key];
                }
                return item === _item;
            });
            if (index > -1) {
                arr.splice(index, 1);
            }
        },
        /**
         * 从对象中拷贝指定的字段到一个新的对象中
         * @param obj
         * @param keys
         */
        copyKeys: function (obj, keys) {
            let newObjs = {};
            keys.forEach((key) => {
                newObjs[key] = obj[key];
            });
            return newObjs;
        },
        // 对象深拷贝
        deepClone: function (obj) {
            // new WeakMap() 记录所有的对象引用关系 考虑兼容问题 此处用 Object代理
            let map = {};

            function dp(obj) {
                var result = null,
                    keys = null,
                    key = null,
                    temp = null;

                // 如果这个对象已被记录则直接返回 避免循环引用的问题
                if (map[obj]) {
                    console.log('exsit' + map[obj]);
                    return map[obj];
                }
                keys = Object.keys(obj);
                result = {};
                // 记录当前对象
                map[obj] = result;
                for (let i = 0; i < keys.length; i++) {
                    key = keys[i];
                    temp = obj[key];
                    // 如果字段的值也是一个对象则递归复制
                    if (temp && typeof temp === 'object') {
                        result[key] = dp(temp);
                    } else {
                        // 否则直接赋值给新对象  (null , undefined)
                        result[key] = temp;
                    }
                }
                return result;
            }

            return obj ? dp(obj) : obj;
        },
        // 将数组转换为映射表
        arrayToJSON: function (arr, key) {
            let mapping = {};
            arr.forEach((item) => {
                mapping[item[key]] = item;
            });
            return mapping;
        },
        // 将对象的所有数字类字段 都转为整数或浮点数 用于处理接口返回数据可能为字符串的情况
        parseKeyToInt: function (obj) {
            if (!obj) {
                return null;
            }
            var newObj = {}; // 最好不影响到原始对象
            var item;
            var reg = /^\d+(\.?\d+)?\d*$/;
            for (var x in obj) {
                item = obj[x];
                if (reg.test(item)) {
                    newObj[x] = +item;
                } else {
                    newObj[x] = item;
                }
            }
            return newObj;
        },
        // 根据字段 搜索数组元素
        getItemOfList: function (list, key, value) {
            for (var i = 0, len = list.length; i < len; i++) {
                if (list[i][key] == value) {
                    return {
                        data: list[i],
                        index: i
                    };
                }
            }
            return null;
        },
        // 删除对象中的特定key
        copyObjWithoutKeys: function (obj, keys) {

            var newObj = {};
            for (var x in obj) {
                if (keys.indexOf(x) == -1) {
                    newObj[x] = obj[x];
                }
            }
            return newObj;
        }
    };
    WJF.event = {
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
        }
    }
    WJF.html = {
        /**
         * 创建表单 并执行数据提交
         * @param formData
         */
        submitForm: function (url, formData, opts) {
            let fragment = document.createDocumentFragment();

            function createNodeInFragement(name, value) {
                // 针对 value 为 JSON 情况 暂时支持一层
                if (value != null && typeof (value) == 'object') {
                    for (let key in value) {
                        createNodeInFragement(name + '[' + key + ']', value[key]);
                    }
                    return;
                }
                let tmpNode = document.createElement("input");
                tmpNode.type = "text";
                tmpNode.name = name;
                tmpNode.value = value;
                fragment.appendChild(tmpNode);
            }

            opts = Object.assign({
                method: 'post',
                target: '_blank'
            }, opts);
            let formDom = document.createElement('form');
            formDom.action = url;
            formDom.method = opts.method;
            formDom.target = opts.target;
            formDom.style.dispaly = 'none';

            document.getElementsByTagName('body')[0].appendChild(formDom);

            for (let x in formData) {
                let item = formData[x];
                if (item instanceof Array) {
                    item.forEach((_value, index) => {
                        createNodeInFragement(x + '[' + index + ']', _value);
                    });
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

        },
        // 复制到剪贴板
        copyToClipboard: function (msg, opts) {
            opts = opts || {};
            if (typeof (opts) == 'function') {
                opts = {
                    callback: opts
                }
            }
            var clipBoardDomBtn = this.clipBoardDomBtn;
            if (!clipBoardDomBtn) {
                var linkDom = document.createElement('a');
                linkDom.setAttribute('href', 'javascript:;');
                linkDom.setAttribute('data-showmsg', opts.showMsg !== false ? 1 : 0);
                linkDom.setAttribute('data-clipboard-text', msg);
                document.body.appendChild(linkDom);
                clipBoardDomBtn = this.clipBoardDomBtn = linkDom; //  $('<a href="javascript:;" data-showmsg="' + (opts.showMsg !== false ? 1 : 0) + '" data-clipboard-text="' + msg + '"></a>').appendTo($('body'));
                require(['clipboard'], function (Clipboard) {
                    new Clipboard(clipBoardDomBtn, {}).on('success', function (e) {
                        clipBoardDomBtn.getAttribute('data-showmsg') == "1" && WJF.ui.alert.successTip('复制成功');
                        opts.callback && opts.callback(null, clipBoardDomBtn[0]);
                    });
                    clipBoardDomBtn.click();
                });
            } else {
                clipBoardDomBtn.setAttribute('data-clipboard-text', msg);
                clipBoardDomBtn.setAttribute('data-showmsg', (opts.showMsg !== false ? 1 : 0));
                clipBoardDomBtn.click();
            }
        },

        // 取消所有html标签
        html2Txt: function (str) {
            str = str || "";
            return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }
    }
    WJF.communication = {
        // headers requestOptions  // 用于同一配置初始化时设置的请求头信息
        axiosCustomOptions: {},
        // copy from jquery
        // add paramOptions for encode gbk
        _param: function (a, traditional, paramOptions) {
            paramOptions = paramOptions || {};
            var class2type = {};
            var toString = class2type.toString;
            var hasOwn = class2type.hasOwnProperty;

            function toType(obj) {
                if (obj == null) {
                    return obj + "";
                }
                // Support: Android <=2.3 only (functionish RegExp)
                return typeof obj === "object" || typeof obj === "function" ?
                    class2type[toString.call(obj)] || "object" :
                    typeof obj;
            }

            var isFunction = function isFunction(obj) {
                // Support: Chrome <=57, Firefox <=52
                // In some browsers, typeof returns "function" for HTML <object> elements
                // (i.e., `typeof document.createElement( "object" ) === "function"`).
                // We don't want to classify *any* DOM node as a function.
                return typeof obj === "function" && typeof obj.nodeType !== "number";
            };

            var
                rbracket = /\[\]$/,
                rCRLF = /\r?\n/g,
                rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i,
                rsubmittable = /^(?:input|select|textarea|keygen)/i;

            function buildParams(prefix, obj, traditional, add) {
                var name;

                if (Array.isArray(obj)) {

                    // Serialize array item.
                    obj.forEach(function (v, i) {
                        if (traditional || rbracket.test(prefix)) {

                            // Treat each array item as a scalar.
                            add(prefix, v);

                        } else {

                            // Item is non-scalar (array or object), encode its numeric index.
                            buildParams(
                                prefix + "[" + (typeof v === "object" && v != null ? i : "") + "]",
                                v,
                                traditional,
                                add
                            );
                        }
                    });

                } else if (!traditional && toType(obj) === "object") {

                    // Serialize object item.
                    for (name in obj) {
                        buildParams(prefix + "[" + name + "]", obj[name], traditional, add);
                    }

                } else {

                    // Serialize scalar item.
                    add(prefix, obj);
                }
            }

            // Serialize an array of form elements or a set of
            // key/values into a query string
            var param = function (a, traditional, paramOptions) {
                var prefix,
                    s = [],
                    add = function (key, valueOrFunction) {

                        // If value is a function, invoke it and use its return value
                        var value = isFunction(valueOrFunction) ?
                            valueOrFunction() :
                            valueOrFunction;
                        // 兼容GBK
                        if (paramOptions.charset == 'gbk') {
                            s[s.length] = encodeURIComponent(key) + "=" +
                                escape(value == null ? "" : value).replace(/\+/g, "%u002B");
                        } else {
                            s[s.length] = encodeURIComponent(key) + "=" +
                                encodeURIComponent(value == null ? "" : value);
                        }
                    };

                // If an array was passed in, assume that it is an array of form elements.
                if (Array.isArray(a)) {

                    // Serialize the form elements
                    a.forEach(function (item) {
                        add(item.name, item.value);
                    });

                } else {
                    // If traditional, encode the "old" way (the way 1.3.2 or older
                    // did it), otherwise encode params recursively.
                    for (prefix in a) {
                        buildParams(prefix, a[prefix], traditional, add);
                    }
                }

                // Return the resulting serialization
                return s.join("&");
            };
            return param(a, traditional, paramOptions);
        },
        axiosInstance: null,
        /**
         * 设置全局通用请求参数
         * @param options
         */
        setOptions: function (options) {
            this.init();
            Object.assign(this.axiosInstance, options);
        },
        /**
         * 通用的错误处理
         * @param data
         * @private
         */
        _handleFailure: function (data, opts) {

            opts = opts || {};

            var result = this.parseErrorMsg(data);
            if (result === false) {
                return;
            }
            WJF.ui.alert.error(result, {
                // 安全起见 默认为false
                dangerouslyUseHTMLString: opts.dangerouslyUseHTMLString === true
            });
        },
        parseErrorMsg: function (data, opts) {
            opts = opts || {};
            if ('data' in data) {
                data = data.data;
            }
            if (data == null) {
                return '系统错误，无响应数据！';
            }
            if (typeof (data) === 'string') {
                return data;
            }
            // 充值情况
            if (data['code'] == '550') {
                if (opts.proxyOp !== false && opts.proxyIncharge !== false) {
                    WJF.ui.alert.confirm('当前余额不足，请先充值？', function (flag) {
                        flag && WJF.util.openUrl(WJF.constants.ONLINE_PAY_PAGE);
                    });
                    return false;
                } else {
                    return '当前余额不足';
                }
            }

            // 未登录
            if (data['code'] == '666') {
                if (opts.proxyOp !== false && opts.redirectLogin !== false) {
                    WJF.ui.alert.warn('您当前还未登陆，请先登陆！', function (flag) {
                        if (flag) {
                            window.location.href = '/login.asp';
                        }
                    });
                    return false;
                } else {
                    return '您当前还未登陆，请先登陆！';
                }
            }

            // 需要实名认证
            if (data['code'] == '110') {
                if (opts.proxyOp !== false && opts.proxyRealName !== false) {
                    WJF.ui.alert.warn('根据网络安全法要求，您需要先完成实名认证。请完成账户实名认证后再操作！', '实名认证', {
                        cancelButtonText: '放弃',
                        confirmButtonText: '立即实名认证',
                        showCancelButton: true,
                        callback: function (flag) {
                            if (flag) {
                                window.location.href = '/web/useradmin/realnameauth';
                            }
                        }
                    });
                    return false;
                }
            }

            var errorInfo = data.msg || data.message || data.error || data.errors;
            if (typeof (errorInfo) === "string") {
                return errorInfo;
            } else {
                var errorMsgArr = [];
                if (errorInfo instanceof Array) {
                    errorMsgArr = errorInfo;
                } else {
                    for (var x in errorInfo) {
                        if (x in window.BASE_AJAX_PARAM || x in WJF.constants.AJAX_PARAM) {
                            continue;
                        }
                        if (typeof (errorInfo[x]) == "string") {
                            errorMsgArr.push(errorInfo[x]);
                        } else {
                            errorMsgArr.push(errorInfo[x].join(','));
                        }
                    }
                }
                if (errorMsgArr.length == 0) {
                    errorMsgArr.push('系统错误，请稍后重试！');
                }
                return errorMsgArr.join('<br>');
            }
        },
        init: function () {
            if (this.axiosInstance) {
                return;
            }

            if (!axios) {
                throw '系统未加载插件 axios ';
            }

            // 创建一个 axios 实例
            var axiosCustomOptions = this.axiosCustomOptions;
            var instance = axios.create({
                // baseURL: process.env.VUE_APP_API,
                timeout: 30000, // 请求超时时间
                withCredentials: false,
                headers: Object.assign({
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
                }, (axiosCustomOptions ? axiosCustomOptions.headers : null)),

                // 转换数据的方法 通常用于数据修改之类操作
                // 并对数据进行相应的编码 以及 格式组装 ， 避免使用 axios默认的transformRequest，导致与后端格式不兼容
                transformRequest: [
                    function (data) {
                        var xx = '';
                        try {
                            // 兼容data格式为 a=1&b=2 采用post方式发送请求
                            if (typeof (data) === 'string') {
                                xx = encodeURIComponent(data);
                            } else {
                                // 默认的基础参数配置
                                var paramOptions = (axiosCustomOptions ? axiosCustomOptions.paramOptions : null);
                                xx = WJF.communication._param(data, null, paramOptions);
                            }
                        } catch (e) {
                            WJF.util.error(e);
                        }
                        return xx;
                    }
                ],
                // URL参数序列化函数 如果不配置 则使用 axios自己的， UTF8操作
                paramsSerializer: (axiosCustomOptions ? axiosCustomOptions.paramsSerializer : null)
            });
            // 请求拦截器
            instance.interceptors.request.use(
                function (config) {
                    // 在请求发送之前做一些处理
                    return config;
                },
                function (error) {
                    // 发送失败
                    console.log(error)
                    return Promise.reject(error);
                }
            );

            // 统一错误处理逻辑
            const commonErrHandler = function (data, opts, response) {
                WJF.communication._handleFailure(data, opts);
                WJF.communication._commitLog(data, opts, response);
            };

            // 添加响应拦截器
            instance.interceptors.response.use((response) => {
                    console.log('----------interceptors response-------------')
                    // IE9时response.data是undefined，
                    // 因此需要使用response.request.responseText(Stringify后的字符串)
                    // WTF:
                    let response_prop_data;
                    if (response.data == undefined) {
                        if (response.config.responseType == 'text' || response.config.responseType == '') {
                            response_prop_data = response.request.responseText;
                        } else {
                            response_prop_data = '无反馈';
                        }

                    } else {
                        response_prop_data = response.data;
                    }
                    // 如果指定了返回类型为text (用于兼容ASP)
                    if (response.config.responseType == 'text' || response.config.responseType == 'html') {
                        // 如果转JSON失败，则说明是纯文本
                        if (!(response_prop_data instanceof Object)) {
                            try {
                                response_prop_data = JSON.parse(response_prop_data);
                            } catch (e) {
                                response_prop_data = {
                                    code: WJF.constants.AJAX_SUCCESS_CODE,
                                    data: response_prop_data
                                }
                            }
                        }

                    } else {
                        // 判断data不是Object时，解析成Object
                        if (!(response_prop_data instanceof Object)) {
                            try {
                                response_prop_data = JSON.parse(response_prop_data);
                            } catch (e) {
                                response_prop_data = '返回数据格式解析失败！';
                            }
                        }
                    }

                    response.data = response_prop_data;

                    const {config, data} = response;
                    let {code, result, status} = data || {};
                    // 兼容处理
                    code = code || result || status || 0;
                    code = +code;

                    const nextStep = () => {
                        // 显示指定是否自行处理错误 否则默认不处理
                        let processed = false;
                        if (config && config.failure) {
                            processed = config.failure(data);
                        }
                        // 没有被外界处理
                        if (processed === false) {
                            // 强制不代理处理错误
                            if (config && config.ignoreFailAndError === true) {
                                return Promise.reject(response);
                            }
                            // 否则由框架统一处理错误
                            commonErrHandler({
                                data: data
                            }, config, response);
                        }
                    };

                    // 关闭可能有的请求loading
                    if (config && config.loadingMask) {
                        WJF.communication.hideLoading(config.loadingMask);
                    }

                    // 通讯成功 业务处理状态判断
                    switch (code) {
                        case WJF.constants.AJAX_SUCCESS_CODE:
                            // 只需关心后台真正返回的数据即可
                            config.success && config.success(data);
                            return data;  // break
                        case 600: // 实名认证
                            // 显示指定是否自行处理错误 否则默认不处理
                            var isProcessed = false;
                            if (config && config.failure) {
                                isProcessed = config.failure(data);
                            }
                            // 没有被外界处理 则提示实名认证
                            if (isProcessed === false) {
                                WJF.ui.alert.warn('当前操作需要进行账户实名认证，请先认证！', function () {
                                    window.location.href = '/web/useradmin/realnameauth';
                                });
                            }
                            return data;
                        default:
                            break;
                    }
                    return nextStep();

                    // return Promise.reject(Object.assign({
                    //     data: data
                    // }, {commonErrHandler: commonErrHandler}));

                }, (error) => {
                    // 网络错误 状态码非200情况
                    if (error) {
                        const {response, config} = error;
                        let processed = false;
                        if (response) {
                            // 否则由框架统一处理错误
                            let {status, statusText} = response;
                            statusText = (statusText || '网络错误，请稍后重试') + ' [' + status + ']';
                            if (config && config.error) {
                                processed = config.error(response.data);
                            }
                            // 没有被外界处理
                            if (processed === false) {
                                // 强制不代理处理错误
                                if (config && config.ignoreFailAndError === true) {
                                    return Promise.reject(response);
                                }
                                commonErrHandler({
                                    data: response.data,
                                    msg: statusText
                                }, config, response);
                            }

                        } else {
                            // WJF.ui.alert.error()

                            if (config && config.error) {
                                processed = config.error(error ? error : null);
                            }
                            // 没有被外界处理
                            if (processed === false) {
                                // 强制不代理处理错误
                                if (config && config.ignoreFailAndError === true) {
                                    return Promise.reject(null);
                                }
                                var msg;
                                if (/^timeout of/.test(error.message)) {
                                    msg = '网络超时，请稍后重试！';
                                } else {
                                    msg = (error.message === 'Network Error' ? '网络错误，请稍后重试！' : null) || '网络错误，请稍后重试！'
                                }
                                commonErrHandler({
                                    msg: msg
                                }, config, Object.assign({serverResponse: false}, {
                                    status: error.code,
                                    statusText: error.toString()
                                }));
                            }
                        }

                        // 关闭可能有的请求loading
                        if (config) {
                            WJF.communication.hideLoading(config.loadingMask);
                        }
                    }
                }
            );

            this.axiosInstance = instance;

        },
        /**
         * 通用ajax请求
         * 默认情况下 启用局部遮罩 页面可点
         * @param opts
         * lock 全屏遮罩 则全局不可点
         * @returns {*}
         */
        ajax: function (opts) {
            this.init();

            opts = Object.assign({
                // 兼容命名
                showMask: null,
                method: 'post',
                responseType: 'json',
                // url 参数
                params: {},
                // body 参数
                data: {},
                _failure: function (data) {
                    if (typeof (data) === 'string') {
                        WJF.ui.alert.error(data);
                        return;
                    }
                    var errorInfo = data.msg || data.error || data.errors;
                    if (typeof (errorInfo) === "string") {
                        WJF.ui.alert.error(errorInfo);
                    } else {
                        var errorMsgArr = [];
                        if (errorInfo instanceof Array) {
                            errorMsgArr = errorInfo;
                        } else {
                            for (var x in errorInfo) {
                                if (x in WJF.constants.AJAX_PARAM) {
                                    continue;
                                }
                                if (typeof (errorInfo[x]) == "string") {
                                    errorMsgArr.push(errorInfo[x]);
                                } else {
                                    errorMsgArr.push(errorInfo[x].join(','));
                                }
                            }
                        }
                        if (errorMsgArr.length == 0) {
                            errorMsgArr.push('系统错误，请稍后重试！');
                        }
                        WJF.ui.alert.error(errorMsgArr.join('<br>'));
                    }
                }
            }, (this.axiosCustomOptions ? this.axiosCustomOptions.requestOptions : null), opts);


            if (!opts.url) {
                WJF.ui.alert.error('请求url地址为空 【' + opts.url + '】');
                window.console.error(opts);
                return;
            }

            // 全局启用loading 则默认都启用
            if (WJF.constants.AJAX_LOADING_ENABLE === true && (opts.showMask !== false)) {
                opts.loadingMask = this.showLoading(opts.maskMsg, {
                    // 判断是否需要全屏锁定遮罩
                    lock: opts.lock
                });
            }
            var reqData = opts.data;
            if (reqData && typeof (reqData) !== 'string') {
                // 浅拷贝一次 以免变更到外部变量
                if (opts.method == "post" && (window.BASE_AJAX_PARAM || WJF.constants.AJAX_PARAM)) {
                    reqData = Object.assign({}, reqData, window.BASE_AJAX_PARAM, WJF.constants.AJAX_PARAM);
                } else {
                    reqData = Object.assign({}, reqData);
                }

                // for (var x in reqData) {
                //     // 适配arr.length为0情况 避免做JSON.stringify操作
                //     // 默认情况下 空数组字段丢失
                //     if ((reqData[x] instanceof Array) && reqData[x].length == 0 && opts.supportEmptyArray !== true) {
                //         reqData[x] = null;
                //     }
                // }
                opts.data = reqData;
            }
            // get 请求需要转为 params 参数
            if (opts.method == 'get') {
                opts.params = reqData;
                // 暂时不删除  暂未评估影响
                // delete opts.data;
            }

            // 简单添加随机数 务必保证url格式比较标准
            if (opts.url.match(/\?/)) {
                opts.url = opts.url + '&_r_=' + Math.random();
            } else {
                opts.url = opts.url + '?_r_=' + Math.random();
            }
            // 记录请求开始时间
            var startTime = new Date().getTime();

            opts.url = WJF.util.filterUrl(opts.url);
            return this.axiosInstance.request.call(this.axiosInstance, opts).finally(() => {
                opts.complete && opts.complete();
                console.log(`${opts.url} 请求耗时 ` + ((new Date().getTime()) - startTime) + 'ms');
            });
        },
        _commitLog: function (data, config, response) {
            var result = this.parseErrorMsg(data);

            var logData = {
                result: result,
                url: config.url,
                responseType: config.responseType,
                method: config.method
            };
            if (config.method.toUpperCase() == 'GET') {
                logData.params = config.params;
            } else {
                logData.data = config.data;
            }

            // 同服务器有交互的情况下
            if (response.serverResponse !== false) {
                Object.assign(logData, {
                    response: response.data
                });
            }

            var charset;
            if (this.axiosCustomOptions && this.axiosCustomOptions.paramOptions && this.axiosCustomOptions.paramOptions.charset === 'gbk') {
                charset = 'GBK';
            } else {
                charset = 'UTF-8'
            }

            WJF.serviceManager.post('/errmsg.asp', {
                // 为了避免乱码  UTF-8页面 编码之后传递
                msg: charset == 'UTF-8' ? escape(JSON.stringify(logData)) : JSON.stringify(logData),
                status: response.status || '123',
                statusText: response.statusText,
                charset: charset
            }, function () {
                return true;
            }, {
                showMask: false,
                error: function () {
                    return true;
                },
                failure: function () {
                    return true;
                }
            });
        },
        /**
         * 适配GBK请求参数控制
         */
        adaptGBK: function (charset) {
            charset = charset || 'gbk';
            WJF.communication.axiosCustomOptions = {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded;charset=gbk'
                },
                requestOptions: {
                    responseType: 'text'
                },
                paramOptions: {
                    charset: charset
                },
                paramsSerializer: function (params) {
                    if (typeof (params) === 'string') {
                        return params;
                    }
                    try {
                        var xx = WJF.communication._param(params, null, {charset: charset});
                    } catch (e) {
                        WJF.util.error(e);
                    }
                    return xx;
                }
            }
        },
        /*ajax请求通用*/
        showLoading: function (msg, opts) {
            opts = opts || {};
            if (opts.lock !== false) {
                return WJF.ui.alert.loading(msg || '加载中....');
            } else {
                return WJF.ui.alert.loadingSTip(msg || '加载中....');
            }
        },
        hideLoading: function (obj) {
            return WJF.ui.alert.close(obj);
        },
        /**
         * WebUploader 依赖jQuery
         * @param opts
         * @param WebUploader
         */
        initUploader: function (opts, WebUploader) {

            var trademarkLabel,
                thumbDom,
                thumbImg,
                uploadResult,
                isEnable = true,
                isUploadSuccess = false,
                enableBase64Only, // 是否启用Base64方式 不做文件上传 只做图片数据采集 默认为 false  不启用
                isAllowUploadByClickImg = true // 是否允许直接点击图片上传
            ;
            opts = opts || {
                // 是否启用预览模式  默认不启用，在启用的情况下，上传成功之后，点击图片是预览，而非上传功能
                isEnablePreview: false
            };
            uploadResult = $(opts.pick + " .txt");
            trademarkLabel = $(opts.pick);

            trademarkLabel.addClass('custom-upload-label');

            var defaultTxt = uploadResult.text();

            opts.accept = Object.assign({
                // 只允许选择图片文件。
                title: 'Images',
                extensions: 'gif,jpg,jpeg,bmp,png',
                mimeTypes: 'image/*'
            }, opts.accept);
            enableBase64Only = !!opts.enableBase64Only;
            var uploaderConfig = Object.assign({
                // 选完文件后，是否自动上传。如果开启了 Base64 则设置为 false 不自动上传文件
                auto: enableBase64Only === true ? false : true,
                // swf文件路径
                swf: 'Uploader.swf',
                // 文件接收服务端。
                server: opts.server,
                // 选择文件的按钮。可选。
                // 内部根据当前运行是创建，可能是input元素，也可能是flash.
                pick: opts.pick,//'#J_trademark_img',
                duplicate: true, // 默认可以重复上传
                formData: {},
                /**
                 * @property {Object} [compress]
                 * @namespace options
                 * @for Uploader
                 * @description 配置压缩的图片的选项。如果此选项为`false`, 则图片在上传前不进行压缩。
                 *
                 * 默认为：
                 *
                 * ```javascript
                 * {
                 *     width: 1600,
                 *     height: 1600,
                 *
                 *     // 图片质量，只有type为`image/jpeg`的时候才有效。
                 *     quality: 90,
                 *
                 *     // 是否允许放大，如果想要生成小图的时候不失真，此选项应该设置为false.
                 *     allowMagnify: false,
                 *
                 *     // 是否允许裁剪。
                 *     crop: false,
                 *
                 *     // 是否保留头部meta信息。
                 *     preserveHeaders: true,
                 *
                 *     // 如果发现压缩后文件大小比原来还大，则使用原来图片
                 *     // 此属性可能会影响图片自动纠正功能
                 *     noCompressIfLarger: false,
                 *
                 *     // 单位字节，如果图片大小小于此值，不会采用压缩。
                 *     compressSize: 0
                 * }
                 * ```
                 */
                /*compress: {
                    width: 1600,
                    height: 1600,
                    quality: 90,
                    allowMagnify: false,
                    crop: false,
                    preserveHeaders: true
                }*/
                // 取消图片默认压缩功能 防止灰度图片 压缩之后 出现问题
                compress: false
                // headers: {
                //     'X-Requested-With': 'XMLHttpRequest'
                // },
            }, opts);
            Object.assign(uploaderConfig.formData, window.BASE_AJAX_PARAM);
            var uploader = WebUploader.create(uploaderConfig);

            uploader.on('fileQueued', function (file) {

                if (isEnable === false) {
                    WJF.ui.alert.warn('当前不允许上传！');
                    return;
                }

                if (opts.onBeforeUpload && opts.onBeforeUpload() === false) {
                    return;
                }

                trademarkLabel = $(opts.pick);
                thumbDom = $(opts.pick + " i"); // 默认图
                thumbImg = $(opts.pick + " img"); // 缩略图
                uploadResult = $(opts.pick + " .txt");

                uploadResult.removeClass('success error');

                if (enableBase64Only === true) {
                    // 创建缩略图
                    uploader.makeThumb(file, function (error, src) {
                        if (error) {
                            trademarkLabel.removeClass('show-preview');
                        } else {
                            trademarkLabel.addClass('show-preview');
                            thumbImg.attr('src', src);
                        }
                        if (opts.success && opts.success(null, file, {
                            error: error,
                            src: src
                        }) === true) {
                            return;
                        }
                        uploadResult.removeClass('error').addClass('success');
                        uploadResult.text('上传成功');
                        isUploadSuccess = true;
                    }, 1, 1);
                } else {
                    uploadResult.text('等待上传');
                    isUploadSuccess = false;
                    // 创建缩略图
                    uploader.makeThumb(file, function (error, src) {
                        if (error) {
                            trademarkLabel.removeClass('show-preview');
                        } else {
                            trademarkLabel.addClass('show-preview');
                            thumbImg.attr('src', src);
                        }
                    }, 1, 1);
                }
            });

            // 文件上传过程中创建进度条实时显示。
            uploader.on('uploadProgress', function (file, percentage) {
                // uploadPercent.css('width', percentage * 100 + '%');
                if (opts.onProgressUpdate && opts.onProgressUpdate(file, percentage) === true) {
                    return;
                }
                uploadResult.text('上传中 ' + (percentage * 100 + '%') + '...');
            });

            // 文件上传成功，给item添加成功class, 用样式标记上传成功。
            uploader.on('uploadSuccess', function (file, response) {
                console.log(file, response);
                if (response.code != '200') {
                    if (opts.fail && opts.fail(response, file) === true) {
                        return;
                    }
                    var errMsg = WJF.communication.parseErrorMsg(response);
                    uploadResult.removeClass('success').addClass('error');
                    uploadResult.text(errMsg || '上传失败');
                    // 在启用了预览功能的情况下， 只要上传成功一次之后 就不允许再次点击图片进行上传操作
                    if (opts.isEnablePreview === true) {
                        isAllowUploadByClickImg = true;
                    }
                    return;
                }

                // 在启用了预览功能的情况下， 只要上传成功一次之后 就不允许再次点击图片进行上传操作
                if (opts.isEnablePreview === true) {
                    isAllowUploadByClickImg = false;
                }

                if (opts.success && opts.success(response, file) === true) {
                    return;
                }
                uploadResult.removeClass('error').addClass('success');
                uploadResult.text('上传成功');
                isUploadSuccess = true;

            });


            // 前端校验错误
            uploader.on("error", function (type) {
                switch (type) {
                    case "Q_TYPE_DENIED":
                        WJF.ui.alert.warn("请上传" + opts.accept.extensions + "格式文件");
                        break;
                    case "Q_EXCEED_SIZE_LIMIT":
                        WJF.ui.alert.warn("文件大小不符合要求！");
                        break;
                    case "F_EXCEED_SIZE":
                        WJF.ui.alert.warn("单个文件大小不能超过" + WJF.util.fileSizeParse(uploaderConfig.fileSingleSizeLimit));
                        break;
                    default:
                        WJF.ui.alert.error("上传出错！请检查后重新上传！错误代码" + type);
                }
            });
            // 文件上传失败，显示上传出错。
            uploader.on('uploadError', function (response) {
                if (opts.error && opts.error(response) === true) {
                    return;
                }
                uploadResult.removeClass('success').addClass('error');
                uploadResult.text('上传失败');
                // 在启用了预览功能的情况下， 上传失败了的话 则启用点击上传
                if (opts.isEnablePreview === true) {
                    isAllowUploadByClickImg = true;
                }
            });

            // 完成上传完了，成功或者失败，先删除进度条。
            uploader.on('uploadComplete', function () {
                opts.complete && opts.complete();
                if (opts.isEnablePreview === true) {
                    setInputStatus(isAllowUploadByClickImg);
                } else {
                    uploadResult.removeClass('hide-f');
                }
            });

            // 设置文件选择器的 状态
            function setInputStatus(flag) {
                setTimeout(function () {
                    if (flag === false) {
                        $(opts.pick + ' input[type="file"]').attr('disabled', 'disabled');
                        $(opts.pick + ' .re-choose-upload').removeClass('hide-f');
                        $(opts.pick + " .txt").addClass('hide-f');
                        $(opts.pick + ' input[type="file"]').parent().addClass('hide-f');

                    } else {
                        $(opts.pick + ' input[type="file"]').removeAttr('disabled');
                        $(opts.pick + ' .re-choose-upload').addClass('hide-f');
                        $(opts.pick + " .txt").removeClass('hide-f');
                        $(opts.pick + ' input[type="file"]').parent().removeClass('hide-f');
                    }
                }, 0)
            }

            return {
                uploader: uploader,
                reset: function () {
                    thumbImg = $(opts.pick + " img"); // 缩略图
                    uploadResult = $(opts.pick + " .txt");
                    thumbImg.attr('src', '');
                    uploadResult.removeClass('success error').text(defaultTxt);

                    trademarkLabel.removeClass('show-preview');

                    for (var i = 0, len = uploader.getFiles().length; i < len; i++) {
                        uploader.removeFile(uploader.getFiles()[i]);
                    }
                    uploader.reset();

                    if (opts.isEnablePreview === true) {
                        isAllowUploadByClickImg = true;
                        this.setInputStatus(isAllowUploadByClickImg);
                    }

                },
                setImg: function (src) {
                    thumbImg = $(opts.pick + " img"); // 缩略图
                    if (src) {
                        trademarkLabel.addClass('show-preview');
                        if (opts.isEnablePreview === true) {
                            isAllowUploadByClickImg = false;
                        }
                    } else {
                        trademarkLabel.removeClass('show-preview');
                        if (opts.isEnablePreview === true) {
                            isAllowUploadByClickImg = true;
                        }
                    }
                    thumbImg.attr('src', src);

                    if (opts.isEnablePreview === true) {
                        this.setInputStatus(isAllowUploadByClickImg);
                    }
                },
                enable: function (flag) {
                    isEnable = flag === false ? false : true;
                },
                // 模拟禁用 采用将 input[type=file]设置为disabled来实现
                setInputStatus: setInputStatus,

                triggerUploader: function () {
                    // 模拟选择一次
                    var file = $(opts.pick + ' input[type="file"]');
                    file.removeAttr('disabled');
                    file.trigger('click');
                    file.attr('disabled', 'disabled');
                }
            }
        }
    };
    WJF.serviceManager = {
        // 组装参数
        prepareParams: function (url, data, success, failure, opts) {
            // failure 但不是function 则从第4个参数开始为conf
            if (failure && typeof (failure) !== "function") {
                opts = Object.assign({}, opts, failure);
            } else {
                // 如果传了第4个参数 则格式为 success failure error
                if (typeof (opts) === 'function') {
                    opts = {
                        error: opts
                    };
                }
            }
            return Object.assign({
                url: url,
                data: data,
                success: success,
                failure: typeof (failure) === "function" ? failure : null
            }, opts);
        },
        service: function (url, data, success, error, opts) {
            var params = WJF.serviceManager.prepareParams(url, data, success, error, opts);
            return WJF.communication.ajax(params);
        },
        get: function (url, data, success, error, opts) {
            opts = opts || {};
            var params = WJF.serviceManager.prepareParams(url, data, success, error, opts);
            params.method = 'get';
            return WJF.communication.ajax(params);
        },
        post: function (url, data, success, error, opts) {
            opts = opts || {};
            var params = WJF.serviceManager.prepareParams(url, data, success, error, opts);
            params.method = 'post';
            return WJF.communication.ajax(params);
        }
    }

    WJF.platform = {
        adaptASP: function () {
            WJF.communication.adaptGBK();
            Vue.prototype.$ELEMENT.zIndex = 20000000;
        }
    }

    WJF.ui = {};
    WJF.ui.alert = {};
    Object.assign(WJF.ui.alert, {
        $message: Vue.prototype.$message,
        $loading: Vue.prototype.$loading,

        $alert: Vue.prototype.$alert,
        $confirm: Vue.prototype.$confirm,
        $prompt: Vue.prototype.$prompt,

        // 标准格式 msg title fn/config
        _prepareMessageConfig: function (title, config) {
            if (typeof (title) == 'string') {
                config = config || {};
                config = Object.assign({title: title}, config);
            } else if (typeof (title) == 'function') {// msg fn config 模式
                config = config || {};
                config = Object.assign({callback: title}, config);
            } else {
                // 最多有title为config
                config = Object.assign({}, title, config);
            }

            if (config.callback) {
                config._callback_ = config.callback;
                config.callback = function (flag) {
                    // flag 为'confirm', 'cancel'或'close',
                    // 与 elment-ui 接口保持一致，需要通过传入的参数 来确定是否为 确定 还是 取消 或是 关闭
                    config._callback_(flag == 'confirm', flag);
                };
            }
            return config;
        },
        success: function (msg, title, config) {
            config = this._prepareMessageConfig(title, Object.assign({
                type: 'success'
            }, config));
            return this.$alert(msg, config);
        },
        error: function (msg, title, config) {
            config = this._prepareMessageConfig(title, Object.assign({
                type: 'error'
            }, config));
            return this.$alert(msg, config);
        },
        warn: function (msg, title, config) {
            config = this._prepareMessageConfig(title, Object.assign({
                type: 'warning'
            }, config));
            return this.$alert(msg, config);
        },
        alert: function (msg, title, config) {
            config = this._prepareMessageConfig(title, Object.assign({
                type: 'info'
            }, config));
            return this.$alert(msg, config);
        },
        confirm: function (msg, title, config) {
            config = this._prepareMessageConfig(title, Object.assign({}, config));
            return this.$confirm(msg, config);
        },
        prompt: function (msg, title, config) {
            config = this._prepareMessageConfig(title, Object.assign({}, config));
            return this.$prompt(msg, config);
        },


        //==========begin of tip=============
        _prepareTipConfig: function (op1, op2) {
            var options = Object.assign({
                duration: 3000, // 设置为0 则不自动消失
                showClose: false, // 默认不可手动关闭 设置为true 则可以。
            }, op1, op2);
            return options;
        },
        errorTip: function (msg, options) {
            options = this._prepareTipConfig({
                message: msg,
                type: 'error'
            }, options);
            return this.$message(options);
        },
        warnTip: function (msg, options) {
            options = this._prepareTipConfig({
                message: msg,
                type: 'warning'
            }, options);
            return this.$message(options);
        },
        successTip: function (msg, options) {
            options = this._prepareTipConfig({
                message: msg,
                type: 'success'
            }, options);
            return this.$message(options);
        },
        tip: function (msg, options) {
            options = this._prepareTipConfig({
                message: msg,
            }, options);
            return this.$message(options);
        },
        //=============end of tip=============
        // 全屏遮罩
        loading: function (msg) {
            var globalLoading = this.$loading({
                lock: true,
                text: msg || 'Loading',
                background: 'rgba(0, 0, 0, 0.03)'
            });
            return globalLoading;
        },
        loadingSTip: function (msg) {
            var loading = this.$loading({
                lock: false,
                text: msg || 'Loading',
                background: 'rgba(0, 0, 0, 0.03)',
                customClass: 'el-loading-mask-stip',
                fullscreen: false
            });
            return loading;
        },
        close: function (obj) {
            obj && obj.close();
        }
    });

    // 为Vue扩展东东
    Vue.prototype.get = WJF.serviceManager.get;
    Vue.prototype.post = WJF.serviceManager.post;

    // 过滤器
    Vue.filter('filterUrl', function (url) {
        return WJF.util.filterUrl(url);
    });

    // 添加通用的混入
    var baseMixin = {
        created: function () {

            // 存在系统错误 页面不该继续下一步渲染 则直接退出
            if (window.PAGE_CONFIG && window.PAGE_CONFIG.SERVER_ERROR_MSG) {
                WJF.ui.alert.error(window.PAGE_CONFIG.SERVER_ERROR_MSG);
                throw 'Error:' + window.PAGE_CONFIG.SERVER_ERROR_MSG;
            }
            if (this.queryParams) {
                Object.assign(this.queryParams, WJF.util.getUrlParams());
            } else {
                this.queryParams = WJF.util.getUrlParams();
            }

            if (this.leftMenuId != null && window.leftMenuBar) {
                window.leftMenuBar.setMenu(this.leftMenuId);
            }
        },
        methods: {
            DEBUG_FN: function (...args) {
                console.log(args);
            }
        }
    }
    WJF.util.createInstance = function (opts) {
        opts.mixins = [].concat([baseMixin]).concat(opts.mixins || []);
        let instance = new Vue(Object.assign({}, opts));
        window.PAGE_INSTANCE = instance;
        return instance;
    };


    // 暴露全局变量 为避免重复加载执行或者版本冲突 如有相关版本了 则直接退出
    if (!window.WJF) {
        window.WJF = WJF;
    } else {
        console.warn('WJF版本重复 请确认！');
        window.__WJF__ = WJF;
    }
    return WJF;
}
;/**
 * 本文件模块名是匿名函数，适用于采用require加载，不适用与直接script引入
 * WJF-vue.js 由 WJF-vue-core.js + WJF-vue-footer.js 合并而成
 */
if (("function" == typeof define) && define.amd) {
    if (!window.Vue) {
        // 兼容 Vue 采用 require 加载时，没有Vue全局变量的情况（主要为ASP准备）
        // Vue 采用require加载 则 element-ui 也同样必须采用 require加载
        define(['axios', 'vue', 'ELEMENT'], function (axios, Vue, ELEMENT) {
            window.Vue = Vue;
            Vue.use(ELEMENT); // 务必保留该语句 否则element-ui无法启用
            return f(Vue, axios);
        });
    } else {
        define(['axios'], function (axios) {
            // 兼容 Vue 采用 require 加载时，没有Vue全局变量的情况（主要为ASP准备）
            return f(window.Vue, axios);
        });
    }
} else {
    f(window.Vue, window.axios);
}

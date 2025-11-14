require(['WJF3.0'], (WJF) => {
    WJF.platform.adaptASP();
    Vue.component('trademark-list', {
        name: 'trademark-list',
        template: document.getElementById('J_search_result_tpl').innerHTML,
        props: ['searchData', 'tabIndex', 'searched', 'tmTypeDescMapping','keyword','keywordList','keywordTabsValue'],
        methods: {
            xxx: function (data) {
                console.log('data is ');
                console.log(data)
            },
        }
    });
    window.pageInstance = WJF.util.createInstance({
        el: '#J_containerContent',
        data: {
            // 默认显示第几个 from 1
            tabIndex: 1,
            // 查询数据
            searchData: {
                1: {},
                2: {},
                3: {}
            },
            // 是否已经搜索过
            searched: {
                1: false,
                2: false,
                3: false
            },

            fuzzy: 1, // 0表示近似查询 1 表示精确查询

            // ================= 商标精确查询 查询条件
            type: 'name', // 默认按商标
            typeDescMapping: {
                name: '商标名称 ',
                user: '注册人 ',
                agent: '代理人',
                tmno: '注册号'
            },
            typeList: [
                'name',
                'user',
                'agent',
                'tmno',
            ],
            keyword: '',
            showSelectList: false,
            selectedConditions: [],
            // 保存映射关系 便于控制前台样式控制
            selectedConditionsMapping: {},

            // 批量查询tabs
            keywordList: [],
            reqKeywordMaxNum: 2,   //最大请求次数，一次性发N条数据的请求，超出的则点一下tab请求一次
            keywordNum: 0,   //共N条数据
            REQNum: 0,   //请求的次数
            keywordTabsValue: '0',    //默认显示第几个tab，从0开始
            keywordListTabs: [],
            searchNum: 50,
            // =================== 近似查询 查询条件
            lang: 'cn',
            langList: ['cn', 'en'],
            langDescMapping: {
                cn: '中文',
                en: '英文'
            },
            jscx_currentClsId: [],
            jscx_keyword: '', // 名称
            jscx_status: '',
            op: ['part_of_the_same', 'add_substr_anywhere', 'change_substr', 'minux_substr', 'included_in_the_others', 'included_others', 'change_order', 'reverse_order', 'sounds_same',], // 默认选中 除去完全相同外的其他选项 ， 至少选中一个
            // 近似查询选项
            opList: [
                'same',
                'part_of_the_same',
                'add_substr_anywhere',
                'change_substr',
                'minux_substr',
                'included_in_the_others',
                'included_others',
                'change_order',
                'reverse_order',
                'sounds_same'
            ],
            opDescMapping: {
                same: '完全相同',
                part_of_the_same: '部分相同',
                add_substr_anywhere: '加字符',
                change_substr: '变字符',
                minux_substr: '减字符',
                included_in_the_others: '包含在其它商标中',
                included_others: '内含其它商标',
                change_order: '换序',
                reverse_order: '逆序',
                sounds_same: '读音相同'
            },
            jscx_selectedConditions: [],
            // 保存映射关系 便于控制前台样式控制
            jscx_selectedConditionsMapping: {},

            // 批量查询tabs
            jscx_keywordList: [],
            jscx_reqKeywordMaxNum: 2,   //最大请求次数，一次性发N条数据的请求，超出的则点一下tab请求一次
            jscx_keywordNum: 0,   //共N条数据
            jscx_REQNum: 0,   //请求的次数
            jscx_keywordTabsValue: '0',    //默认显示第一条数据结果
            jscx_keywordListTabs: [],

            //========图形查询============
            txcx_currentClsId: '',
            file: '',
            //=====================

            // 通用查询条件
            trademarkCate: [],

            // 分页信息
            pageInfo: {
                // tabIndex 作为索引
                1: {
                    totalCount: 0,
                    totalPage: 0,
                    currentPage: 1, // 精确查询
                },
                2: {
                    totalCount: 0,
                    totalPage: 0,
                    currentPage: 1, // 近似查询
                },
                3: {
                    totalCount: 0,
                    totalPage: 0,
                    currentPage: 1, // 图形查询
                }
            },
            pageInfoTabs: {},  //批量分页信息

            // 商标分类是否折叠 默认折叠
            tmCateCollapsed: true,
            // 已经选择的分类条件
            selectedCateCondition: [],

            // 当前商标状态
            currentStatus: '',
            trademarkStatusList: [
                "", 0, 1, 2, 3, 4
            ],
            trademarkStatusMapping: {
                "": "全部",
                "0": "待审中",
                "1": "已驳回",
                "2": "已初审",
                "3": "已注册",
                "4": "已销亡"
            },

            // 商标分类
            tmTypeDescMapping: {
                P: '普通商标',
                Z: '证明商标',
                J: '集体商标',
                T: '特殊商标'
            },          
            searchCode: '',   //获取验证码
            searchCodeVisible: false,
            codeIsWrite: false,
            codesrc:'/config/DvCode.asp?k='+ codeKey+'&'
        },
        mounted: function () {
            this.searchTrademark = this.searchTrademark || WJF.util.debounce((page) => {
                page = page || 1;
                this._searchTrademark.apply(this, [page]);
            }, 300);
            this.regEvent();
            this.getTrademarkCate();

            var tmpTabIndex = WJF.util.getUrlParams('tabIndex');
            if (tmpTabIndex) {
                this.tabIndex = parseInt(tmpTabIndex);
            }

            if (this.tabIndex == '1') { // 精确查询
                this.fuzzy = 1;
            } else if (this.tabIndex == '2') { // 近似查询
                this.fuzzy = 0;
            } else {
                this.fuzzy = '';
            }

            var isSearchData = false;
            switch (this.tabIndex) {
                case 1:
                    // 精确查询 兼容处理别的地方表单提交 跳转到本页面情况
                    var type = WJF.util.getUrlParams('type', null, '');
                    var keyword = WJF.util.getUrlParams('keyword', null, '');
                    keyword = decodeURIComponent(keyword);
                    if (type) {
                        this.type = type;
                    }
                    if (keyword) {
                        this.keyword = keyword;
                        isSearchData = true; // 有关键字的情况 执行查询
                    }
                    break;
            }

            //this.initUploader();
            if (isSearchData === true) {
                this._searchTrademark();
            }
        },
        methods: {
            getTrademarkCate: function () {
                WJF.serviceManager.get('/API/common/public/trademark/default.asp?k=search/category', {}, (data) => {
                    this.trademarkCate = data.data.category;
                });
            },
            getCode:function(){
                this.codesrc+=parseInt(Math.random()*10)

            },
            //===========下拉框事件处理========
            selectItem: function (e) {
                this.typeDesc = e.target.getAttribute('data-desc');
                this.type = e.target.getAttribute('data-value');
                this.showSelectList = false;
            },
            regEvent: function () {
                document.body.addEventListener('click', (e) => {
                    this.showSelectList = false;
                });
            },
            /**
             *
             * @param e
             */
            handleChange: function (value, type) {
                var isDoSearchData = false;
                switch (type) {
                    case 'tabIndex':
                        if (value == '1') { // 精确查询
                            this.fuzzy = 1;
                        } else if (value == '2') { // 近似查询
                            this.fuzzy = 0;
                        }
                        break;
                    // 下拉菜单隐藏/显示
                    case 'showSelectList':
                        this.showSelectList = !this.showSelectList;
                        console.log(this.showSelectList);
                        return;
                    // 精确查询 商标分类隐藏/显示
                    case 'tmCateCollapsed':
                        this.tmCateCollapsed = !this.tmCateCollapsed;
                        return;
                    // 精确查询 选中的分类条件
                    case 'selectedCateCondition':
                        if (value === false) {
                            this.selectedConditionsMapping = {};
                            this.selectedCateCondition = [];
                        } else {
                            var index = this.selectedCateCondition.indexOf(value);
                            // 存在当前分类条件中
                            if (index > -1) {
                                this.selectedCateCondition.splice(index, 1);
                                // delete this.selectedConditionsMapping[(value.clsid)];
                                this.$set(this.selectedConditionsMapping, value.clsid, false);
                            } else {
                                this.selectedCateCondition.push(value);
                                // this.selectedConditionsMapping[value.clsid] = true;
                                this.$set(this.selectedConditionsMapping, value.clsid, true);
                            }
                        }
                        return;

                    //=====================近似查询=====
                    case 'jscx_currentClsId': // 近似查询 当前商标分类

                        if (value === false) {
                            this.jscx_selectedConditionsMapping = {};
                            this.jscx_selectedConditions = [];
                        } else {
                            var index = this.jscx_selectedConditions.indexOf(value);
                            // 存在当前分类条件中
                            if (index > -1) {
                                this.jscx_selectedConditions.splice(index, 1);
                                // delete this.jscx_selectedConditionsMapping[(value.clsid)];
                                this.$set(this.jscx_selectedConditionsMapping, value.clsid, false);
                            } else {
                                this.jscx_selectedConditions.push(value);
                                // this.jscx_selectedConditionsMapping[value.clsid] = true;
                                this.$set(this.jscx_selectedConditionsMapping, value.clsid, true);

                            }
                        }
                        return;

                    case 'jscx_status': // 近似查询 状态
                        isDoSearchData = true;
                        break;
                    //===================图形查询===========
                    case 'txcx_currentClsId':
                        if (this.txcx_currentClsId == value.clsid) {
                            this.txcx_currentClsId = '';
                        } else {
                            this.txcx_currentClsId = value.clsid;
                        }
                        if (this.file) {
                            this._searchTrademark(1);
                        }
                        return;
                    default:
                        break;
                }
                this[type] = value;

                if (isDoSearchData === true) {
                    this._searchTrademark();
                }
            },
            // 精确查询 清空所有选中的条件
            clearAllSelected: function () {
                this.currentStatus = '';
                this.selectedCateCondition = [];
                this.selectedConditionsMapping = {};
            },
            _searchTrademark: function (page, tabData) {
                var targetPage = typeof (page) == 'number' ? page : 1;
                var reqUrl = WJF.util.filterUrl('/API/common/public/trademark/default.asp?k=search/keyword-search&page=' + targetPage);
                var tabIndex = +this.tabIndex;
                switch (tabIndex) {
                    case 1:
                        this.keyword = this.keyword.replace(/^\s+|\s+$/g, '');
                        if (!this.keyword) {
                            WJF.ui.alert.warnTip('请输入商标名称!');
                            this.searched[tabIndex] = false;
                            return;
                        }
                        break;
                    case 2:
                        this.jscx_keyword = this.jscx_keyword.replace(/^\s+|\s+$/g, '');
                        if (!this.jscx_keyword) {
                            WJF.ui.alert.warnTip('请输入商标名称!');
                            this.searched[tabIndex] = false;
                            return;
                        }
                        break;
                    case 3: // 图形查询
                        if (this.file == '') {
                            WJF.ui.alert.warnTip('请先上传图片!');
                            return;
                        }
                        if (this.txcx_currentClsId == '') {
                            WJF.ui.alert.warnTip('请选择商标分类!');
                            return;
                        }
                        break;
                }
                // 判断是否输入验证码
                if (this.codeIsWrite != true) {
                    this.searchCodeVisible = true;
                    this.getCode();
                    return false;
                }
               // this.codeIsWrite=false;
                var queryData = {};
                // 分页
                this.pageInfo[this.tabIndex].currentPage = targetPage || 1;
                switch (this.tabIndex) {
                    case 1: // 精确查询
                        var clsid = [];
                        this.selectedCateCondition.forEach((item) => {
                            clsid.push(item.clsid);
                        });
                        queryData = {
                            fuzzy: this.fuzzy,
                            type: this.type,
                            clsid: clsid.join(','),
                            status: this.currentStatus,
                            codekey:codeKey,
                            code:this.searchCode
                        };
                        //批量查询
                        if (this.keywordList.length == 0) {    //判断关键字数组是否为空
                            //关键字处理
                            var keywordArr = [];
                            this.keywordList = [];
                            keywordArr = this.keyword.split('\n');
                            keywordArr.forEach((item) => {
                                item = WJF.util.trim(item);
                                if (item != '' && this.keywordList.indexOf(item) == -1) {
                                    this.keywordList.push(item);
                                }
                            });
                            this.keywordNum = this.keywordList.length;
                            if (this.keywordNum > this.searchNum) {
                                WJF.ui.alert.warnTip('您好，批量查询的个数最大不能超多50个哦!');
                                return false
                            }
                            // 组装tab数据
                            this.keywordList.forEach((item, index) => {
                                this.$set(this.keywordListTabs, index, {
                                    title: item,
                                    name: index + '',
                                    content: {},
                                });
                            });
                            console.log(this.keywordList);
                        }
                        if (this.keywordNum == 1) {
                            //单条查询
                            Object.assign(queryData, {
                                keyword: this.keywordList[0],
                            });
                            Object.assign(this.keywordListTabs[0], queryData);
                        } else {
                            //批量查询
                            //批量查询条件是否一致
                            var formData = this.keywordListTabs[+this.keywordTabsValue];  //缓存的全部查询数据
                            //对比关键字是否相同
                            var titleIs = tabData ? formData.title == (tabData.title || this.keywordListTabs[+tabData.name].title) : formData.title == this.keywordList[this.REQNum];

                            if (titleIs && formData.fuzzy == this.fuzzy && formData.type == this.type && formData.status === this.currentStatus && formData.clsid == clsid.join(',')) {
                                this.searchData[this.tabIndex] = this.keywordListTabs[+this.keywordTabsValue].content;
                                this.pagination(this.searchData[this.tabIndex]);
                                return false
                            } else {

                                //从tab选中进来带tabData
                                if (tabData) {
                                    Object.assign(queryData, {
                                        keyword: tabData.title || this.keywordListTabs[+tabData.name].title,
                                    });
                                    Object.assign(this.keywordListTabs[+tabData.name], queryData);
                                } else {
                                    if (this.REQNum < this.reqKeywordMaxNum && JSON.stringify(this.keywordListTabs[this.REQNum].content) == "{}") {
                                        //第一次进来批量请求接口数据
                                        Object.assign(queryData, {
                                            keyword: this.keywordList[this.REQNum],
                                        });
                                        Object.assign(this.keywordListTabs[this.REQNum], queryData);
                                    } else {
                                        //点击查询条件或者分页
                                        Object.assign(queryData, {
                                            keyword: this.keywordList[+this.keywordTabsValue],
                                        });
                                        Object.assign(this.keywordListTabs[+this.keywordTabsValue], queryData);
                                    }
                                }
                            }
                        }
                        break;
                    case 2: // 近似查询
                        var clsid = [];
                        this.jscx_selectedConditions.forEach((item) => {
                            clsid.push(item.clsid);
                        });
                        queryData = {
                            fuzzy: this.fuzzy,
                            lang: this.lang,
                            clsid: clsid.join(','),
                            op: this.op.join(','),
                            status: this.jscx_status,
                            type: 'name',
                            codekey:codeKey,
                            code:this.searchCode
                        };
                        //批量查询
                        var keywordArr = [];
                        var keywordArr2 = [];
                        keywordArr = this.jscx_keyword.split('\n');
                        keywordArr.forEach((item) => {
                            item = WJF.util.trim(item);
                            if (item != '' && keywordArr2.indexOf(item) == -1) {
                                keywordArr2.push(item);
                            }
                        });
                        if (keywordArr2.length > this.searchNum) {
                            WJF.ui.alert.warnTip('您好，批量查询的个数最大不能超多50个哦!');
                            return false
                        }
                        if (this.jscx_keywordList.length == 0) {    //判断关键字数组是否为空
                            //关键字处理
                            this._jscx_keyword(keywordArr2);
                            console.log(this.jscx_keywordList);
                        } else {
                            //判断新旧关键字长度是否相同
                            if (keywordArr2.length == this.jscx_keywordList.length) {
                                var formData = this.jscx_keywordListTabs[+this.jscx_keywordTabsValue];  //缓存的全部查询数据
                                //避开并发请求、tab点击、分页，只剩手工点击的“免费查询”
                                if (this.jscx_REQNum >= this.jscx_reqKeywordMaxNum && !tabData && targetPage == +formData.content.page) {

                                    //判断关键字数组是否相同
                                    var titleIs = tabData ? formData.title == (tabData.title || this.jscx_keywordListTabs[+tabData.name].title) : formData.title == this.jscx_keywordList[+this.jscx_keywordTabsValue];
                                    var pageIs = targetPage == +formData.content.page;
                                    if (titleIs && pageIs && formData.fuzzy == this.fuzzy && formData.type == this.type && formData.status === this.jscx_status && formData.clsid == clsid.join(',') && formData.lang == this.lang && formData.op == this.op.join(',')) {
                                        //判断输入框的关键字和之前缓存的是否相同
                                        if (keywordArr2.toString() == this.jscx_keywordList.toString()) {
                                            return false
                                        } else {
                                            this.jscx_REQNum = 0;
                                            this.jscx_keywordTabsValue = '0';
                                            this.jscx_keywordListTabs = [];
                                            this._jscx_keyword(keywordArr2);
                                        }
                                    }
                                }
                            } else {
                                // 长度不相同，直接重新查询
                                this.jscx_REQNum = 0;
                                this.jscx_keywordTabsValue = '0';
                                this.jscx_keywordListTabs = [];
                                this._jscx_keyword(keywordArr2);
                            }
                        }
                        if (this.jscx_keywordNum == 1) {
                            //单条查询
                            this.jscx_keywordList = keywordArr2;
                            Object.assign(queryData, {
                                keyword: this.jscx_keywordList[0],
                            });
                            Object.assign(this.jscx_keywordListTabs[0], queryData);
                        } else {
                            //批量查询条件是否一致
                            var formData = this.jscx_keywordListTabs[+this.jscx_keywordTabsValue];  //缓存的全部查询数据
                            //对比关键字是否相同
                            var titleIs = tabData ? formData.title == (tabData.title || this.jscx_keywordListTabs[+tabData.name].title) : formData.title == this.jscx_keywordList[this.jscx_REQNum];
                            var pageIs = targetPage == +formData.content.page;
                            if (titleIs && pageIs && formData.fuzzy == this.fuzzy && formData.type == this.type && formData.status === this.jscx_status && formData.clsid == clsid.join(',') && formData.lang == this.lang && formData.op == this.op.join(',')) {
                                this.searchData[this.tabIndex] = this.jscx_keywordListTabs[+this.jscx_keywordTabsValue].content;
                                this.pagination(this.searchData[this.tabIndex]);
                                return false
                            } else {
                                //从tab选中进来带tabData
                                if (tabData) {
                                    Object.assign(queryData, {
                                        keyword: tabData.title || this.jscx_keywordListTabs[+tabData.name].title,
                                    });
                                    Object.assign(this.jscx_keywordListTabs[+tabData.name], queryData);
                                } else {
                                    if (this.jscx_REQNum < this.jscx_reqKeywordMaxNum && JSON.stringify(this.jscx_keywordListTabs[this.jscx_REQNum].content) == "{}") {
                                        //第一次进来批量请求接口数据
                                        Object.assign(queryData, {
                                            keyword: this.jscx_keywordList[this.jscx_REQNum],
                                        });
                                        Object.assign(this.jscx_keywordListTabs[this.jscx_REQNum], queryData);
                                    } else {
                                        //点击查询条件或者分页
                                        Object.assign(queryData, {
                                            keyword: this.jscx_keywordList[+this.jscx_keywordTabsValue],
                                        });
                                        Object.assign(this.jscx_keywordListTabs[+this.jscx_keywordTabsValue], queryData);
                                    }
                                }
                            }
                        }
                        break;
                }
                this.post(reqUrl, queryData, (data) => {
                    //批量查询数据处理
                    switch (tabIndex) {
                        case 1:
                            if (this.keywordNum > 1) {
                                if (tabData) {
                                    this.keywordListTabs[+tabData.name].content = data.data;
                                } else {
                                    if (this.REQNum < this.reqKeywordMaxNum) {
                                        this.keywordListTabs[this.REQNum].content = data.data;
                                    } else {
                                        this.keywordListTabs[+this.keywordTabsValue].content = data.data;
                                    }
                                }
                                console.log(this.keywordListTabs);
                                this.searchData[tabIndex] = this.keywordListTabs[+this.keywordTabsValue].content;
                            } else {
                                //普通查询
                                this.searchData[this.tabIndex] = data.data;
                            }
                            break;
                        case 2:
                            if (this.jscx_keywordNum > 1) {
                                if (tabData) {
                                    this.jscx_keywordListTabs[+tabData.name].content = data.data;
                                } else {
                                    if (this.jscx_REQNum < this.jscx_reqKeywordMaxNum) {
                                        this.jscx_keywordListTabs[this.jscx_REQNum].content = data.data;
                                    } else {
                                        this.jscx_keywordListTabs[+this.jscx_keywordTabsValue].content = data.data;
                                    }
                                }
                                console.log(this.jscx_keywordListTabs);
                                this.searchData[tabIndex] = this.jscx_keywordListTabs[+this.jscx_keywordTabsValue].content;
                            } else {
                                //普通查询
                                this.searchData[this.tabIndex] = data.data;
                            }
                            break;
                        case 3: // 图形查询
                            this.searchData[this.tabIndex] = data.data;
                            this.searchData[this.tabIndex].page = this.pageInfo[this.tabIndex].currentPage;
                            break;
                    }
                    this.pagination(this.searchData[this.tabIndex]);
                }, {
                    failure: (data) => {
                        
                        if (data.msg && data.msg.match(/请登录/)) {
                            WJF.ui.alert.error(data.error, () => {
                                window.islogin(() => {
                                    this._searchTrademark(page, tabData);
                                });
                            });
                            return true;
                        }else if(data.msg && data.msg.match(/验证码不正确/)){
                            this.searchCodeVisible = true;
                            return false;
                        } else {
                            return false;
                        }
                    },
                    complete: () => {
                        // 标示是否已经做过一次查询了
                        this.searched[this.tabIndex] = true;

                        // 批量查询处理
                        switch (this.tabIndex) {
                            case 1:
                                if (this.keywordNum > 1) {
                                    if (!tabData) {
                                        this.REQNum += 1;
                                        if (this.REQNum < this.reqKeywordMaxNum) {   //若请求数据的次数小于等于最大请求次数，则再次查询一次
                                            this._searchTrademark(1);
                                        }
                                    }
                                }
                                break;
                            case 2:
                                if (this.jscx_keywordNum > 1) {
                                    if (!tabData) {
                                        this.jscx_REQNum += 1;
                                        if (this.jscx_REQNum < this.jscx_reqKeywordMaxNum) {   //若请求数据的次数小于等于最大请求次数，则再次查询一次
                                            this._searchTrademark(1);
                                        }
                                    }
                                }
                                break;
                        }
                    }
                });
            },
            _jscx_keyword: function (keywordArr2) {
                this.jscx_keywordList = keywordArr2;
                this.jscx_keywordNum = this.jscx_keywordList.length;
                // 组装tab数据
                this.jscx_keywordList.forEach((item, index) => {
                    this.$set(this.jscx_keywordListTabs, index, {
                        title: item,
                        name: index + '',
                        content: {},
                    });
                });
            },
            // 分页
            pagination: function (params) {
                require(['laypage'], (laypage) => {
                    laypage({
                        cont: 'pager_' + this.tabIndex, //容器。值支持id名、原生dom对象，jquery对象。【如该容器为】：<div id="page1"></div>
                        pages: params.totalPage, //通过后台拿到的总页数
                        curr: +params.page || 1, //当前页
                        skip: true,
                        // first:false,
                        // last:false,
                        jump: (obj, first) => { //触发分页后的回调
                            if (!first) { //点击跳页触发函数自身，并传递当前页：obj.curr
                                this.searchTrademark(obj.curr);
                            }
                        }
                    });
                });
            },
            // 清除近似查询条件
            clearJSCXCondition: function () {
                this.jscx_keyword = "";
                this.jscx_currentClsId = [];
                this.jscx_selectedConditionsMapping = {};
                this.jscx_status = '';
                this.jscx_keyword = ''; // 名称
                this.lang = 'cn';
                this.op = ['part_of_the_same', 'add_substr_anywhere', 'change_substr', 'minux_substr', 'included_in_the_others', 'included_others', 'change_order', 'reverse_order', 'sounds_same',]; // 默认选中 除去完全相同外的其他选项 ， 至少选中一个
            },
            // 手动点击查询
            submitSearch: function () {
                this.currentPage = 1;
                this.keywordList = [];
                this.keywordListTabs = [];
                this.keywordNum = 0;
                this.REQNum = 0;
                this.keywordTabsValue = '0';
                this.searchTrademark();
            },
            /**
             * 精确查询--批量查询tab，选中事件
             * @param tab  tab.index索引   tab.name值   tab.label名称
             * @param event
             */
            keywordTabsClick: function (tab) {
                if (JSON.stringify(this.keywordListTabs[+tab.name].content) == "{}") {
                    this._searchTrademark(1, tab)
                } else {
                    var clsid = [];
                    this.selectedCateCondition.forEach((item) => {
                        clsid.push(item.clsid);
                    });
                    var formData = this.keywordListTabs[+this.keywordTabsValue];  //缓存的全部查询数据
                    if (formData.keyword == tab.label && formData.fuzzy == this.fuzzy && formData.type == this.type && formData.status === this.currentStatus && formData.clsid == clsid.join(',')) {
                        this.searchData[this.tabIndex] = this.keywordListTabs[+this.keywordTabsValue].content;
                        this.pagination(this.searchData[this.tabIndex]);
                        return false
                    } else {
                        this._searchTrademark(this.currentPage, formData)
                    }
                }
            },
            /**
             * 近似查询--批量查询tab，选中事件
             * @param tab
             * @param event
             */
            jscx_keywordTabsClick: function (tab) {
                if (JSON.stringify(this.jscx_keywordListTabs[+tab.name].content) == "{}") {
                    this._searchTrademark(1, tab)
                } else {
                    var clsid = [];
                    this.jscx_selectedConditions.forEach((item) => {
                        clsid.push(item.clsid);
                    });
                    var formData = this.jscx_keywordListTabs[+this.jscx_keywordTabsValue];  //缓存的全部查询数据
                    if (formData.keyword == tab.label && formData.fuzzy == this.fuzzy && formData.type == this.type && formData.status === this.jscx_status && formData.clsid == clsid.join(',') && formData.lang == this.lang && formData.op == this.op.join(',')) {
                        this.searchData[this.tabIndex] = this.jscx_keywordListTabs[+this.jscx_keywordTabsValue].content;
                        this.pagination(this.searchData[this.tabIndex]);
                        return false
                    } else {
                        this._searchTrademark(this.currentPage, formData)
                    }
                }
            },
            clearTxcxCondition: function () {
                this.txcx_currentClsId = '';
                this.file = '';
                this.fileUploader.reset();
            },
            uploadFile: function () {

            },
            // 提交获取验证码
            searchCodeSubmit: function () {                
                this.post('/API/common/public/trademark/default.asp?k=searchcode', {codekey:codeKey,code:this.searchCode}, (data) => {                
                // 确定之后
                    this.codeIsWrite = true;
                    this.searchCodeVisible = false;
                    this.searchTrademark();       
                },(data)=>{
                    WJF.ui.alert.alert(data.msg, '温馨提示', {
                        dangerouslyUseHTMLString: true
                    });
                    this.codeIsWrite = false;
                    this.searchCodeVisible = true;  
                    this.getCode();                  
                });
            }
        },
        computed: {
            isShowSelectedConditions: function () {
                if (this.currentStatus === "" && this.selectedCateCondition.length == 0) {
                    return false;
                } else {
                    return true;
                }
            }
        },
        watch: {
            'currentStatus': function () {
                this.searchTrademark();
            },
            'selectedCateCondition': function () {
                this.searchTrademark();
            },
            'op': function (newOpArr, oldOpArr) {
                if (newOpArr.length < 1) {
                    WJF.ui.alert.warnTip('至少选择一种查询类型');
                    this.$nextTick(() => {
                        this.op = oldOpArr;
                    });
                }
            }
        }
    });
});

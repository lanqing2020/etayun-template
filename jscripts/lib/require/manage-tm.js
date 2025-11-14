require(['WJF3.0', 'webuploader'], (WJF, WebUploader) => {
    WJF.platform.adaptASP();
    Vue.component('tree-item', {
        name: "tree-item",
        template: document.getElementById('J_treeItemTpl').innerHTML,
        props: ["list", "classClick", "activeListMapping", 'level1Expanded', 'level2Expanded'],
    });
    window.abc = WJF.util.createInstance({
        el: '#J_containerContent',
        data: {
            proposerList: [],  //申请人列表

            cateDataMapping: {},

            list: [],  // 根数据

            currentItem: null,  //当前点击的

            activeListData: [],  //左侧选中列表

            level_1_selectedMapping: {}, // 根据 key 记录选中的第一层
            level_2_selectedMapping: {}, // 根据 key 记录选中的第二层 cid为父层 ID
            level_3_selectedMapping: {}, // 根据 key 记录选中的第三层 gid为父层 ID

            level_1_expandedNodeMapping: {}, // 展开的父节点
            level_2_expandedNodeMapping: {}, // 展开的父节点

            // 申请数据
            regData: {
                proposer: '',  //申请人id
                type: 0,  //商标类型: 0文字;1图形;2文字+图形
                name: '',  //商标名
                desc: '',  //商标描述
                logo: '',  //商标图样
                color: 0,  //商标颜色 1彩色;0黑白
                proxyfile: '',  //代理委托书, 1表示使用申请人自带的
                ordertype: 0,  //0  订单类别,0-自助注册,1-顾问注册,2-担保注册
                category: 1,   //自助注册的两种提交方式: 1需要审核 2不需要审核, 默认为1
                proxyfile_type: 1 // 默认为有名称版 1为有名称版 2 为无名称版
               
            },
            proxyfile_view: '', // 申请人自带的委托书 由管理中心创建时 上传的
            requireWTS: true, // 默认情况下 都需要委托书

            // 系统推荐分类
            recommendId: [],
            recommendOptions: [],

            customSolutions: [],

            keyword: '', // 搜索关键字
            searchResult: [],
            isSearchMode: false,
            "base": null, // 基础价格 10项以内的价格
            "unit": null, // 单价
            "noaudit": null, // 直接提交到注册局省下的差价
            agree: false,
            previewImgPath: '',
            previewImgList: [],

            // 编辑模式
            id: '',
            mode: '',
            enableWatch: true,

            // 风险提示
            riskTipVisible: false,
            // 相同主体 两月内 订单数量
            tmordersSpec: [],
            isShowSameOrdersWindow: false,
            historySelection: ''
        },
        mounted: function () {
            this.preparePage();
        },
        methods: {
            // 申请人列表获取
            getPoposerList: function () {
                WJF.serviceManager.post('/API/common/public/trademark/default.asp?k=proposer/list', {status:1}, (data) => {
                    this.proposerList = data.data.data;
                });
            },
            // 分类列表获取
            getTMCategoryList: function (item, callback) {
                var reqData, type, classId;
                var keyPrefix = '';
                var keyName = 'clsId';
                if (item == null) { // 根层
                    type = 0;
                    reqData = {
                        type: type
                    };
                    keyName = 'clsId';
                } else {
                    switch (item.level) {
                        case 0:
                            reqData = {
                                type: 1,
                                classId: item.clsId
                            };
                            keyPrefix = item.key;
                            keyName = 'id';
                            break;
                        case 1:
                            reqData = {
                                type: 2,
                                classId: item.id
                            };
                            keyPrefix = item.key;
                            keyName = 'id';
                            break;
                    }
                    item._loading_ = true;
                }
                WJF.serviceManager.post('/API/common/public/trademark/default.asp?k=trademark/class', reqData, ({ data }) => {
                    var list = [];
                    for (var x in data) {
                        Object.assign(data[x], {
                            _expanded_: false,
                            _active_: false,
                            _loading_: false,
                            children: [],
                            // 循环列表使用的KEY
                            keyId: WJF.util.generateId(),
                            // 构建每个字段的专属ID，用于实现查询结果和原始列表数据对应 规则为： 当前节点的所有父层ID+当前ID join('_')
                            pKey: keyPrefix,
                            key: keyPrefix + '_' + data[x][keyName]
                        });
                        list.push(data[x]);
                    }
                    var cateId = reqData.classId == null ? '-1' : reqData.classId;
                    this.cateDataMapping[cateId] = list;

                    // 保存当前点击展开的 节点
                    if (item) {
                        switch (item.level) {
                            case 0:
                                this.level_1_expandedNodeMapping[item.key] = item;
                                break;
                            case 1:
                                this.level_2_expandedNodeMapping[item.key] = item;
                                break;
                        }
                    }

                    if (item) {
                        item['children'] = list;
                        item._loaded_ = true;
                    } else {
                        this.list = list;
                    }

                    // 标示数据已经初始化
                    this._baseCategoryReady_ = true;
                    this.$emit('base-category-ready');

                    callback && callback();

                }, {
                    complete: () => {
                        item && (item._loading_ = false);
                    }
                });
            },
            /**
             * 文字商标 自动生成logo
             */
            generateTMLogo: function () {
                // https://www888.west.cn
                if (!this.regData.name) {
                    WJF.ui.alert.warnTip('请先输入商标名称！');
                    return;
                }
                WJF.ui.alert.confirm('生成图样字体为“思源黑体”，商标最终使用以图样为准。建议自行设计商标图样，生成图样会覆盖现有图样，确认是否要生成？', (flag) => {
                    if (flag) {
                        this.tmLogoUploader.reset();
                        this.post('/API/common/public/trademark/default.asp?k=trademark/draw', {
                            str: this.regData.name
                        }, (data) => {
                            this.regData.logo = data.data;
                            this.tmLogoUploader.setImg(this.regData.logo);
                        });
                    }
                });
            },
            proxyUploadLogo: function () {
                this.tmLogoUploader.reset();
                document.getElementById('J_trademark_logo').click();
            },
            /**
             * 使用申请人记录 自有的 委托书 来填充
             * @param id
             */
            updateProposerDetail: function (id) {
                this.post('/API/common/public/trademark/default.asp?k=trademark/detail', {
                    id: id
                }, ({ data }) => {
                    console.log(data);
                    // data.proxyfile && (document.getElementById('J_proxyfile_preview').src = this.formData.proxyfile_preview);
                    // data.orgcert && (document.getElementById('J_orgcert_preview').src = this.formData.orgcert_preview);
                    // data.idcert && (document.getElementById('J_idcert_preview').src = this.formData.idcert_preview);
                    if (data.proxyfile) { // 有委托书的情况
                        this.proxyfile_view = data.proxyfile_view;
                    } else {
                        this.proxyfile_view = '';
                        this.regData.proxyfile = '';
                    }
                });
            },
            // 更新委托书提示
            updateWTSTip: function () {
                if (!this.regData.proposer) {
                    this.tmordersSpec = [];
                    return;
                }
                this.get('/API/common/public/trademark/default.asp?k=trademark/tmorders-spec', {
                    id: this.regData.proposer
                }, (data) => {
                    this.tmordersSpec = data.data;
                });
            },
            handleWTS: function (type) {
                switch (type) {
                    case 1:// 使用申请人模板委托书
                        this.requireWTS = true;
                        if (this.proxyfile_view) {
                            this.regData.proxyfile = 1;
                            document.getElementById('J_wts_preview').src = this.proxyfile_view;
                        }
                        break;
                    case 2: // 单独上传委托书
                        this.requireWTS = true;
                        document.getElementById('J_trademark_wts').click();
                        break;
                    case 3: // 先跳过
                        this.requireWTS = false;
                        this.regData.proxyfile = '';
                        this.wtsUploader.reset();
                        this.$forceUpdate();
                        document.getElementById('J_wts_preview').src = WJF.util.filterUrl('https://www.west.cn/paas/images/trademark/reg/upload-later.jpg');
                        // this.wtsUploader.setInputStatus(false);
                        this.wtsUploader.setImg(WJF.util.filterUrl('https://www.west.cn/paas/images/trademark/reg/upload-later.jpg'));
                        break;
                }
            },
            //=======================商标分类

            // 获取系统推荐分类
            getRecommendCategory: function () {
                this.get('/API/common/public/trademark/default.asp?k=goods-tpl/category', {}, (data) => {
                    this.recommendOptions = data.data;
                });
            },
            handleRecommendChange: function (value) {
                console.log(value);
            },
            confirmRecommend: function () {
                if (this.recommendId.length != 2) {
                    WJF.ui.alert.warnTip('请选择推荐方案');
                    return false;
                }

                // 如果是编辑模式 则有数据的情况下 不允许直接添加
                if (this.mode == 1 && WJF.util.isEmptyObject(this.getSelectedCategory()) !== true) {
                    WJF.ui.alert.warn('修改商标申请订单，只能同时添加一个大类，请先删除当前已有大类！');
                    return;
                }

                this.useDefineTpl(this.recommendId[1]);
            },
            useDefineTpl: function (id) {
                this.get('/API/common/public/trademark/default.asp?k=goods-tpl/list', {
                    id: id
                }, (data) => {
                    var categoryList = data.data.category;
                    this._clearAllChooseList();
                    // 清空分类数据中  可能有关联信息
                    this.getTMCategoryList(null, () => {
                        categoryList.forEach((item) => {
                            this.initCategoryChoose(item);
                        });
                    });
                });
            },
            // ==================== 自定义方案操作
            // 获取自定义方案列表
            getCustomSolutions: function () {
                this.get('/API/common/public/trademark/default.asp?k=goods-tpl/mine', {}, (data) => {
                    this.customSolutions = data.data;
                });
            },
            addCustomSolutions: function () {
                // 判断当前已选择的商标分类是否有数据
                var customSolution = [];
                this.activeListData.forEach((item_1) => {
                    item_1._selected_list_.forEach((item_2) => {
                        item_2._selected_list_.forEach((item_3) => {
                            customSolution.push(item_3.id);
                        });
                    });
                });

                if (customSolution.length == 0) {
                    WJF.ui.alert.warnTip('请先选择商标分类');
                    return;
                }

                WJF.ui.alert.prompt('填写标签名称', '保存商标类别', {
                    closeOnClickModal: false,
                    inputPlaceholder: '请输入标签名',
                    inputValue: '',
                    inputPattern: /[^\s]+/,
                    inputErrorMessage: '请输入标签名'
                }).then((result) => {
                    if (result.action == 'confirm') {
                        var label = WJF.util.trim(result.value);
                        if (label) {
                            this.post('/API/common/public/trademark/default.asp?k=goods-tpl/add', {
                                lable: label,
                                "class": customSolution
                            }, () => {
                                WJF.ui.alert.successTip('添加成功！');
                                this.getCustomSolutions();
                            });
                        }
                    }
                }
                );
            },
            // 删除自定义方案
            removeCustomSolutions: function (item) {
                WJF.ui.alert.confirm('确定要删除该自定义方案吗？', (flag) => {
                    if (!flag) {
                        return;
                    }
                    this.get('/API/common/public/trademark/default.asp?k=goods-tpl/del', {
                        id: item.id
                    }, (data) => {
                        WJF.ui.alert.successTip('删除成功');
                        this.getCustomSolutions();
                    });
                });
            },
            // 使用自定义方案
            chooseCustomSolution: function (item) {
                // 如果是编辑模式 则有数据的情况下 不允许直接添加
                if (this.mode == 1 /*&& WJF.util.isEmptyObject(this.getSelectedCategory()) !== true*/) {
                    WJF.ui.alert.warn('编辑模式不支持快速添加！');
                    return;
                }
                this.useDefineTpl(item.id);
            },

            classClick: function (item, callback, realClick) {
                switch (item.level) {
                    case 0:
                        if (!this.level_1_expandedNodeMapping[item.key]) {
                            Vue.set(this.level_1_expandedNodeMapping, item.key, item);
                            if (item._loaded_ !== true) {
                                this.getTMCategoryList(item, callback);
                            }
                        } else {
                            Vue.set(this.level_1_expandedNodeMapping, item.key, false);
                        }
                        this.$forceUpdate();
                        break;
                    case 1:
                        if (!this.level_2_expandedNodeMapping[item.key]) {
                            Vue.set(this.level_2_expandedNodeMapping, item.key, item);
                            if (item._loaded_ !== true) {
                                this.getTMCategoryList(item, callback);
                            }
                        } else {
                            Vue.set(this.level_2_expandedNodeMapping, item.key, false);
                        }
                        this.$forceUpdate();
                        break;
                    case 2: // 第三层 不可展开
                        this.addItem(item, {
                            // 非用户直接点击的 默认情况下 不展开
                            expanded: realClick === false ? false : true
                        });
                        callback && callback();
                        break;
                }
            },
            search: function () {

                if (this.keyword == '') {
                    this.resetCategoryList();
                    return;
                }

                // 备份原来列表
                !this.list_bak && (this.list_bak = this.list);
                !this.level_1_expandedNodeMapping_bak && (this.level_1_expandedNodeMapping_bak = this.level_1_expandedNodeMapping);
                !this.level_2_expandedNodeMapping_bak && (this.level_2_expandedNodeMapping_bak = this.level_2_expandedNodeMapping);
                this.isSearchMode = true;
                this.get('/API/common/public/trademark/default.asp?k=manage-tm/search-class', { keyword: this.keyword }, (data) => {
                    var searchResult = data.data;
                    this.level_1_expandedNodeMapping = {};
                    this.level_2_expandedNodeMapping = {};

                    if (searchResult.length == 0) {
                        this.list = searchResult;
                        return;
                    }
                    // 组装数据并设置基本状态
                    searchResult.forEach((item_0) => {
                        Object.assign(item_0, {
                            _expanded_: true,
                            _active_: false,
                            _loading_: false,
                            _loaded_: true,
                            level: 0,
                            keyId: WJF.util.generateId(),
                            key: '_' + item_0.clsId,
                            pKey: '',
                        });
                        this.level_1_expandedNodeMapping[item_0.key] = item_0; // 记录默认展开的
                        item_0.children = item_0.children || [];
                        item_0.children.forEach((item_1) => {
                            Object.assign(item_1, {
                                _expanded_: true,
                                _active_: false,
                                _loading_: false,
                                _loaded_: true,
                                level: 1,
                                keyId: WJF.util.generateId(),
                                pKey: item_0.key,
                                key: item_0.key + '_' + item_1['id']
                            });
                            this.level_2_expandedNodeMapping[item_1.key] = item_1;// 记录默认展开的
                            item_1.children = item_1.children || [];
                            item_1.children.forEach((item_2) => {
                                Object.assign(item_2, {
                                    level: 2,
                                    _active_: false,
                                    keyId: WJF.util.generateId(),
                                    pKey: item_0.key + '_' + item_1['id'],
                                    key: item_0.key + '_' + item_1['id'] + '_' + item_2['id']
                                });
                            });
                        });
                    });
                    this.list = searchResult;
                });
            },
            // 重置分类列表
            resetCategoryList: function (isReset) {
                // 还原原来的列表数据
                this.list = this.list_bak || this.list;
                if (isReset) {
                    this.level_1_expandedNodeMapping = {}; // 展开的父节点
                    this.level_2_expandedNodeMapping = {}; // 展开的父节点

                } else {
                    this.level_1_expandedNodeMapping = this.level_1_expandedNodeMapping_bak || this.level_1_expandedNodeMapping; // 展开的父节点
                    this.level_2_expandedNodeMapping = this.level_2_expandedNodeMapping_bak || this.level_2_expandedNodeMapping; // 展开的父节点

                }
                this.list_bak = null;
                this.level_1_expandedNodeMapping_bak = null;
                this.level_2_expandedNodeMapping_bak = null;
                this.keyword = '';
            },
            /**
             * 添加选中
             * @param item
             */
            addItem: function (item, opts) {
                opts = opts || {};
                var level_2_node = this.level_2_expandedNodeMapping[item.pKey]; // 第二层节点
                var level_1_node = this.level_1_expandedNodeMapping[level_2_node.pKey]; // 第1层节点


                // 编辑模式下，一级大类只能选择一项

                console.log(level_1_node, level_2_node);

                if (!WJF.util.isEmptyObject(this.level_1_selectedMapping) && this.mode == 1) {
                    if (!this.level_1_selectedMapping[level_1_node.key]) {
                        WJF.ui.alert.warn('修改商标申请订单，只能同时添加一个大类，若要添加其他大类，请先删除当前已有大类！');
                        return;
                    }
                }

                this.level_1_selectedMapping[level_1_node.key] = level_1_node; // 记录第一层 第二层选中的数据
                this.level_2_selectedMapping[level_2_node.key] = level_2_node;

                // 手动点击的
                if (opts.expanded === true) {
                    level_1_node._selected_expanded = true;
                }

                Vue.set(this.level_3_selectedMapping, item.key, item);
                this.collectSelectData();
            },
            // 用于组装 选中的数据列表
            collectSelectData: function () {
                var list = [];

                for (var key in this.level_1_selectedMapping) {
                    var item = this.level_1_selectedMapping[key]; // 第1层节点
                    item._selected_list_ = []; // 提前清空，以便下面的第二层的for循环使用
                    list.push(item);
                }

                for (var key in this.level_2_selectedMapping) {
                    var item = this.level_2_selectedMapping[key]; // 第2层节点
                    item._selected_list_ = [];
                    var parentItem = this.level_1_selectedMapping[item.pKey];
                    parentItem._selected_list_.push(item);
                }

                for (var key in this.level_3_selectedMapping) {
                    var item = this.level_3_selectedMapping[key]; // 第3层节点
                    var parentItem = this.level_2_selectedMapping[item.pKey];
                    parentItem._selected_list_.push(item);
                }
                list.sort((a, b) => {
                    return a.clsId > b.clsId ? 1 : -1;
                });
                this.activeListData = list;
                this.$forceUpdate();
            },
            // 用于展开已选择的商标分类列表
            toggleListExpanded: function (status, index) {
                if (index != null) {
                    var list = this.activeListData;
                    list.forEach((item, _index) => {
                        if (_index == index) {
                            item._selected_expanded = status;
                        } else {
                            item._selected_expanded = !status;
                        }
                    });
                    this.activeListData = list;
                }

            },
            /**
             * 在本地渲染后的数据中 根据ID 查询对应的记录
             * @param list
             * @param id
             * @param level
             * @returns {*}
             */
            getItem: function (list, id, level) {
                switch (level) {
                    case 1: // 查询第一级
                        return list.find((item) => {
                            return item.clsId == id;
                        });
                    case 2:// 查询第二级
                        return list.find((item) => {
                            return item.id == id;
                        });
                    case 3:// 查询第三级
                        return list.find((item) => {
                            return item.id == id;
                        });
                }
            },
            toggleSelectList: function (item) {
                item._selected_expanded = !item._selected_expanded;
                this.$forceUpdate();
            },
            _clearAllChooseList: function () {

                this.level_1_selectedMapping = {}; // 根据 key 记录选中的第一层
                this.level_2_selectedMapping = {}; // 根据 key 记录选中的第二层 cid为父层 ID
                this.level_3_selectedMapping = {}; // 根据 key 记录选中的第三层 gid为父层 ID

                this.level_1_expandedNodeMapping = {}; // 展开的父节点
                this.level_2_expandedNodeMapping = {}; // 展开的父节点

                this.collectSelectData();
            },
            // 删除或者清空选中
            clearAllChooseList: function (item, level) {
                if (!item) {
                    // 全部删除
                    WJF.ui.alert.confirm('确定清空所有选中的商标类别吗？', (flag) => {
                        if (flag) {
                            this._clearAllChooseList();
                            return;
                        }
                    });
                }

                switch (level) {
                    case 1: // 删除1级
                        var level_1_node = this.level_1_selectedMapping[item.key];
                        for (var x in this.level_2_selectedMapping) {
                            var item_2 = this.level_2_selectedMapping[x]; // 所有的被选中的第二层
                            if (item_2.pKey == level_1_node.key) { // 相同 则需要删除该二层
                                for (var y in this.level_3_selectedMapping) {
                                    var item_3 = this.level_3_selectedMapping[y];
                                    if (item_3.pKey == item_2.key) {
                                        Vue.delete(this.level_3_selectedMapping, y);
                                    }
                                }
                                Vue.delete(this.level_2_selectedMapping, x);
                            }
                        }
                        Vue.delete(this.level_1_selectedMapping, item.key);
                        this.collectSelectData();
                        break;
                    case 3: // 删除3级
                        var level_2_node = this.level_2_selectedMapping[item.pKey];
                        var level_1_node = this.level_1_selectedMapping[level_2_node.pKey];
                        // 删除3级
                        Vue.delete(this.level_3_selectedMapping, item.key);

                        // 该二级下没有第三级了 则删除该二级
                        var isExistLevel3 = false;
                        for (var x in this.level_3_selectedMapping) {
                            if (this.level_3_selectedMapping[x].pKey == level_2_node.key) {
                                isExistLevel3 = true;
                                break;
                            }
                        }
                        if (isExistLevel3 === false) {
                            Vue.delete(this.level_2_selectedMapping, level_2_node.key);
                        }

                        // 一级下没有二级了 则删除该一级
                        var isExistLevel2 = false;
                        for (var x in this.level_2_selectedMapping) {
                            if (this.level_2_selectedMapping[x].pKey == level_1_node.key) {
                                isExistLevel2 = true;
                                break;
                            }
                        }
                        if (isExistLevel2 === false) {
                            Vue.delete(this.level_1_selectedMapping, level_1_node.key);
                        }
                        this.collectSelectData();
                        break;
                }
            },
            // 获取基础价格
            getBasePrice: function () {
                var reqData = {
                    product: this.regData.ordertype,
                    category:this.regData.category
                };
                this.post('/API/common/public/trademark/default.asp?k=trademark/getprice', reqData, (data) => {
                   // console.log(data.data);
                    this.base = data.data.base;
                    this.unit = data.data.unit;
                    this.noaudit = 0;
                });
            },
            // 获取一个大类下 选中的小类（第三类）的总数量
            _getRowCount: function (item) {
                var count = 0;
                for (var x in this.level_2_selectedMapping) {
                    var item_2 = this.level_2_selectedMapping[x];
                    if (item_2.pKey == item.key) {
                        for (var y in this.level_3_selectedMapping) {
                            var item_3 = this.level_3_selectedMapping[y];
                            if (item_3.pKey == item_2.key) {
                                count++;
                            }
                        }
                    }
                }
                return count;
            },
            // 显示每一个大类的总价
            rowPrice: function (item) {
                if (this.base == null) {
                    return '--';
                }
                var count = this._getRowCount(item);
                if (count > 10) {
                    return this.base + (count - 10) * this.unit;
                } else {
                    return this.base;
                }
            },
            rowPriceDetail: function (item) {
                if (this.base == null) {
                    return '--';
                }
                var count = this._getRowCount(item);

                if (count >= 10) {
                    return '（已选<span class="count">' + count + '</span>项，10项以上每项加收<span class="count">' + this.unit + '</span>元）';
                } else {
                    return '（已选<span class="count">' + count + '</span>项，还可以再选择<span class="count">' + (10 - count) + '</span>项，10项以内<span class="count">' + this.base + '</span>元）'
                }
            },
            // 下载委托书
            downloadWTS: function () {
                WJF.ui.alert.alert('委托书分为有名称版和无名称版，请确认？', '温馨提示', {
                    showClose: false,
                    callback: (flag) => {
                        var name = this.regData.name;
                        var proxyfile_type;
                        if (flag) {
                            proxyfile_type = 1;
                            if (this.regData.type == '1') { // 图形商标情况 默认填写 '图形'
                                name = '图形';
                            }
                            if (!name) {
                                WJF.ui.alert.warnTip('请输入商标名称');
                                return;
                            }
                        } else {
                            name = ''; // 无名称版 重置为空
                            proxyfile_type = 2;
                        }
                        // 根据用户下载的 做选择
                        this.regData.proxyfile_type = proxyfile_type;
                        this._doDownloadWTS({
                            trademark: name,
                            proxyfile_type: proxyfile_type
                        });

                    },
                    showCancelButton: true,
                    cancelButtonText: '下载无名称版',
                    confirmButtonText: '下载有名称版'
                });
            },
            _doDownloadWTS: function (formData) {
                if (this.regData.proposer) {
                    formData.id = this.regData.proposer;
                }
                formData.k='proposer/draw';
                WJF.html.submitForm('/API/common/public/trademark/default.asp', formData, {
                    method: 'get'
                });
            },
            confirmSelectHistoryWTS: function () {
                if (this.historySelection === '') {
                    WJF.ui.alert.warnTip('请选择委托书');
                    return;
                }

                this.$nextTick(function () {
                    // 使用历史订单的，则需要传对应的ID Int值
                    this.regData.proxyfile = +this.historyWTS.id;
                    this.wtsUploader.setImg(this.historyWTS.proxyfile);
                    this.regData.proxyfile_type = 2; // 重置为无名称版

                    this.isShowSameOrdersWindow = false;
                });

            },
            // 获取当前用户选择的分类
            getSelectedCategory: function () {
                var cateMapping = {};
                this.activeListData.forEach((item_1) => {
                    cateMapping[item_1.clsId] = cateMapping[item_1.clsId] || {};
                    item_1._selected_list_.forEach((item_2) => {
                        cateMapping[item_1.clsId][item_2.id] = cateMapping[item_1.clsId][item_2.id] || [];
                        item_2._selected_list_.forEach((item_3) => {
                            cateMapping[item_1.clsId][item_2.id].push(item_3.id);
                        });
                    });
                });
                return cateMapping;
            },
            // 提交审核
            regSubmit: function (category) {
                /*
                proposer:3 申请人id
                type:2  商标类型: 0文字;1图形;2文字+图形
                name:我1  商标名
                desc:大大的有潜力  商标描述
                logo:xxxx  商标图样
                color:1  商标颜色 1彩色;0黑白
                class:{"5":{"47":["2046","2047"], "48":["2059"]}} 所属分类
                proxyfile:1 代理委托书, 1表示使用申请人自带的
                ordertype:0  订单类别,0-自助注册,1-顾问注册,2-担保注册

                category 1需要审核 2不需要审核, 自助注册的两种提交方式,
                */
                this.regData.category = category;
                let reqData = Object.assign({}, this.regData);
                console.log(this.regData);
                var removeKeys = [];
                removeKeys.forEach((key) => {
                    delete reqData[key];
                });

                if (reqData.proposer == '') {
                    WJF.ui.alert.warn('请选择申请人模板！');
                    return false;
                }

                if (reqData.type != 1 && reqData.name == '') {
                    WJF.ui.alert.warn('请填写商标名称！');
                    return false;
                }

                /* if (reqData.desc == '') {
                     WJF.ui.alert.warn('请填写商标说明！');
                     return false;
                 }*/

                if (!reqData.logo) {
                    WJF.ui.alert.warn('请上传商标图样！');
                    return false;
                }

                if (this.requireWTS && !reqData.proxyfile) {
                    WJF.ui.alert.warn('请上传委托书！');/*或者选择稍后上传委托书*/
                    return false;
                }


                // 组装所属分类
                var cateMapping = this.getSelectedCategory();

                if (WJF.util.isEmptyObject(cateMapping)) {
                    WJF.ui.alert.warn('请选择商标类别！');
                    return false;
                }

                reqData['class'] = JSON.stringify(cateMapping);
                if (!this.agree) {
                    WJF.ui.alert.warn('您还未阅读并同意《西部数码商标注册协议》!');
                    return false;
                }

                var url = '/API/common/public/trademark/default.asp?k=trademark/submit';
                if (this.mode == '1') {
                    url = '/API/common/public/trademark/default.asp?k=trademark/modify';
                    reqData.id = this.id;
                }
                console.log(reqData);
                this.post(url, reqData, (data) => {
                    WJF.ui.alert.success(this.mode == '1' ? '修改成功！' : '提交成功！', () => {
                        window.location.href = WJF.util.filterUrl('/manager/trademark/manage-base.asp');
                    });
                });
            },
            previewImg: function (path) {
                this.previewImgPath = path;
                this.previewImgList = [path];
                this.$nextTick(() => {
                    this.$refs['previewComp'].clickHandler();
                });
            },
            initUploader: function (fun) {
                this.get('/API/common/public/trademark/default.asp?k=gettoken', {}, (data) => {
                    if(data.code!=200){
                        WJF.ui.alert.warn("接口出错");
                        return false;
                    }
                    var filetoken = data.data;
                    this.tmLogoUploader = WJF.communication.initUploader({
                        // 文件接收服务端。
                        server: WJF.util.filterUrl('https://www.west.cn/paas/trademark/agent/file/upload?type=sbty'), // type=1 表示商标 后端用于图片分辨率判断使用
                        // 内部根据当前运行是创建，可能是input元素，也可能是flash.
                        pick: '#J_trademark_logo',//'#J_trademark_img',
                        formData: {token:filetoken},
                        beforeFileQueued: (file) => {
                            // debugger;
                        },
                        onBeforeUpload: () => {
                            this.regData.logo = '';                            
                        },
                        success: (response) => {
                            this.regData.logo = response.data;
                        },
                        fileSingleSizeLimit: 200 * 1024,
                        accept: {
                            extensions: 'jpg,jpeg'
                        },
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest'
                        },
                        isEnablePreview: true
                    }, WebUploader);
                    this.wtsUploader = WJF.communication.initUploader({
                        // 文件接收服务端。
                        server: WJF.util.filterUrl('https://www.west.cn/paas/trademark/agent/file/upload?type=wts'),
                        // 内部根据当前运行是创建，可能是input元素，也可能是flash.
                        pick: '#J_trademark_wts',//'#J_trademark_img',
                        formData: {token:filetoken},
                        onBeforeUpload: () => {
                            this.regData.proxyfile = '';
                            this.regData.token=filetoken;
                        },
                        success: (response) => {
                            this.regData.proxyfile = response.data;
                        },
                        fileSingleSizeLimit: 2 * 1024 * 1024,
                        accept: {
                            extensions: 'jpg'
                        },
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest'
                        },
                        isEnablePreview: true
                    }, WebUploader);
                     fun && fun();   
                });

                // 用于实现 文件点击按钮重新上传  ===== 后续不再使用基于jQuery的上传插件
                $('#J_containerContent').on('click', '.re-choose-upload', (event) => {
                    var type = $(event.target).attr('data-type');
                    this.reChooseFile(type);
                });

                $('#J_containerContent').on('click', '.img-wrapper img', (event) => {
                    var src = event.target.src;
                    if (src) {
                        this.previewImg(src);
                    }
                });


            },
            reChooseFile: function (type) {
                var uploader;
                switch (type) {
                    case 'wts':
                        uploader = this.wtsUploader;
                        break;
                    case 'logo':
                        uploader = this.tmLogoUploader;
                        break;
                }
                uploader.triggerUploader();
            },
            preparePage: function () {
                // 处理url参数
                var ordertype = WJF.util.getUrlParams('ordertype', null, '0');
                this.regData.ordertype = ordertype;
                var searchkeyword = WJF.util.getUrlParams('kw', null, '');
                this.regData.name = unescape(searchkeyword);
                this.getPoposerList();
                var mode = WJF.util.getUrlParams('mode');
                if (mode == '1') { // 编辑模式
                    this.mode = mode;
                    this.initEditData();
                } else {
                    this.initUploader();
                    this.getTMCategoryList();
                }

                // 初始化系统分类
                this.getRecommendCategory();
                // 获取自定义分类
                this.getCustomSolutions();
            },
            initCategoryChoose: function (category) {
                // 模拟选中分类等信息
                var local_item_1 = this.getItem(this.list, category.id, 1);
                // 模拟展开第一层
                this.classClick(local_item_1, () => {
                    category.children.forEach((response_item_2) => {
                        // 模拟展开第二层
                        var local_item_2 = this.getItem(local_item_1.children, response_item_2.id, 2);
                        if (!local_item_2) { // 没有该分类了
                            console.warn('已经没有分类 1' + response_item_2.name);
                            return;
                        }
                        this.classClick(local_item_2, () => {
                            // 模拟点击第三层 执行添加操作
                            response_item_2.children.forEach((response_item_3) => {
                                var local_item_3 = this.getItem(local_item_2.children, response_item_3.id, 3);
                                if (!local_item_3) {
                                    console.warn('已经没有分类 2' + response_item_3.name);
                                    return;
                                }
                                this.addItem(local_item_3);
                            });
                        }, false);
                    });
                }, false);
            },
            initEditData: function () {
                this.enableWatch = false;
                this.id = WJF.util.getUrlParams('id');
                this.post('/API/common/public/trademark/default.asp?k=trademark/detail', { id: this.id }, ({ data }) => {
                    console.log(data);
                    let { category, info, proposer } = data;
                    this.regData.proposer = info.appid;

                    if (info.ordertype != this.regData.ordertype) {
                        this.regData.ordertype = info.ordertype;   //0  订单类别,0-自助注册,1-顾问注册,2-担保注册
                        // 获取基准价格
                    }
                    this.getBasePrice();
                    Object.assign(this.regData, {
                        proposer: info.appid,   //申请人id
                        type: info.tmtype,  //商标类型: 0文字;1图形;2文字+图形
                        name: info.name,    //商标名
                        desc: info.info,    //商标描述
                        logo: info.logo ? info.logo.split('id=')[1] : '',    //商标图样
                        color: info.color,  //商标颜色 1彩色;0黑白
                        proxyfile: info.proxyfile ? info.proxyfile.split('id=')[1] : '',   //代理委托书, 1表示使用申请人自带的
                        proxyfile_type: info.proxyfile_type, // 委托书类别 1为有名称 2 为无名称
                        category: info.category,  //自助注册的俩种提交方式，1需要审核，2不需要审核
                    });

                    // 暂时先延时 避免vue重现渲染
                    setTimeout(() => {
                        this.initUploader(()=>{
                            var baseUrl = WJF.util.filterUrl('/API/common/public/trademark/default.asp?k=file1/show&id=');
                            if (this.regData.logo) {
                                this.tmLogoUploader.setImg(baseUrl + this.regData.logo);
                            }
    
                            if (this.regData.proxyfile) {
                                this.wtsUploader.setImg(baseUrl + this.regData.proxyfile);
                            } else {
                                // this.handleWTS(3);
                            }
                        });
                        
                    }, 0);
                    // 获取分类基础数据
                    this.getTMCategoryList(null, () => {
                        this.enableWatch = true;
                        this.initCategoryChoose(category);
                    });

                    // 更新委托书 相同主体提示
                    //this.updateWTSTip();
                });
            }

        },
        computed: {
            // 订单数量
            'totalOrder': function () {
                var count = this.activeListData.length || 0;
                return count;
            },
            // 商标分类价格
            'totalCount': function () {
                if (this.base == null) {
                    return '--';
                }
                var count = 0;
                this.activeListData.forEach((item) => {
                    count += this.rowPrice(item);
                });
                return count;
            },
            // 订单总价格
            'totalPrice': function () {
                if (this.base == null) {
                    return '--';
                }
                var count = 0;
                this.activeListData.forEach((item) => {
                    count += this.rowPrice(item);
                });
               // if (this.regData.category == 2) {
                //    count -= this.noaudit;
               // }
                count = count < 0 ? 0 : count;
                return count;
            },
            existSameOrder: function () {
                return this.tmordersSpec.length > 0;
            },
            // 当前可能选择的历史委托书
            historyWTS: function () {
                if (this.historySelection === '') {
                    return null;
                }
                return this.tmordersSpec[this.historySelection] || null;
            }

        },
        watch: {
            'regData.ordertype': function () {
                if (this.enableWatch === false) {
                    return;
                }
                this.getBasePrice();
            },
            'regData.category': function () {    
                this.getBasePrice();
            },
            'regData.proposer': function (newVal) {
                if (this.enableWatch === false) {
                    return;
                }                
                this.updateProposerDetail(newVal);
                this.updateWTSTip();
            }
        }
    });
});

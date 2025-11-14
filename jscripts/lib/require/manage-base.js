$(function () {
    // 本页JS
    require(['WJF3.0'], (WJF) => {
        WJF.platform.adaptASP();
        window._currentPageInstance = WJF.util.createInstance({
            el: '#J_baseContainer',
            data: {
                // 分页
                page: 1,
                totalCount: 0,
                pageSize: 10,

                ORDER_STATUS_LIST: {}, // 订单状态列表
                TM_STATE_LIST: {}, // 商标状态列表
                PAY_STATE_LIST: {},  //支付状态
                ORDER_TYPE_LIST: [],

                ORDER_STATUS_MAPPING: {},
                TM_STATUS_MAPPING: {},
                PAY_STATUS_MAPPING: {},
                ORDER_TYPE_MAPPING: {}, //

                selectAllFlag: false,
                // 查询表单
                formData: {
                    keyword: '',
                    order_state: '', // 订单状态
                    tm_state: '', // 商标状态
                    ordertype: '',
                    paid: '',  //支付状态
                    category: '',  //提交方式
                    date: []
                },
                // 表格数据
                trademarkTableData: [],
                // 当前选中的行的ID
                ids: [],
                selection: [],

                // 付款信息
                payInfo: {},
                payInfoCategory: [],  //分类信息
                payInfoVisible: false,
                // 批量付款信息
                batchPayInfoVisible: false,
                batchPayPrice: null,  //批量付款价格

                //随机显示联系人
                contact_cy: {
                    name: '曹颖',
                    qq: 2477268274
                },
                contact_lwy: {
                    name: '李雯颖',
                    qq: 2210982413
                },
                contactQQ: '',
            },
            mounted: function () {
                this.preparePage();

                // 随机显示两人的QQ，
                let num = Math.round(Math.random() * 10);
                this.contactQQ = num % 2 == 0 ? this.contact_cy.qq : this.contact_lwy.qq;
            },
            methods: {
                // 查询
                trademarkDataSearch: function () {
                    var reqData = Object.assign({
                        page: this.page
                    }, this.formData);

                    if (reqData.date.length > 0) {
                        reqData.start = reqData.date[0] + ' 00:00:00';
                        reqData.end = reqData.date[1] + ' 23:59:59';
                    }

                    this.post('/API/common/public/trademark/default.asp?k=trademark/list', reqData, (data) => {
                        data.data.data
                        this.trademarkTableData = data.data.data;
                        this.totalCount = data.data.totalCount;
                    });
                },
                // 翻页
                handleCurrentChange: function (val) {
                    this.page = val;
                    this.trademarkDataSearch();
                },

                // 自定义的全选/反向函数
                toggleAllSelection: function () {
                    this.$refs.trademarkTable.toggleAllSelection();
                },
                /**
                 * 选中变更
                 * @param selection 当前所有被选中的行数据
                 */
                handleSelectionChange: function (selection) {
                    this.selection = selection;
                    var ids = this.selection.map(item => item.id);
                    this.ids = ids;
                },
                /**
                 * 表格自带全选事件回调
                 * @param selection
                 */
                handleSelectAll: function (selection) {
                    this.selection = selection;
                },
                // 批量付款
                batchPayment: function (row) {
                    if (row) {
                        // 1. 单独付款
                        if (this.payInfo.id != row.id) {
                            this.payInfo = row;
                            // 获取分类信息
                            this.payInfoCategory = [];
                            this.loading = true;
                            this.post('/API/common/public/trademark/default.asp?k=trademark/detail', {id: this.payInfo.id}, (data) => {
                                let category = [];
                                category = data.data.category.children;
                                category.forEach((item) => {
                                    if (item.children && item.children.length > 0) {
                                        item.children.forEach((_item) => {
                                            this.payInfoCategory.push(_item);
                                        })
                                    }
                                });
                                console.log(this.payInfoCategory);
                                this.loading = false;
                            });
                        }
                        this.payInfoVisible = true;
                    } else {
                        // 2. 批量付款
                        try {
                            // 需判断一下，只有“未付款”状态的商标才能付款
                            this.selection.forEach((item) => {
                                if (item.can_pay != 1) throw "亲，只有订单状态为“未支付”的情况下，才可以进行支付哦！";
                            });
                        } catch (err) {
                            WJF.ui.alert.warn(err);
                            return false;
                        }
                        // 批量付款总价
                        this.batchPayPrice = null;
                        this.selection.forEach((item) => {
                            this.batchPayPrice += +item.fee;
                        });
                        this.batchPayInfoVisible = true;
                    }
                },
                // 提交付款
                payInfoSubmit: function () {
                    let reqData, msg;
                    if (this.payInfoVisible == true) {
                        reqData = [];
                        reqData.push(this.payInfo.id);
                        msg = '付款成功！';
                    } else {
                        reqData = this.ids;
                        msg = '批量付款成功！';
                    }
                    this.get('/API/common/public/trademark/default.asp?k=trademark/pay', {id: reqData}, (data) => {
                        WJF.ui.alert.successTip(msg);
                        if (this.payInfoVisible == true) {
                            this.payInfoVisible = false;
                        } else {
                            this.batchPayInfoVisible = false;
                        }
                        this.preparePage();
                    }, function (data) {
                        WJF.ui.alert.alert(data.msg, '温馨提示', {
                            dangerouslyUseHTMLString: true
                        });
                    });
                },
                // 删除
                batchDel: function (id) {
                    let reqData, msg, confirmTxt;
                    if (id) {
                        reqData = id;
                        msg = '删除成功！';
                        confirmTxt = '确认删除该商标吗？';
                    } else {
                        reqData = this.ids;
                        msg = '批量删除成功！';
                        confirmTxt = '确认批量删除商标吗？';
                    }
                    WJF.ui.alert.confirm(confirmTxt, (flag) => {
                        if (flag) {
                            this.post('/API/common/public/trademark/default.asp?k=trademark/cancel', {id: reqData}, (data) => {
                                WJF.ui.alert.successTip(msg);
                                this.preparePage();
                            });
                        }
                    });
                },
                preparePage: function () {
                    this.ORDER_STATUS_LIST = window.ORDER_STATUS;
                    console.log(this.ORDER_STATUS_LIST);
                    this.TM_STATE_LIST = window.TM_STATE;
                    this.PAY_STATE_LIST = window.PAY_STATE;

                    for (let item in this.TM_STATE_LIST) {
                        this.TM_STATUS_MAPPING[this.TM_STATE_LIST[item].value] = this.TM_STATE_LIST[item].name;
                    }
                    for (let item in this.PAY_STATE_LIST) {
                        this.PAY_STATUS_MAPPING[this.PAY_STATE_LIST[item].value] = this.PAY_STATE_LIST[item].name;
                    }
                    for (let item in this.ORDER_STATUS_LIST) {
                        this.ORDER_STATUS_MAPPING[this.ORDER_STATUS_LIST[item].value] = this.ORDER_STATUS_LIST[item].name;
                    }

                    this.ORDER_TYPE_LIST = [{
                        value: 0,
                        name: '自助注册'
                    }, {
                        value: 1,
                        name: '顾问注册'
                    }, {
                        value: 2,
                        name: '担保注册'
                    }];
                    this.ORDER_TYPE_LIST.forEach((item) => {
                        this.ORDER_TYPE_MAPPING[item.value] = item.name;
                    });
                    this.trademarkDataSearch();
                }
            },
            computed: {
                // 中间状态
                'indeterminate': function () {
                    return this.selection.length > 0 && (this.selection.length < this.trademarkTableData.length);
                },
                'isChecked': {
                    set: function (isChecked) {
                        this.toggleAllSelection(isChecked);
                    },
                    get: function () {
                        return this.selection.length > 0 && (this.selection.length == this.trademarkTableData.length);
                    }
                },
                'disabled': function () {
                    return this.selection.length == 0 ? true : false;
                },
                // 是否启用底部 全选框
                'isEnableSelectAll': function () {
                    return this.trademarkTableData.length > 0 ? false : true;
                }
            }
        });
    });
});

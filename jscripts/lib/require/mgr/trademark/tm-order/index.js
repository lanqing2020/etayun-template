require(['WJF3.0'], (WJF) => {
    // 本页JS
    WJF.platform.adaptASP();
    WJF.util.createInstance({
        el: '#J_baseWrapper',       
        data: {
            topMenuIndex: 'tmOrder',

            // 选项卡
            tabActiveName: '0',

            totalCount: 0,
            page: 1,
            pageSize: 10,

            ORDER_STATUS_LIST: {}, // 订单状态列表
            TM_STATE_LIST: {}, // 商标状态列表
            PAY_STATE_LIST: {},  //支付状态
            ORDER_TYPE_LIST: [],  //订单类型

            ORDER_STATUS_MAPPING: {}, //订单状态
            TM_STATUS_MAPPING: {},  //商标状态
            PAY_STATUS_MAPPING: {},  //付款状态
            ORDER_TYPE_MAPPING: {}, //订单类型

            // 查询表单
            tmOrderForm: {
                //proposer: '',   //申请人搜索
                uname: '',  //用户名
                keyword: '',
                ordertype: 0,
                tm_state: '',
                order_state: '',
                paid: 2,
                start: '',
                end: '',
                isagent: 0,  //1只看代理, 2只看普通用户, 传0就是全部
            },
            notAuditNotPaidChecked: false,   //只看不需审核且未付款

            // 表格数据
            tmOrderTableData: [],
            // 当前选中的行的ID
            ids: [],
            selection: [],

            // 设置订单状态
            setOrderStatusFormVisible: false,
            setOrderStatusFormLabelWidth: '120px',
            setOrderStatusForm: {
                status_current: null,
                status: null,
                id: null,
                reason: ''  //失败原因
            },
            batchSetOrderStatusShow: false,

            // 设置商标状态
            setTMStatusFormVisible: false,
            setTMStatusFormLabelWidth: '120px',
            setTMStatusForm: {
                tmstatus_current: null,
                status: null,
                id: null
            },
            batchSetTMStatusShow: false,

            // 补全资料
            complementInfoFormVisible: false,
            complementInfoFormLabelWidth: '120px',
            complementInfoForm: {
                id: '',
                tmno: '',  //商标申请号
                acctime: null,  //受理日期
                firstannoid: null,  //初审公告日期
                firstannotime: null,  //初审公告号
                regannoid: null,  //注册公告日期
                regtime: null,  //注册日期
                pribegin: null,  //专有权开始
                priend: null,  //专有权结束
                // reason: '',  //退回原因
                cert: '',  //商标证书

                cert_view: '',  //
            },
            // 设置备注
            setRemarksFormVisible: false,
            setRemarksForm: {
                id: null,
                remark_color: 'gray',
                remark: ''  //备注
            },
            RemarkLogTable: [],
            page2: 1,
            pageSize2: 10,
            totalCount2: 0,

            // 设置用户编辑状态
            setEditStatusFormVisible: false,
            setEditStatusFormLabelWidth: '120px',
            setEditStatusForm: {
                id: null,
                modifyNew: null,  //新的状态
            },

            //批量修改商标描述
            setTMInfoFormVisible: false,
            setTMInfoFormLabelWidth: '120px',
            setTMInfoForm: {
                id: [],
                tmdesc: '',  //商标描述
                proposer_address: '',  //申请人地址
            },

            // 批量订单类型修改
            orderTypeChangeVisible: false,

            // 退款
            setRefundFormVisible: false,
            setRefundForm: {
                id: '',
                price: '',
                remark: ''
            },

            //=========服务费补拍
            reshot_totalCount: 0,
            reshot_page: 1,
            reshot_pageSize: 10,

            reshotForm: {},
            reshotList: [],

            //设置状态和备注
            setStatusRemarkFormVisible: false,
            setStatusRemarkForm: {
                id: '',
                remark: '',
                status: '',
                isrefund: null
            },
            eventListTableData: [
                {
                    id: '',  //ID
                    ename: '',
                    expiretime: ''
                }
            ]
        },
        mounted: function () {
            this.preparePage();
        },
        methods: {

            // 初始化
            tmOrderDataLoad: function () {
                this.loading = true;
                let params;
                if (this.notAuditNotPaidChecked != true) {   //为true表示不显示未付款订单
                    this.tmOrderForm.paid = 2;   //已付款为2
                    params = Object.assign({
                        page: this.page,
                        pageSize: this.pageSize
                    }, this.tmOrderForm);
                } else {
                    this.tmOrderForm.paid = 1;   // 未付款为1
                    params = Object.assign({
                        page: this.page,
                        pageSize: this.pageSize,
                        show: 1,
                    }, this.tmOrderForm);
                }
                this.post('/API/common/public/trademark/default.asp?k=trademark/list', params, (data) => {
                    this.tmOrderTableData = data.data.data;
                    this.totalCount = data.data.totalCount;
                    this.loading = false;
                });
               

            },
            // tab切换
            handleClick(tab, event) {
                console.log(tab.name, event);
                switch (tab.name) {
                    case '0':
                    case '1':
                    case '2':
                        this.tmOrderForm.ordertype = tab.name;
                        this.page = 1;
                        this.tmOrderDataLoad();
                        break;
                    case '3':
                        this.getReshotList();
                        break;
                }
            },
            handleCurrentChange: function (val) {
                this.page = val;
                this.tmOrderDataLoad();
            },
            /**
             * 选中变更
             * @param selection 当前所有被选中的行数据
             */
            handleSelectionChange: function (selection) {
                this.selection = selection;
                let ids = this.selection.map(item => item.id);
                this.ids = ids;
            },
            /**
             * 表格自带全选事件回调
             * @param selection
             */
            handleSelectAll: function (selection) {
                this.selection = selection;
            },
            // 自定义的全选/反向函数
            toggleAllSelection: function () {
                this.$refs.tmOrderTable.toggleAllSelection();
            },
            /**
             * 批量/设置订单状态
             */
            setOrderStatus: function (row) {
                this.setOrderStatusFormVisible = true;
                if (row) {
                    this.setOrderStatusForm.id = row.id;
                    this.setOrderStatusForm.status_current = row.state;
                    this.setOrderStatusForm.status = null;

                    this.batchSetOrderStatusShow = false;
                } else {
                    this.batchSetOrderStatusShow = true;  //为true为批量操作
                }
                this.setOrderStatusForm.reason = '';
            },
            setOrderStatusFormSubmit: function () {
                let reqId = [], msg = '';
                if (this.batchSetOrderStatusShow == true) {   //为true为批量操作
                    reqId = this.ids;
                    msg = "批量设置订单状态成功！";
                } else {
                    reqId.push(this.setOrderStatusForm.id);
                    msg = "设置订单状态成功！";
                }
                if (this.setOrderStatusForm.status == null) {
                    WJF.ui.alert.warnTip('请选择订单状态！');
                    return false;
                }
                this.post('/paasback/trademark/tm-order/modstatus', {
                    status: this.setOrderStatusForm.status,
                    id: reqId,
                    reason: this.setOrderStatusForm.reason,
                }, (data) => {
                    WJF.ui.alert.successTip(msg);
                    this.setOrderStatusFormVisible = false;
                    this.tmOrderDataLoad();
                });
            },
            /**
             * 批量/设置商标状态
             */
            setTMStatus: function (row) {
                this.setTMStatusFormVisible = true;
                if (row) {
                    this.setTMStatusForm.id = row.id;
                    this.setTMStatusForm.tmstatus_current = row.tmstate;
                    this.setTMStatusForm.status = null;

                    this.batchSetTMStatusShow = false;
                } else {
                    this.batchSetTMStatusShow = true;
                }
            },
            setTMStatusFormSubmit: function () {
                let reqId = [], msg = '';
                if (this.batchSetTMStatusShow == true) {   //为true为批量操作
                    reqId = this.ids;
                    msg = "批量设置商标状态成功！";
                } else {
                    reqId.push(this.setTMStatusForm.id);
                    msg = "设置商标状态成功！";
                }
                if (this.setTMStatusForm.status == null) {
                    WJF.ui.alert.warnTip('请选择商标状态！');
                    return false
                }
                this.post('/paasback/trademark/tm-order/modtmstatus', {
                    status: this.setTMStatusForm.status,
                    id: reqId,
                }, (data) => {
                    WJF.ui.alert.successTip(msg);
                    this.setTMStatusFormVisible = false;
                    this.tmOrderDataLoad();
                });
            },
            // 订单类型变更
            orderTypeChange: function (row) {
                var reqId = [], msg, confirmTxt;
                if (row) {
                    // 单个修改
                    reqId.push(row.id);
                    msg = '订单类型变更成功！';
                    confirmTxt = '您确认变更该笔订单的类型吗？';
                } else {
                    // 批量修改
                    reqId = this.ids;
                    msg = '批量修改订单类型成功！';
                    confirmTxt = '您确认批量修改这些订单的类型吗？';
                }
                WJF.ui.alert.confirm(confirmTxt, (flag) => {
                    flag && this.post('/paasback/trademark/tm-order/transform-type', {
                        id: reqId,
                    }, (data) => {
                        WJF.ui.alert.successTip(msg);
                        this.orderTypeChangeVisible = false;
                        this.tmOrderDataLoad();
                    });
                });
            },
            /**
             * 设置编辑状态
             */
            setEditStatus: function (row) {
                this.setEditStatusFormVisible = true;
                this.setEditStatusForm.id = row.id;
                this.setEditStatusForm.modify = row.modify;

            },
            setEditStatusFormSubmit: function (row) {
                this.post('/paasback/trademark/tm-order/setmodify', {
                    id: this.setEditStatusForm.id,
                }, (data) => {
                    WJF.ui.alert.successTip('设置编辑状态成功！');
                    this.setEditStatusFormVisible = false;
                    this.setEditStatusForm.modify = data.data.modify;
                    this.tmOrderDataLoad();
                });
            },
            /**
             * 补全资料
             * @param row
             */
            complementInfo: function (row) {
                this.complementInfoFormVisible = true;
                Object.assign(this.complementInfoForm, row);
                require(['webuploader'], (WebUploader) => {
                    this.proxyFileUploader = this.proxyFileUploader || WJF.communication.initUploader({
                        // 文件接收服务端。
                        server: (window.PAGE_CONFIG.DEV ? '/paasdev' : '/paas') + '/trademark/file/upload',
                        // 内部根据当前运行是创建，可能是input元素，也可能是flash.
                        pick: '#J_trademark_zs',//
                        onBeforeUpload: () => {
                            this.complementInfoForm.cert = '';
                        },
                        success: (response) => {
                            this.complementInfoForm.cert = response.data;
                        },
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest'
                        }
                    }, WebUploader);

                    this.proxyFileUploader.reset();

                    this.complementInfoForm.cert = row.cert || '';
                    this.proxyFileUploader.setImg(row.cert);
                });
            },
            complementInfoFormSubmit: function () {
                if (this.complementInfoForm.tmno == '' && this.complementInfoForm.acctime == null && this.complementInfoForm.firstannoid == null && this.complementInfoForm.firstannotime == null && this.complementInfoForm.regannoid == null && this.complementInfoForm.regtime == null && this.complementInfoForm.pribegin == null && this.complementInfoForm.priend == null && this.complementInfoForm.cert == '') {
                    WJF.ui.alert.warnTip('请至少填写一项！');
                    return;
                }
                let reqData = {
                    id: this.complementInfoForm.id,
                    tmno: this.complementInfoForm.tmno,  //商标申请号
                    acctime: this.complementInfoForm.acctime,  //受理日期
                    firstannoid: this.complementInfoForm.firstannoid,  //初审公告日期
                    firstannotime: this.complementInfoForm.firstannotime,  //初审公告号
                    regannoid: this.complementInfoForm.regannoid,  //注册公告日期
                    regtime: this.complementInfoForm.regtime,  //注册日期
                    pribegin: this.complementInfoForm.pribegin,  //专有权开始
                    priend: this.complementInfoForm.priend,  //专有权结束
                    // reason: this.complementInfoForm.// reason,  //退回原因
                    cert: this.complementInfoForm.cert,  //商标证书
                };
                this.post('/paasback/trademark/tm-order/complete-data', reqData, (data) => {
                    WJF.ui.alert.successTip('补全资料成功！');
                    this.complementInfoFormVisible = false;
                    this.tmOrderDataLoad();
                });
            },
            // 设置备注
            setRemarks: function (row) {
                this.setRemarksFormVisible = true;
                this.setRemarksForm.id = row.id;
                this.setRemarksForm.remark = '';
                this.setRemarksForm.remark_color = row.remark_color;
                this.get('/paasback/trademark/tm-order/getremark', {
                    id: this.setRemarksForm.id,
                    page: this.page2
                }, (data) => {
                    this.RemarkLogTable = data.data.data;
                    this.totalCount2 = data.data.totalCount;
                });
            },
            handleCurrentChange2: function (val) {
                this.page2 = val;
                this.setRemarks();
            },
            setRemarksFormSubmit: function () {
                this.post('/paasback/trademark/tm-order/remark', {
                    id: this.setRemarksForm.id,
                    remark: this.setRemarksForm.remark,
                    remark_color: this.setRemarksForm.remark_color,
                }, (data) => {
                    WJF.ui.alert.successTip('添加备注成功！');
                    this.setRemarksFormVisible = false;
                    this.tmOrderDataLoad();
                });
            },
            // 退款
            setRefund: function (row) {
                this.setRefundFormVisible = true;
                this.setRefundForm.id = row.id;
                this.setRefundForm.price = row.fee;
                this.setRefundForm.remark = '';
            },
            setRefundFormSubmit: function () {
                this.post('/API/common/public/trademark/default.asp?k=trademark/refund', {
                    id: this.setRefundForm.id,
                    remark: this.setRefundForm.remark
                }, (data) => {
                    WJF.ui.alert.successTip('退款成功！');
                    this.setRefundFormVisible = false;
                });
            },
            //批量修改商标描述
            setTMInfo: function () {
                this.setTMInfoFormVisible = true;
                this.setTMInfoForm.tmdesc = '';
                this.setTMInfoForm.proposer_address = '';
            },
            setTMInfoFormSubmit: function () {
                if (this.setTMInfoForm.tmdesc == '' && this.setTMInfoForm.proposer_address == '') {
                    WJF.ui.alert.warnTip('您好，商标说明、申请人地址至少要填写一个！');
                    return false
                }
                this.setTMInfoForm.id = this.ids;
                this.post('/paasback/trademark/tm-order/modify-info', this.setTMInfoForm, (data) => {
                    WJF.ui.alert.successTip('批量修改成功！');
                    this.setTMInfoFormVisible = false;
                    this.tmOrderDataLoad();
                });
            },
            // 复制
            copyName: function (val) {
                WJF.html.copyToClipboard(val);
            },


            //===================服务费补拍
            getReshotList: function (formData) {
                var params = {
                    page: this.reshot_page,
                    pageSize: this.reshot_pageSize,
                };
                if (formData) {
                    Object.assign(params, formData)
                }
                this.loading = true;
                this.get('/paasback/trademark/tm-order/reshot', params, (data) => {
                    this.reshotList = data.data.data;
                    this.reshot_totalCount = data.data.totalCount;
                    this.loading = false;
                });
            },
            // 查询
            reshotFormSearch: function () {
                this.getReshotList(this.reshotForm);
            },
            reshot_handleCurrentChange: function (val) {
                this.reshot_page = val;
                this.getReshotList();
            },
            // 设置状态和备注
            setStatusRemark: function (row) {
                this.setStatusRemarkFormVisible = true;
                this.setStatusRemarkForm.oldStatue = row.status;
                this.setStatusRemarkForm.remark = row.remark || '';
                this.setStatusRemarkForm.id = row.id;
            },
            setStatusRemarkFormSubmit: function () {
                this.post('/paasback/trademark/tm-order/opreshot', {
                    id: this.setStatusRemarkForm.id,
                    remark: this.setStatusRemarkForm.remark,
                    status: this.setStatusRemarkForm.status,
                }, (data) => {
                    WJF.ui.alert.successTip('设置成功！');
                    this.getReshotList();
                    this.setStatusRemarkFormVisible = false;
                });
            },

            //退款
            setReshotRefund: function (row) {
                WJF.ui.alert.confirm('您好，该笔订单退款费用为<b class="price font16">' + row.fee + '元</b>，确定退款吗？', (flag) => {
                    flag && this.post('/paasback/trademark/tm-order/refundshot', {
                        id: row.id,
                    }, (data) => {
                        WJF.ui.alert.successTip('退款成功！');
                        this.getReshotList();
                    });
                }, {
                    dangerouslyUseHTMLString: true
                });
            },
            //===================服务费补拍 结束
            preparePage: function () {
                this.ORDER_STATUS_LIST = window.ORDER_STATUS;
                this.TM_STATE_LIST = window.TM_STATE;
                this.PAY_STATE_LIST = window.PAY_STATE;

                for (var key in this.ORDER_STATUS_LIST) {
                    var item = this.ORDER_STATUS_LIST[key];
                    this.ORDER_STATUS_MAPPING[item.value] = item.name;
                }
                for (var key in this.TM_STATE_LIST) {
                    var item = this.TM_STATE_LIST[key];
                    this.TM_STATUS_MAPPING[item.value] = item.name;
                }
                for (var key in this.PAY_STATE_LIST) {
                    var item = this.PAY_STATE_LIST[key];
                    this.PAY_STATUS_MAPPING[item.value] = item.name;
                }
                console.log(this.TM_STATUS_MAPPING);
                console.log(this.ORDER_STATUS_MAPPING);

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

                this.tmOrderDataLoad();
            }
        },
        computed: {
            // 中间状态
            'indeterminate': function () {
                return this.selection.length > 0 && (this.selection.length < this.tmOrderTableData.length);
            },
            'isChecked': {
                set: function (isChecked) {
                    this.toggleAllSelection(isChecked);
                },
                get: function () {
                    return this.selection.length > 0 && (this.selection.length == this.tmOrderTableData.length);
                }
            },
            'disabled': function () {
                return this.selection.length == 0 ? true : false;
            },
            // 是否启用底部 全选框
            'isEnableSelectAll': function () {
                return this.tmOrderTableData.length > 0 ? false : true;
            }
        },
        watch: {}
    });
});


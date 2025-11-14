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
                proposerFormData: {
                    name: '',
                    type: '',
                    status: ''
                },
                proposerTableData: [],
                typeDescMapping: {
                    0: '个人',
                    1: '企业'
                },
                statusDescMapping: {
                    0: '审核中',
                    1: '审核通过',
                    2: '审核未通过'
                },
                //修改委托书
                modifyProxyFileFormVisible: false,
                modifyProxyFileForm: {
                    id: null,
                    proxyfile: '',
                    proxyfile_preview: '',
                    proxyfile_preview_button: ''
                },
                // 预览
                isShowPreview: false,
                imgPath: '',
            },
            mounted: function () {
                this.preparePage();
            },
            methods: {
                // 翻页
                handleCurrentChange: function (val) {
                    this.page = val;
                    this.getTMApplicantList();
                },
                // 查询/初始化
                getTMApplicantList: function () {
                    this.loading = true;
                    this.get('/API/common/public/trademark/default.asp?k=proposer/list', Object.assign({}, this.proposerFormData, {
                        page: this.page
                    }), (data) => {
                        this.proposerTableData = data.data.data;
                        this.loading = false;
                    });
                },
                // 修改委托书
                modifyProxyFile: function (row) {
                    this.modifyProxyFileFormVisible = true;
                    require(['webuploader'], (WebUploader) => {
                        this.proxyFileUploader = this.proxyFileUploader || WJF.communication.initUploader({
                            // 文件接收服务端。
                            server: WJF.util.filterUrl('/API/common/public/trademark/default.asp?k=file/upload'),
                            // 内部根据当前运行是创建，可能是input元素，也可能是flash.
                            pick: '#J_trademark_wts',//
                            onBeforeUpload: () => {
                                this.modifyProxyFileForm.proxyfile = '';
                            },
                            success: (response) => {
                                this.modifyProxyFileForm.proxyfile = response.data;
                                this.modifyProxyFileForm.proxyfile_preview_button = '';
                            },
                            headers: {
                                'X-Requested-With': 'XMLHttpRequest'
                            }
                        }, WebUploader);

                        Object.assign(this.modifyProxyFileForm, row);
                        this.proxyFileUploader.reset();

                        this.modifyProxyFileForm.proxyfile_preview = row.proxyfile || '';
                        this.modifyProxyFileForm.proxyfile_preview_button = this.modifyProxyFileForm.proxyfile_preview;
                        this.proxyFileUploader.setImg(row.proxyfile);
                    });
                },
                // 修改委托书--提交
                modifyProxyFileFormSubmit: function () {
                    if (this.modifyProxyFileForm.proxyfile == '') {
                        WJF.ui.alert.warnTip("请上传不含商标名称的代理委托书！");
                        return;
                    }
                    this.post('/API/common/public/trademark/default.asp?k=manage-proposer/addproxyfile', {
                        id: this.modifyProxyFileForm.id,
                        proxyfile: this.modifyProxyFileForm.proxyfile
                    }, (data) => {
                        WJF.ui.alert.successTip("上传成功");
                        this.modifyProxyFileFormVisible = false;
                        this.getTMApplicantList();
                    });
                },
                // 下载
                downloadTmp: function () {
                    this.get('/API/common/public/trademark/default.asp?k=manage-proposer/draw?id=' + this.modifyProxyFileForm.id, {}, (data) => {


                    });
                },
                // 删除
                delApplicant: function (row) {
                    WJF.ui.alert.confirm('确定要删除申请人【' + row.applicant + '】吗？', (flag) => {
                        flag && this.get('/API/common/public/trademark/default.asp?k=proposer/del', {
                            id: row.id
                        }, (data) => {
                            if (data.code == 200) {
                                WJF.ui.alert.successTip('删除成功');
                                this.getTMApplicantList();
                            } else {
                                WJF.ui.alert.warnTip(data.error);
                            }
                        });
                    });
                },
                previewImg: function (e) {
                    this.imgPath = e.currentTarget.getAttribute('preview-src');
                    this.isShowPreview = true;
                },
                preparePage: function () {
                    this.getTMApplicantList();
                }
            },
            watch: {

            }
        });
    });
});
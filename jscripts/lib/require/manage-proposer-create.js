$(function () {

    // 本页JS
    require(['WJF3.0', 'applicant-info'], (WJF) => {
        WJF.platform.adaptASP();
        window._currentPageInstance = WJF.util.createInstance({
            el: '#J_baseContainer',
            data: {
                // 规则
                formData: {
                    applicant: "",
                    type: 0, //   申请人类型  个人-0/企业-1
                    idtype: 0,//  证件类型0-身份证/1-营业执照/2-护照
                    idnumber: '', // 证件号码
                    idcard_no: '', // 个体工商户才有
                    address: '',
                    item_name: '', // 模板名称

                    contact: "",
                    contactaddress: "",
                    phone: '',
                    email: "",
                    zip: "",
                    proxyfile: '',
                    orgcert: '',
                    idcert: '',
					post_address:'',
                    // otherfile1: ''

                    proxyfile_preview: '',
                    orgcert_preview: '',
                    idcert_preview: '',

                    status: '' // 当前审核状态 0 待审核 1 审核通过， 2 未通过
                },
                // 0 新建，1 编辑 ，2 查看
                mode: 0,

                //============== 预览逻辑
                currentPreviewImg: '',
                previewImgList: [],
                prefixUrl: WJF.util.filterUrl('/API/common/public/trademark/default.asp?k=file1/show&id=')
            },
            mounted: function () {
                this.preparePage();
            },
            methods: {
                handleSelectAll: function () {

                },
                getApplicantInfo: function () {
                    this.get('/API/common/public/trademark/default.asp?k=proposer/detail', {
                        id: WJF.util.getUrlParams('id')
                    }, ({ data }) => {
                        console.log(data);
                        Object.assign(this.formData, data);
                        // proxyfile: '',
                        // orgcert: '',
                        // idcert: ''

                        this.formData.proxyfile_preview = data.proxyfile_view && "/API/common/public/trademark/default.asp?k=file1/show&"+data.proxyfile_view.split('?')[1] || '';
                        this.formData.orgcert_preview = data.orgcert_view && "/API/common/public/trademark/default.asp?k=file1/show&"+ data.orgcert_view.split('?')[1] || '';
                        this.formData.idcert_preview = data.idcert_view && "/API/common/public/trademark/default.asp?k=file1/show&"+data.idcert_view.split('?')[1] || '';


                        // data.proxyfile && (this.previewImgList.push(this.prefixUrl + data.proxyfile)) && (document.getElementById('J_proxyfile_preview').src = this.formData.proxyfile_preview);
                        data.orgcert && (this.previewImgList.push(this.prefixUrl + data.orgcert)) && (document.getElementById('J_orgcert_preview').src = this.formData.orgcert_preview);
                        data.idcert && (this.previewImgList.push(this.prefixUrl + data.idcert)) && (document.getElementById('J_idcert_preview').src = this.formData.idcert_preview);

                        if (this.mode != '2') { // 非预览模式 初始化文件上传数据

                            if (data.idcert) {
                                this.sfzUploader.setImg(this.prefixUrl + data.idcert);
                            }

                            if (data.orgcert) {
                                this.yyzzUploader.setImg(this.prefixUrl + data.orgcert);
                            }


                        }

                    });
                },
                // src 为完整路径
                handlePicClick: function (target) {

                    if (this.mode == '2') { // 预览模式
                        this.currentPreviewImg = decodeURIComponent(target.getAttribute('src'));
                    } else {
                        // 新增或者编辑模式 执行单张预览
                        this.currentPreviewImg = target;
                        this.previewImgList = [target];
                    }

                    this.$nextTick(() => {
                        this.$refs['imgPreviewTarget'].clickHandler();
                    });
                },
                autoFillData: function () {
                    this.$refs['application_info'].autoFillData();
                },
                submitForm: function () {
                    var params = Object.assign({}, this.formData);
                    this.$refs['application_info'].$refs['baseForm'].validate((valid, b, c) => {
                        if (valid) {
                            var url = '/API/common/public/trademark/default.asp?k=proposer/create';
                            if (this.mode == '1') {// 修改模式
                                url = '/API/common/public/trademark/default.asp?k=proposer/modify';
                                params.id = this.id;
                            }
                            WJF.serviceManager.post(url, params, (data) => {
                                WJF.ui.alert.success(this.mode == '1' ? '修改成功' : '创建成功', () => {
                                    window.location.href = WJF.util.filterUrl('/manager/trademark/manage-proposer.asp');
                                });
                            }, function (data) {
                                let msg = data.msg;                           

                                WJF.ui.alert.alert(msg, '温馨提示', {
                                    dangerouslyUseHTMLString: true
                                });
                            });
                        } else {
                            console.log('error submit!!');
                            return false;
                        }
                    });
                },
                resetForm: function () {
                    this.$refs['application_info'].$refs['baseForm'].resetFields();
                },
                preparePage: function () {

                    var mode = WJF.util.getUrlParams('mode');

                    if (mode == '1') { // 修改模式
                        this.id = WJF.util.getUrlParams('id');
                    }
                    if (mode != null) {
                        this.mode = mode;
                    }

                    require(['webuploader'], (WebUploader) => {
                        if (this.mode != '2') {
                            this.get('/API/common/public/trademark/default.asp?k=gettoken', {}, (data) => {
                                if (data.code != 200) {
                                    WJF.ui.alert.warn("接口出错");
                                    return false;
                                }
                                var filetoken = data.data;
                                this.sfzUploader = WJF.communication.initUploader({
                                    // 文件接收服务端。
                                    server: WJF.util.filterUrl('https://www.west.cn/paas/trademark/agent/file/upload'),
                                    // 内部根据当前运行是创建，可能是input元素，也可能是flash.
                                    pick: '#J_trademark_sfz',
                                    formData: {token:filetoken},
                                    onBeforeUpload: () => {
                                        if (this.mode == '2') {
                                            return false;
                                        }
                                        this.formData.idcert = '';
                                    },
                                    success: (response) => {
                                        this.formData.idcert = response.data;
                                    },
                                    headers: {
                                        'X-Requested-With': 'XMLHttpRequest'
                                    },
                                    isEnablePreview: true
                                }, WebUploader);
                                this.yyzzUploader = WJF.communication.initUploader({
                                    // 文件接收服务端。
                                    server: WJF.util.filterUrl('https://www.west.cn/paas/trademark/agent/file/upload'),
                                    // 内部根据当前运行是创建，可能是input元素，也可能是flash.
                                    pick: '#J_trademark_yyzz',
                                    formData: {token:filetoken},
                                    onBeforeUpload: () => {
                                        if (this.mode == '2') {
                                            return false;
                                        }
                                        this.formData.orgcert = '';
                                    },
                                    success: (response) => {
                                        this.formData.orgcert = response.data;
                                    },
                                    headers: {
                                        'X-Requested-With': 'XMLHttpRequest'
                                    },
                                    isEnablePreview: true
                                }, WebUploader);
                                WJF.communication.initUploader({
                                    // 文件接收服务端。
                                    server: WJF.util.filterUrl('https://www.west.cn/paas/trademark/agent/file/upload?type=wts'),
                                    // 内部根据当前运行是创建，可能是input元素，也可能是flash.
                                    pick: '#J_trademark_wts',//
                                    formData: {token:filetoken},
                                    onBeforeUpload: () => {
                                        if (this.mode == '2') {
                                            return false;
                                        }
                                        this.formData.proxyfile = '';
                                    },
                                    success: (response) => {
                                        this.formData.proxyfile = response.data;
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
                            });

                            // 用于实现 文件点击按钮重新上传  ===== 后续不再使用基于jQuery的上传插件
                            $('#MainContentDIV').on('click', '.re-choose-upload', (event) => {
                                var type = $(event.target).attr('data-type');
                                this.reChooseFile(type);
                            });

                            $('#MainContentDIV').on('click', '.img-wrapper img', (event) => {
                                var src = event.target.src;
                                if (src) {
                                    this.handlePicClick(src);
                                }
                            });
                        }

                        if (this.mode != '0') {
                            this.getApplicantInfo();
                        }
                    });

                },
                reChooseFile: function (type) {
                    var uploader;
                    switch (type) {
                        case 'sfz':
                            uploader = this.sfzUploader;
                            break;
                        case 'yyzz':
                            uploader = this.yyzzUploader;
                            break;
                    }
                    uploader.triggerUploader();
                },
            },
            watch: {
                'formData.type': function (newType) {
                    this.formData.idtype = newType == 0 ? 0 : 1;
                }
            },
            computed: {}
        });
    });
});

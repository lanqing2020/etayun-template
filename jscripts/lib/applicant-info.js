define(['vue'], function (Vue) {
    Vue.component('applicant-info', {
        name: 'applicant-info',
        template: document.getElementById('J_applicant_info_tpl').innerHTML,
        props: {
            'formData': {
                type: Object
            },
            'mode': {
                type: [Number, String]
            },
            isEnablePreview: {
                type: Boolean,
                default: false
            }
        },
        data: function () {
            return {
                isShowPreview: false,
                imgPath: ''
            };
        },
        methods: {
            submitForm: function () {
                this.$emit('submit-form', this.formData);
            },
            resetForm: function () {
                this.$emit('reset-form', this.formData);
            },
            previewImg: function (e) {
                this.showImgPreviewDialog(e.currentTarget.getAttribute('preview-src'));
            },
            showImgPreviewDialog: function (src) {
                this.imgPath = src;
                this.isShowPreview = true;
            },
            handleUploadPicClick: function (e) {
                this.$emit('click-upload-pic', e.target);
            },
            tmTipCls: function (status) {
                if (status == '0') {
                    return 'wait-auth';
                }

                if (status == '1') {
                    return 'auth-success';
                }

                if (status == '2') {
                    return 'auth-fail';
                }
            },
            autoFillData: function () {
                this.get('/API/common/public/trademark/default.asp?k=manage-proposer/fill', {}, ({data}) => {
                    console.log(data);
                    this.formData.contact = data.applicant;
                    if (this.formData.type != '0') {
                        this.formData.contactaddress = '';
                    } else {
                        this.formData.contactaddress = data.address;
                    }
                    this.formData.phone = data.phone;
                    this.formData.email = data.email;
                    this.formData.zip = data.zip;
                    this.formData.idcard_no = data.idcard_no;
                    this.formData.item_name = data.item_name || '';
                });
            },
        },
        computed: {
            rules: function () {
                var idcert_validator = (rule, value, callback) => {
                    if (this.formData.type == '0') { // 个人
                        if (!WJF.util.trim(value)) {
                            callback('请上传身份证照片');
                        } else {
                            callback();
                        }
                    } else {
                        callback();
                    }
                };
                // var orgcert_validator = (rule, value, callback) => {
                //     if (this.formData.type == '1') { // 企业
                //         if (!WJF.util.trim(value)) {
                //             callback('请上传主体证明文件');
                //         } else {
                //             callback();
                //         }
                //     } else {
                //         callback();
                //     }
                // };

                return {
                    applicant: [
                        {required: true, message: '请输入申请人姓名', trigger: ['blur', 'change']},
                    ],
                    item_name: [
                        {required: true, message: '请输入模板名称', trigger: ['blur', 'change']},
                    ],
                    idnumber: [
                        {required: true, message: '请输入统一信用代码', trigger: ['blur', 'change']}
                    ],
                    idcard_no: [
                        {required: true, message: '请输入身份证号码', trigger: ['blur', 'change']}
                    ],
                    // address: [
                    //     {required: true, message: '请输入证件地址', trigger: ['blur', 'change']}
                    // ],
                    idcert: [
                        {required: true, validator: idcert_validator, trigger: 'change'}
                    ],
                    orgcert: [
                        {required: true, message: '请上传主体证明文件', trigger: 'change'}
                    ],
                    contact: [{required: true, message: '请输入联系人姓名', trigger: ['blur', 'change']}],
                    phone: [{required: true, message: '请输入联系人电话', trigger: ['blur', 'change']}],
                    email: [{required: true, message: '请输入联系人邮箱', trigger: ['blur', 'change']}],
                    contactaddress: [{required: true, message: '请输入联系人地址', trigger: ['blur', 'change']}],
					post_address: [{required: true, message: '请输入邮寄商标地址', trigger: ['blur', 'change']}],
                    zip: [{required: true, message: '请输入联系人邮编', trigger: ['blur', 'change']}],
                };
            },
            isReadonly: function () {
                return this.mode == '2' ? true : false;
            }
        }
    });
});

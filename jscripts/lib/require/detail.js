require(['WJF3.0'], (WJF) => {
    WJF.platform.adaptASP();
    // 用于hack，增加默认参数
    /*WJF.communication._baseParams = {
        encodeConfig: {
            UTF8: false
        }
    };*/
    window.pageInstance = new Vue({
        el: '#J_containerContent',
        data: {
            id: '',
            detailData: {
                status: null,  // 商标状态：0-待审中,1-已驳回,2-已初审,3-已注册,4-已销亡
                tmtype: '', // 商标类型：P-普通商标,J-集体商标,Z-证明商标,T-特殊商标
                user: {}
            }
        },
        mounted: function () {
            this.initDataLoad();
        },
        methods: {
            detailDataLoad: function () {
                this.id = WJF.util.getUrlParams('id');
                WJF.serviceManager.get('/API/common/public/trademark/default.asp?k=search/detail/&id=' + this.id, {}, (data) => {
                    // cls: "第28类 健身器材"
                    // clsid: "28"
                    // ctime: "2019-09-11 23:41:09"
                    // firstanno: "1555"
                    // firstannotm: "2017-06-13 00:00:00"
                    // from: "11"
                    // id: "39114354"
                    // privbegin: "2017-09-14 00:00:00"
                    // privend: "2027-09-13 00:00:00"
                    // reganno: "1567"
                    // regannotm: "2017-09-13 00:00:00"
                    // regtime: "2016-07-20 00:00:00"
                    var detailData = Object.assign({}, data.data);

                    // 过滤掉时间格式
                    var keys = ['ctime', 'firstannotm', 'privbegin', 'privend', 'regannotm', 'regtime'];
                    var annosKeys = ['annotime'];

                    keys.forEach((item, index) => {
                        detailData[item] = detailData[item] ? detailData[item].split(' ')[0] : '--';
                    });
                    detailData.annos.forEach((annos_item) => {
                        annosKeys.forEach((item, index) => {
                            annos_item[item] = annos_item[item] ? annos_item[item].split(' ')[0] : '--';
                        });
                    });

                    this.detailData = detailData;
                });
            },
            initDataLoad: function () {
                this.detailDataLoad();
            }
        },
        computed: {},
        watch: {}
    });
});
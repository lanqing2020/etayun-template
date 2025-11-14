$(function () {
    // 本页JS
    require(['WJF3.0'], (WJF) => {
        WJF.platform.adaptASP();
        window._currentPageInstance = WJF.util.createInstance({
            el: '#J_detailContainer',
            data: {
                // 分页
                page: 1,
                totalCount: 0,
                pageSize: 5,

                // 商标数据
                detailCategory: {},  //商标分类信息
                detailInfo: {},  //商标信息
                detailProposer: {},  //申请人信息
                // 商标类别
                detailTableData: [],
                logTableData: [],  //日志
                detailLogShow: false,
                detailId: '',
                govpaper: [],
                detailProposerShow: true
            },
            mounted: function () {
                this.preparePage();
            },
            methods: {
                // 初始化
                DetailDataLoad: function () {
                    let id = WJF.util.getUrlParams('id');
                    this.detailId = id;
                    this.loading = true;
                    this.post('/API/common/public/trademark/default.asp?k=trademark/detail', {id: id}, (data) => {
                        this.detailCategory = data.data.category;
                        this.detailInfo = data.data.info;
                        this.detailProposer = data.data.proposer.data;
                        this.govpaper = data.data.govpaper
                        if (JSON.stringify(this.detailProposer) == '{}' || this.detailProposer == undefined) {
                            this.detailProposerShow = false;
                        }

                        this.loading = false;
                        /*var Category = [];
                        Category = data.data.category.children;
                        Category.forEach((item) => {
                            if (item.children && item.children.length > 0) {
                                item.children.forEach((_item) => {
                                    this.detailTableData.push(_item);
                                })
                            }
                        });*/
                        this.detailTableData = data.data.category.children;
                        this.detailTableData.forEach((item, index) => {
                            if (index == 0) {
                                item.maxIndex = item.children.length + 0;
                            } else {
                                item.maxIndex = item.children.length + this.detailTableData[index - 1].maxIndex;
                            }
                        });

                        console.log(this.detailTableData);
                    });
                },
                // 日志加载
                DetailLog: function () {
 
                    let id = WJF.util.getUrlParams('id');
                    this.loading = true;
                    this.get('/API/common/public/trademark/default.asp?k=trademark/log', {
                        id: id,
                        page: this.page
                    }, (data) => {
                        this.logTableData = data.data.data;
                        if (this.logTableData.length != 0) {
                            this.detailLogShow = true;
                        }
                        this.totalCount = data.data.totalCount;
                        this.loading = false;
                    });
                },
                // 翻页
                handleCurrentChange: function (val) {
                    this.page = val;
                    this.DetailLog();
                },
                preparePage: function () {
                    this.DetailDataLoad();
                    this.DetailLog();
                }
            },
            computed: {}
        });
    });
});

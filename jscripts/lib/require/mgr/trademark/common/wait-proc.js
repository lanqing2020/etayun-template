/**
 * 用于定时刷新顶部导航栏中 商标订单待审核的数量
 */
define(function () {
    return {
        created: function () {
            this.getProc();
        },
        data: function () {
            return {
                topMenuIndex: 'proposer',
                order_count: 0,
                order_0_count: 0,//自助
                order_1_count: 0,//顾问
                order_2_count: 0,//担保
                proposer_count: 0, // 待审核的订单以及申请人数量
                reshot: 0,  //服务费补拍
                svclist: 0,  //商标服务订单
            };
        },
        methods: {
            getProc: function () {
                this.get('/paasback/trademark/default/waitproc', {}, (data) => {
                    console.log(data);
                    this.order_count = data.data.order;
                    this.order_0_count = data.data.order0;
                    this.order_1_count = data.data.order1;
                    this.order_2_count = data.data.order2;
                    this.reshot = data.data.reshot;  //服务费补拍
                    this.proposer_count = data.data.proposer;
                    this.svclist = data.data.svclist;

                }, {
                    complete: () => {
                        setTimeout(() => {
                            this.getProc();
                        }, 15000);
                    },
                    showMask: false
                });
            }
        }
    };
});

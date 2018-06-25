var NebPay = require("nebpay");
var nebPay = new NebPay();

function QueryPage () {
  this.dappAddress = "n1jQxEQVoRaFNVDi5jgSnMnCoxfGJY7UvxG";
  this.layerIndex = null;
  var self = this;

  this.init = function () {
    $("#query-btn").on('click', function(res) {
      self.layerIndex = layer.load(0, {shade: true});
      var key = $("#input-key").val().trim();
      if (key) {
        self.getData(key);
      } else {
        layer.msg('请输入钱包地址');
      }
    })
  }

  this.showDom = function (data) {
    var template = $("#card-template");
    var dataArr = ['已创建,等待对方确认', '已确认生效', '已到期', '申请终止合同,等待确认', '已确认终止'];
    $("#record-div").empty();
    if (!data || data.length < 1) {
      $("#no-data").show();
      return false;
    }
    $("#no-data").hide();
    $.each(data, function(index, item){
      if (item.status < 0) {
        item.statusText = '待确认'
      } else {
        item.statusText = dataArr[item.status]
      }
      var dom = template.clone();
      item.startDate = self.getDate(item.start);
      item.endDate = self.getDate(item.end);
      // 取消状态
      if (item.status > 3) {
        dom.find("[dom-type='cancel']").show();
      }
      dom.find("[data-type]").each(function(key, ele){
        var objKey = $(ele).attr('data-type');
        $(ele).text(item[objKey])
      })
      $("#record-div").append(dom);
    })
    $("#record-div").children().show();
  }

  this.getData = function (str) {
    var value = "0";
    var callFunction = "query";
    var callArgs = JSON.stringify([str]);
    nebPay.simulateCall(this.dappAddress, value, callFunction, callArgs, {
      qrcode: {
        showQRCode: false
      },
      listener: function (res) {
        if (res.result) {
          var data = JSON.parse(res.result);
          self.showDom(data);
        } else {
          layer.alert('获取数据失败，请稍后重试', {
            skin: 'layui-layer-molv' //样式类名
            ,closeBtn: 0
          });
        };
        layer.close(self.layerIndex)
      }
    })
  }

  this.getDate = function (str) {
    if (!str) {
      return '';
    }
    var curDate = new Date(str);
    var y = curDate.getFullYear();
    var m = curDate.getMonth() + 1;
    var d = curDate.getDate();
    var mm = m > 9 ? m : '0' + m;
    var dd = d > 9 ? d : '0' + d;
    return y + '-' + mm + '-' + dd;
  }
}

$(function(){
  var queryPageObj = new QueryPage();
  queryPageObj.init();
})
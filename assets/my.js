var NebPay = require("nebpay");
var nebPay = new NebPay();

function MyPage () {
  this.dappAddress = "n1jQxEQVoRaFNVDi5jgSnMnCoxfGJY7UvxG";
  this.layerIndex = null;
  var self = this;

  this.init = function () {
    if (typeof (webExtensionWallet) === "undefined") {
      $("#content-div").hide();
      layer.alert('请首先安装webExtensionWallet插件', {
        skin: 'layui-layer-molv' //样式类名
        ,closeBtn: 0
      });
    } else {
      $("#content-div").show();
      this.initEvent();
      this.getData();
    }
  }

  this.initEvent = function() {
    $(document).on('click', '.confirm-btn', function () {
      var id = $(this).data("id");
      var status = $(this).data('status');
      var to = self.dappAddress;
      var value = "0";
      var callFunction = "confirm";
      if (status == -3) {
        callFunction = "cancelConfirm";
      }
      var callArgs = JSON.stringify([id]);
      nebPay.call(to, value, callFunction, callArgs, {
          listener: self.payHandle
      });
    })

    $(document).on('click', '.over-btn', function () {
      var id = $(this).data("id");
      layer.prompt({title: '请输入终止合同原因', formType: 2}, function(pass, index){
        var value = "0";
        var callFunction = "cancelRequest";
        var callArgs = JSON.stringify([id, pass]);
        nebPay.call(self.dappAddress, value, callFunction, callArgs, {
            listener: self.cancelHandle
        });
        layer.close(index);
      });
      
    })
  }

  this.getData = function () {
    self.layerIndex = layer.load(0, {shade: true});
    var value = "0";
    var callFunction = "query";
    var callArgs = "";
    nebPay.simulateCall(this.dappAddress, value, callFunction, null, {
      qrcode: {
        showQRCode: false
      },
      listener: function (res) {
        if (res.result) {
          var data = JSON.parse(res.result);
          self.showDom(data);
        } else {
          layer.alert('获取数据失败，请刷新页面重试', {
            skin: 'layui-layer-molv' //样式类名
            ,closeBtn: 0
          });
        }
        layer.close(self.layerIndex);
      }
    })
  }

  this.showDom =function (data) {
    var template = $("#card-template");
    var dataArr = ['已创建,等待对方确认', '已确认生效', '已到期', '申请终止合同,等待确认', '已确认终止'];
    $("#record-div").empty();
    if (!data || data.length < 1) {
      $("#no-data").show();
      return false;
    }
    $("#no-data").hide();
    $.each(data, function(index, item){
      var dom = template.clone();
      // 取消状态
      if (item.status > 3) {
        dom.find("[dom-type='cancel']").show();
      }

      // 待我确认
      if (item.status == -1 || item.status == -3) {
        dom.find('.confirm-btn').show().data('status', item.status);
        item.statusText = '待我确认'
      } else {
        item.statusText = dataArr[item.status];
      }

      // 显示终止合同按钮
      if (item.status == 1) {
        dom.find('.over-btn').show().data('status', item.status);
      }
      item.startDate = self.getDate(item.start);
      item.endDate = self.getDate(item.end);
      
      dom.find("[type='button']").data("id", item.id);
      dom.find("[data-type]").each(function(key, ele){
        var objKey = $(ele).attr('data-type');
        $(ele).text(item[objKey])
      })
      $("#record-div").append(dom);
    })
    $("#record-div").children().show();
  };

  this.payHandle = function (res) {
    if (res) {
      layer.alert('合同确认成功;状态变更需要一段时间，请稍后刷新页面查看状态。', {
        skin: 'layui-layer-molv' //样式类名
        ,closeBtn: 0
      }, function(index){
        layer.close(index);
      });
      self.getData();
    } else {
      layer.alert('确认失败', {
        skin: 'layui-layer-molv' //样式类名
        ,closeBtn: 0
      });
    }
  }

  this.cancelHandle = function (res) {
    if (res) {
      layer.alert('申请成功，等待对方确认;状态变更需要一段时间，请稍后刷新页面查看状态。', {
        skin: 'layui-layer-molv' //样式类名
        ,closeBtn: 0
      }, function(index){
        layer.close(index);
      });
      self.getData();
    } else {
      layer.alert('申请失败', {
        skin: 'layui-layer-molv' //样式类名
        ,closeBtn: 0
      });
    }
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
  var myPageObj = new MyPage();
  myPageObj.init()
})
var NebPay = require("nebpay");
var nebPay = new NebPay();

function ConfirmPage () {
  this.dappAddress = "n1jQxEQVoRaFNVDi5jgSnMnCoxfGJY7UvxG";

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
      this.initData()
    }
  }

  this.initEvent = function() {
    var self = this;

    $(document).on('click', '.confirm-btn', function () {
      var id = $(this).data("id");
      var to = self.dappAddress;
      var value = "0";
      var callFunction = "confirm";
      if (id) {
        callFunction = "cancelConfirm";
      }
      var callArgs = JSON.stringify([id]);
      nebPay.call(to, value, callFunction, callArgs, {
          listener: self.payHandle
      });
    })

    $(document).on('click', '.over-btn', function () {
      var id = $(this).data("id");
      layer.prompt({title: '请输入终止合同原因', formType: 1}, function(pass, index){
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

  this.initData = function () {
    // 拉取数据
    var self = this;
    this.getData(function(res){
      console.log('resss', res)
      // execute_err "contract check failed"
      if (!res.result) {
        layer.alert('获取数据失败，请刷新页面重试', {
          skin: 'layui-layer-molv' //样式类名
          ,closeBtn: 0
        });
        return false;
      }
      var data = JSON.parse(res.result);
      self.showDom(data);
    })
  }

  this.getData = function (callback) {
    var value = "0";
    var callFunction = "query";
    var callArgs = "";
    nebPay.simulateCall(this.dappAddress, value, callFunction, null, {
      qrcode: {
        showQRCode: false
      },
      listener: callback
    })
  }

  this.showDom =function (data) {
    var template = $("#card-template");
    var dataArr = ['已创建,等待对方确认', '已确认生效', '已到期', '申请终止合同', '等待确认', '已确认终止'];
    $("#record-div").empty();
    $.each(data, function(index, item){
      var dom = template.clone();
      // 取消状态
      if (item.status > 3) {
        dom.find("[dom-type='cancel']").show();
      }

      // 待我确认
      if (item.status == -1 || item.status == -3) {
        dom.find('.confirm-btn').show().data('status', item.status);
        item.status = '待我确认'
      } else {
        item.status = dataArr[item.status];
      }
      
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
      layer.alert('合同确认成功', {
        skin: 'layui-layer-molv' //样式类名
        ,closeBtn: 0
      });
    } else {
      layer.alert('确认失败', {
        skin: 'layui-layer-molv' //样式类名
        ,closeBtn: 0
      });
    }
  }

  this.cancelHandle = function (res) {
    if (res) {
      layer.alert('申请成功，等待对方确认', {
        skin: 'layui-layer-molv' //样式类名
        ,closeBtn: 0
      });
    } else {
      layer.alert('申请失败', {
        skin: 'layui-layer-molv' //样式类名
        ,closeBtn: 0
      });
    }
  }
}

$(function(){
  var confirmPageObj = new ConfirmPage();
  confirmPageObj.init()
})
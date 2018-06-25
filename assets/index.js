var NebPay = require("nebpay");
var nebPay = new NebPay();

function IndexPage(){
  this.dateArr = [];
  this.dappAddress = "n1jQxEQVoRaFNVDi5jgSnMnCoxfGJY7UvxG"; // 合约地址
  this.role = 1; // 默认租客 0:房东 1:租客

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
    }
  }

  this.initEvent = function () {
    var self = this;
    // 日期选择
    laydate.render({
      elem: '#start-date', //指定元素
      theme: 'molv',
      range: true,
      done: function(value, startDate, endDate){
        if (value) {
          self.dateArr.push(startDate.year + '-' + startDate.month + '-' + startDate.date);
          self.dateArr.push(endDate.year + '-' + endDate.month + '-' + endDate.date);
        } else {
          self.dateArr = [];
        }
      }
    });

    // checkbox
    $("input[type='radio'").on('change', function(ev){
      if ($(this).attr('id') == 'exampleRadios1') {
        self.role = 1;
        $("#tenant-key").hide().find('input').attr('data-require', 'no');
        $("#renter-key").show().find('input').attr('data-require', 'yes');
      } else {
        self.role = 0;
        $("#renter-key").hide().find('input').attr('data-require', 'no');
        $("#tenant-key").show().find('input').attr('data-require', 'yes');
      }
    })

    // 保存按钮
    $("#save-btn").click(function (ev) {
      ev.preventDefault()
      var layerIndex = layer.load(0, {shade: false}); //0代表加载的风格，支持0-2
      var valid = true;
      // role, myName, otherAddr, otherName, houseAddr, deposit, rent, term, start, end
      var params = {
        role: self.role,                        // 角色
        myName: $("#user-name").val(),  // 租客名称
        otherName: $("#hire-name").val(),  // 房东名称
        houseAddr: $("#house-addr").val(),
        deposit: parseInt($("#total-deposit").val()),
        rent: parseInt($("#rent-money").val()),
        term: $("#extra-text").val(),
        start: new Date(self.dateArr[0]).getTime(),
        end: new Date(self.dateArr[1]).getTime(),
      }
      if (self.role == 0) {
        params.otherAddr = $("#public-key-1").val();
      } else {
        params.otherAddr = $("#public-key-2").val();
      }
      $(".invalid-feedback").hide();
      $("input[data-require='yes']").each(function(index, item){
        if (!item.value) {
          valid = false;
          if ($(item).attr("id") == "start-date") {
            $(item).parent().next().show();
          } else {
            $(item).next().show();
          }
        }
      })
      if (!valid) {
        layer.close(layerIndex);
        return false;
      }
      params.extraText = $("#extra-text").val();

      var value = "0";  // 转账数额
      var callFunction = "add" //合约函数
      var paramArr = [params.role, params.myName, params.otherAddr, params.otherName, params.houseAddr, params.deposit, params.rent, params.term, params.start, params.end];
      var callArgs = JSON.stringify(paramArr)
      layer.close(layerIndex);
      nebPay.call(self.dappAddress, value, callFunction, callArgs, {
        qrcode: { 
          showQRCode: false
        },
        listener: self.payHandle
      });
    })
  };

  this.payHandle = function (res) {
    if (typeof(res) == 'object') {
      layer.alert('租房合同创建成功，等待对方确认；对方确认以后正式生效', {
        skin: 'layui-layer-molv' //样式类名
        ,closeBtn: 0
      }, function(index){
        document.getElementById("form-data").reset();
        layer.close(index);
      });
    } else {
      layer.alert('支付失败', {
        skin: 'layui-layer-molv' //样式类名
        ,closeBtn: 0
      });
    }
    console.log('submit res', res)
  }
}


$(function(){
  var page = new IndexPage();
  page.init();
})
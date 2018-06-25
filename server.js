"use strict";

var Contract = function(text) {
    if (text) {
        var obj = JSON.parse(text)
        this.renter = obj.renter //房东名称
        this.tenant = obj.tenant //租客名称
        this.renterAddr = obj.renterAddr //房东地址
        this.tenantAddr = obj.tenantAddr //租客地址
        this.houseAddr = obj.houseAddr //房屋地址
        this.deposit = obj.deposit //合同押金
        this.rent = obj.rent //租金(每月, 单位元)
        this.term = obj.term //合同条款
        this.cancelProposer = obj.cancelProposer //终止合同申请人
        this.cancelReason = obj.cancelReason //终止合同原因
        this.status = obj.status //合同状态 0: 已创建,等待对方确认 1: 已确认生效 2: 已到期 3: 申请终止合同, 等待确认 4:已确认终止
        this.role = obj.role //合同发起人身份 0: 房东 1:租客
        this.start = obj.start //合同起始时间, unix时间戳
        this.end = obj.end //合同结束时间, unix时间戳
        this.id = obj.id //自增
    } else {
        this.renter = ""
        this.tenant = ""
        this.renterAddr = ""
        this.tenantAddr = ""
        this.houseAddr = ""
        this.deposit = 0
        this.rent = 0
        this.term = ""
        this.cancelReason = ""
        this.cancelProposer = ""
        this.status = 0
        this.role = 0
        this.start = 0
        this.end = 0
        this.id = 0
    }
}

Contract.prototype = {
    toString: function() {
        return JSON.stringify(this)
    }
}

var CrontactManager = function() {
    // 租约列表 key:id value : 租约详情
    LocalContractStorage.defineMapProperty(this, "repo", {
        parse: function(text) {
            return new Contract(text)
        },
        stringify: function(o) {
            return o.toString()
        }
    })
    //租约自增id
    LocalContractStorage.defineProperty(this, "MaxContractCnt")
    //key为addr，value对应租约数量
    LocalContractStorage.defineMapProperty(this, "contractNumMap")
    //key为addr:id，value对应租约id
    LocalContractStorage.defineMapProperty(this, "contractMap")

}

CrontactManager.prototype = {
    init: function() {
        this.MaxContractCnt = 0
    },

    add: function(role, myName, otherAddr, otherName, houseAddr, deposit, rent, term, start, end) {
        var myAddr = Blockchain.transaction.from
        // 参数检查
        if (role !== 0 && role !== 1) { //role 0 我是房东 1 我是租客
            throw new Error('wrong role')
        }
        if (myName === "" || otherName === "" || otherAddr === "") {
            throw new Error('wrong addr and name')
        }
        if (myAddr === otherAddr) {
            throw new Error('不能和自己签订合同')
        }
        if (houseAddr.length < 1 || houseAddr.length > 100) {
            throw new Error('wrong housr addr')
        }
        if (!(deposit > 0 && rent > 0)) {
            throw new Error('wrong deposit or rent')
        }
        if (term.length < 1 || term.length > 1000) {
            throw new Error('wrong term')
        }
        if (start > end) {
            throw new Error('开始时间不能小于结束时间')
        }
        if (end < Date.parse(new Date()) / 1000) {
            throw new Error('租约结束时间已过期')
        }

        var contract = new Contract()
        if (role === 0) { //我是房东
            contract.renter = myName
            contract.renterAddr = Blockchain.transaction.from
            contract.tenant = otherName
            contract.tenantAddr = otherAddr
        } else if (role === 1) { //我是租客
            contract.rent = otherName
            contract.renterAddr = otherAddr
            contract.tenant = myName
            contract.tenantAddr = Blockchain.transaction.from
        }
        contract.role = role
        contract.houseAddr = houseAddr
        contract.rent = rent
        contract.deposit = deposit
        contract.term = term
        contract.status = 0
        contract.start = start
        contract.end = end
        contract.id = this.MaxContractCnt
        this.repo.put(this.MaxContractCnt, contract)
        this.MaxContractCnt++

            var myContractNum = this.contractNumMap.get(myAddr)
        if (myContractNum) {
            this.contractNumMap.put(myAddr, myContractNum + 1)
        } else {
            this.contractNumMap.put(myAddr, 1)
            myContractNum = 0
        }
        this.contractMap.put(myAddr + ":" + myContractNum, contract.id)

        var otherContractNum = this.contractNumMap.get(otherAddr)
        if (otherContractNum) {
            this.contractNumMap.put(otherAddr, otherContractNum + 1)
        } else {
            this.contractNumMap.put(otherAddr, 1)
            otherContractNum = 0
        }
        this.contractMap.put(otherAddr + ":" + otherContractNum, contract.id)
        return "success"
    },
    // 查询一个地址的所有合同
    query: function(addr) {
        if (!addr) {
            addr = Blockchain.transaction.from
        }
        var resArr = new Array()
        var contractCnt = this.contractNumMap.get(addr)
        if (contractCnt) {
            for (var i = 0; i < contractCnt; i++) {
                var id = this.contractMap.get(addr + ":" + i);
                var contract = this.repo.get(id);
                // 检查合同是否过期
                if (contract.status === 1 && contract.end < Date.parse(new Date()) / 1000) {
                    contract.status = 2
                    this.repo.put(id, contract)
                }
                resArr.push(JSON.stringify(contract));
            }
        }
        return resArr
    },
    // 确认合同
    confirm: function(id) {
        var myAddr = Blockchain.transaction.from
        var contract = this.repo.get(id)
        if (!contract) {
            throw new Error('合同不存在')
        }
        // 只有对方才能确认合同
        if (contract.role === 0 && contract.status === 0 && contract.tenantAddr === myAddr) {
            contract.status = 1
            this.repo.put(id, contract)
            return "success"
        }
        if (contract.role === 1 && contract.status === 0 && contract.renterAddr === myAddr) {
            contract.status = 1
            this.repo.put(id, contract)
            return "success"
        }
    },
    // 请求终止合同
    cancelRequest: function(id, cancelReason) {
        var myAddr = Blockchain.transaction.from
        var contract = this.repo.get(id)
        if (!contract) {
            throw new Error('合同不存在')
        }
        // 只有房东或者租客才有权利终止合同
        if (!(myAddr === contract.renterAddr || myAddr === contract.tenantAddr)) {
            throw new Error('你无权利修改该合同')
        }
        // 只有已确认有效的合同才能终止
        if (contract.status !== 1) {
            throw new Error('该合同目前无法终止')
        }
        // 合同是否已过期
        if (contract.end < Date.parse(new Date()) / 1000) {
            contract.status = 2
            this.repo.put(id, contract)
            throw new Error('该合同已过期')
        }
        contract.end < Date.parse(new Date()) / 1000
        contract.cancelProposer = myAddr
        contract.cancelReason = cancelReason
        contract.status = 3
        this.repo.put(id, contract)
        return "success"
    },
    //确认终止合同
    cancelConfirm: function(id) {
        var myAddr = Blockchain.transaction.from
        var contract = this.repo.get(id)
        if (!contract) {
            throw new Error('合同不存在')
        }
        // 申请人无权确认合同
        if (myAddr === contract.cancelProposer) {
            throw new Error('你无权利修改该合同')
        }
        // 只有房东或者租客才有权利终止合同
        if (!(myAddr === contract.renterAddr || myAddr === contract.tenantAddr)) {
            throw new Error('你无权利修改该合同')
        }
        // 只有已确认有效的合同才能终止
        if (contract.status !== 3) {
            throw new Error('该合同目前无法终止')
        }
        contract.status = 4
        this.repo.put(id, contract)
        return "success"
    }
};
module.exports = CrontactManager;
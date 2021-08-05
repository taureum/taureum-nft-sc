const {assert} = require("chai")
const {pad} = require("../helper");

const checkTransferSingleEvent = async (transferSingleEvent, operator, from, to, tokenId, value) => {
    if (tokenId.substr(0, 2) === "0x") {
        tokenId = tokenId.substr(2)
    }
    assert.equal(transferSingleEvent.operator, operator, "transferSingleEvent `operator` is invalid")
    assert.equal(transferSingleEvent.from, from, "transferSingleEvent `from` is invalid")
    assert.equal(transferSingleEvent.to, to, "transferSingleEvent `to` is invalid")
    assert.equal(pad(transferSingleEvent.id.toString("hex"), 64), pad(tokenId, 64), "transferSingleEvent `tokenId` is invalid")
    assert.equal(transferSingleEvent.value, value, "transferSingleEvent `value` is invalid")
}

const checkApproveForAllEvent = async (approveForAllEvent, account, operator, approved) => {
    assert.equal(approveForAllEvent.account, account, "approveForAllEvent `account` is invalid")
    assert.equal(approveForAllEvent.operator, operator, "approveForAllEvent `operator` is invalid")
    assert.equal(approveForAllEvent.approved, approved, "approveForAllEvent `approved` is invalid")
}

module.exports = {checkTransferSingleEvent, checkApproveForAllEvent}
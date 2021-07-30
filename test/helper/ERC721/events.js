const {assert} = require("chai")
const {pad} = require("../helper");

const checkTransferEvent = async (transferEvent, tokenId, from, to) => {
    if (tokenId.substr(0, 2) === "0x") {
        tokenId = tokenId.substr(2)
    }
    assert.equal(transferEvent.from, from, "transferEvent `from` is invalid")
    assert.equal(transferEvent.to, to, "transferEvent `to` is invalid")
    assert.equal(pad(transferEvent.tokenId.toString("hex"), 64), pad(tokenId, 64), "transferEvent `tokenId` is invalid")
}

const checkApproveEvent = async (approveEvent, tokenId, owner, approved) => {
    if (tokenId.substr(0, 2) === "0x") {
        tokenId = tokenId.substr(2)
    }
    assert.equal(approveEvent.owner, owner, "approveEvent `owner` is invalid")
    assert.equal(approveEvent.approved, approved, "approveEvent `approved` is invalid")
    assert.equal(pad(approveEvent.tokenId.toString("hex"), 64), pad(tokenId, 64), "approveEvent `tokenId` is invalid")
}

const checkApprovalForAllEvent = async (approvalForAllEvent, owner, operator, approved) => {
    assert.equal(approvalForAllEvent.owner, owner, "approvalForAllEvent `owner` is invalid")
    assert.equal(approvalForAllEvent.operator, operator, "approvalForAllEvent `operator` is invalid")
    assert.equal(approvalForAllEvent.approved, approved, "approvalForAllEvent `approved` is invalid")
}

module.exports = {checkApproveEvent, checkTransferEvent, checkApprovalForAllEvent}
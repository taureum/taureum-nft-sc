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

const checkTransferBatchEvent = async (transferBatchEvent, operator, from, to, tokenIds, values) => {
    for (let i = 0; i < tokenIds.length; i++) {
        tokenIds[i] = tokenIds[i].toString("hex")
        if (tokenIds[i].substr(0, 2) === "0x") {
            tokenIds[i] = tokenIds[i].substr(2)
        }
    }

    assert.equal(transferBatchEvent.operator, operator, "transferBatchEvent `operator` is invalid")
    assert.equal(transferBatchEvent.from, from, "transferBatchEvent `from` is invalid")
    assert.equal(transferBatchEvent.to, to, "transferBatchEvent `to` is invalid")

    let tmpTokenIds = transferBatchEvent.ids
    let tmpValues = transferBatchEvent.values
    assert.equal(tmpTokenIds.length, tmpValues.length, "lengths mismatch")
    for (let i = 0; i < tmpTokenIds.length; i++) {
        assert.equal(pad(tmpTokenIds[i].toString("hex"), 64), pad(tokenIds[i], 64), `transferBatchEvent "tokenIds ${i}" is invalid`)
        assert.equal(tmpValues[i].toNumber(), values[i], `transferBatchEvent "values ${i}" is invalid`)
    }
}

const checkApproveForAllEvent = async (approveForAllEvent, account, operator, approved) => {
    assert.equal(approveForAllEvent.account, account, "approveForAllEvent `account` is invalid")
    assert.equal(approveForAllEvent.operator, operator, "approveForAllEvent `operator` is invalid")
    assert.equal(approveForAllEvent.approved, approved, "approveForAllEvent `approved` is invalid")
}

module.exports = {checkTransferSingleEvent, checkTransferBatchEvent, checkApproveForAllEvent}
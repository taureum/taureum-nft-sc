const {assert} = require('chai')
const {contractName, web3} = require("./helper/ERC1155/load")
const {ERC1155_randomRedeemData, ERC1155_newRedeemData} = require("./helper/ERC1155/lazy-minter")
const {checkTransferSingleEvent, checkApproveForAllEvent} = require("./helper/ERC1155/events")

const {
    ERC1155_NOT_CREATOR_OR_APPROVED,
    ERC1155_ALREADY_REDEEMED,
} = require("./helper/ERC1155/errors")

const {
    shouldNotPass,
    shouldErrorContainMessage,
} = require("./helper/errors")

const {
    ZERO_ADDRESS,
    randomURI, ERC1155_mintToken,
} = require("./helper/helper")

const crypto = require("crypto");

require('chai')
    .use(require('chai-as-promised'))
    .should()

const checkRedeemEvents = async (logs, operator, minter, redeemer, tokenId, amount) => {
    let mintEvent = logs[0].args
    let transferEvent = logs[1].args

    await checkTransferSingleEvent(mintEvent, operator, ZERO_ADDRESS, minter, tokenId, amount)
    await checkTransferSingleEvent(transferEvent, operator, minter, redeemer, tokenId, amount)
}
const redeemShouldSucceed = async (instance, result, parties, amounts, lazyMintData, baseURI) => {
    let amount = lazyMintData.mintData.amount
    let uri = lazyMintData.mintData.tokenURI
    let tokenId = lazyMintData.expectedTokenId

    let operator = parties.operator
    let minter = parties.minter
    let redeemer = parties.redeemer

    let oldSupply = amounts.oldSupply
    let oldMinterBalance = amounts.oldMinterBalance
    let oldRedeemerBalance = amounts.oldRedeemerBalance

    await checkRedeemEvents(result.logs, operator, minter, redeemer, tokenId, amount)

    let tmpBalance = await instance.balanceOf(minter, tokenId)
    assert.equal(tmpBalance.toNumber(), oldMinterBalance, "balance minter not valid")
    tmpBalance = await instance.balanceOf(redeemer, tokenId)
    assert.equal(tmpBalance.toNumber(), oldRedeemerBalance + amount, "balance redeemer not valid")

    let tmpURI = await instance.uri(tokenId)
    assert.equal(tmpURI, `${baseURI}${uri}`, "URI not valid")

    let tmpSupply = await instance.totalSupply(tokenId)
    assert.equal(tmpSupply.toNumber(), oldSupply + amount)

    let tmpCreator = await instance.getCreator(tokenId)
    assert.equal(tmpCreator, minter)
}

contract('ERC1155 with LazyMint', (accounts) => {
    let instance
    let address

    let minter = accounts[0]
    let approved = accounts[1]
    let notApproved = accounts[2]
    let redeemer = accounts[3]
    let anotherRedeemer = accounts[4]

    let baseURI = ""

    before(async () => {
        instance = await contractName.deployed()
        address = await instance.address

        await instance.setApprovalForAll(approved, true)
    })

    describe('redeem', async () => {
        it('should redeem a voucher from a valid signature (sent by owner)', async () => {
            let lazyMintData = await ERC1155_randomRedeemData(address, minter)

            let result = await instance.redeem(redeemer, lazyMintData.mintData, {from: minter})
            await redeemShouldSucceed(instance, result,
                {operator: minter, minter: minter, redeemer: redeemer},
                {oldSupply: 0, oldMinterBalance: 0, oldRedeemerBalance: 0},
                lazyMintData, baseURI)
        })

        it('should redeem a voucher from a valid signature (sent by approved)', async () => {
            await instance.setApprovalForAll(approved, true, {from: minter})

            let lazyMintData = await ERC1155_randomRedeemData(address, minter)

            let result = await instance.redeem(redeemer, lazyMintData.mintData, {from: approved})
            await redeemShouldSucceed(instance, result,
                {operator: approved, minter: minter, redeemer: redeemer},
                {oldSupply: 0, oldMinterBalance: 0, oldRedeemerBalance: 0},
                lazyMintData, baseURI)
        })

        it('should fail to redeem a voucher from a valid signature but sent by notApproved', async () => {
            let lazyMintData = await ERC1155_randomRedeemData(address, minter)

            try {
                await instance.redeem(redeemer, lazyMintData.mintData, {from: notApproved})
                shouldNotPass()
            } catch (error) {
                shouldErrorContainMessage(error, ERC1155_NOT_CREATOR_OR_APPROVED)
            }
        })

        it('should fail to redeem an already-been-redeemed voucher', async () => {
            let lazyMintData = await ERC1155_randomRedeemData(address, minter)

            let result = await instance.redeem(redeemer, lazyMintData.mintData, {from: minter})
            await redeemShouldSucceed(instance, result,
                {operator: minter, minter: minter, redeemer: redeemer},
                {oldSupply: 0, oldMinterBalance: 0, oldRedeemerBalance: 0},
                lazyMintData, baseURI)
            try {
                await instance.redeem(redeemer, lazyMintData.mintData, {from: minter})
                shouldNotPass()
            } catch (error) {
                shouldErrorContainMessage(error, ERC1155_ALREADY_REDEEMED)
            }
        })

        it('should fail to redeem a voucher with a modified URI', async () => {
            let lazyMintData = await ERC1155_randomRedeemData(address, minter)
            lazyMintData.mintData.tokenURI = randomURI()
            try {
                await instance.redeem(redeemer, lazyMintData.mintData, {from: minter})
                shouldNotPass()
            } catch (error) {
                shouldErrorContainMessage(error, ERC1155_NOT_CREATOR_OR_APPROVED)
            }
        })

        it('should fail to redeem a voucher with a modified amount', async () => {
            let lazyMintData = await ERC1155_randomRedeemData(address, minter)
            lazyMintData.mintData.amount = crypto.randomInt(1000000000)
            try {
                await instance.redeem(redeemer, lazyMintData.mintData, {from: minter})
                shouldNotPass()
            } catch (error) {
                shouldErrorContainMessage(error, ERC1155_NOT_CREATOR_OR_APPROVED)
            }
        })

        it('should fail to redeem a voucher with a modified salt', async () => {
            let lazyMintData = await ERC1155_randomRedeemData(address, minter)
            lazyMintData.mintData.salt = crypto.randomBytes(32)
            try {
                await instance.redeem(redeemer, lazyMintData.mintData, {from: minter})
                shouldNotPass()
            } catch (error) {
                shouldErrorContainMessage(error, ERC1155_NOT_CREATOR_OR_APPROVED)
            }
        })

        it('should redeem different vouchers of the same tokenId', async () => {
            let lazyMintData = await ERC1155_randomRedeemData(address, minter)
            let currentSupply = lazyMintData.mintData.amount

            let result = await instance.redeem(redeemer, lazyMintData.mintData, {from: minter})
            await redeemShouldSucceed(instance, result,
                {operator: minter, minter: minter, redeemer: redeemer},
                {oldSupply: 0, oldMinterBalance: 0, oldRedeemerBalance: 0},
                lazyMintData, baseURI)

            lazyMintData = await ERC1155_newRedeemData(address, minter, lazyMintData.mintData.tokenURI, crypto.randomInt(1000))
            result = await instance.redeem(anotherRedeemer, lazyMintData.mintData, {from: minter})
            await redeemShouldSucceed(instance, result,
                {operator: minter, minter: minter, redeemer: anotherRedeemer},
                {oldSupply: currentSupply, oldMinterBalance: 0, oldRedeemerBalance: 0},
                lazyMintData, baseURI)
        })

        it('should redeem a voucher of an already-minted tokenId', async () => {
            let uri = randomURI()
            let amount = crypto.randomInt(1000)
            let result = await ERC1155_mintToken(instance, minter, uri, amount)

            let lazyMintData = await ERC1155_newRedeemData(address, minter, uri, crypto.randomInt(1000))
            result = await instance.redeem(redeemer, lazyMintData.mintData, {from: minter})
            await redeemShouldSucceed(instance, result,
                {operator: minter, minter: minter, redeemer: redeemer},
                {oldSupply: amount, oldMinterBalance: amount, oldRedeemerBalance: 0},
                lazyMintData, baseURI)
        })
    })
})
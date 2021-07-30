const {assert} = require('chai')
const {contractName} = require("./helper/ERC721/load")
const {randomRedeemData} = require("./helper/ERC721/lazy-minter")
const {randomURI} = require("./helper/ERC721/helper")
const {checkTransferEvent, checkApproveEvent} = require("./helper/ERC721/events")

const {
    ERC721_TOKEN_ALREADY_MINTED,
    ERC721_MUST_BE_OWNER_OR_APPROVED,
} = require("./helper/ERC721/errors")

const {
    shouldNotPass,
    shouldErrorContainMessage,
} = require("./helper/errors")

const {
    ZERO_ADDRESS,
    pad,
    mintToken,
} = require("./helper/ERC721/helper")

require('chai')
    .use(require('chai-as-promised'))
    .should()

const checkRedeemEvents = async (logs, tokenId, minter, redeemer) => {
    let mintEvent = logs[0].args
    let clearApprovalEvent = logs[1].args
    let transferEvent = logs[2].args

    await checkTransferEvent(mintEvent, tokenId, ZERO_ADDRESS, minter)
    await checkApproveEvent(clearApprovalEvent, tokenId, minter, ZERO_ADDRESS)
    await checkTransferEvent(transferEvent, tokenId, minter, redeemer)


    // assert.equal(mintEvent.from, ZERO_ADDRESS, "mint `from` is invalid")
    // assert.equal(mintEvent.to, minter, "mint `to` is invalid")
    // assert.equal(pad(mintEvent.tokenId.toString("hex"), 64), pad(tokenId, 64), "mint `tokenId` is invalid")

    // assert.equal(clearApprovalEvent.owner, minter, "clearApproval `from` is invalid")
    // assert.equal(clearApprovalEvent.approved, ZERO_ADDRESS, "clearApproval `to` is invalid")
    // assert.equal(pad(clearApprovalEvent.tokenId.toString("hex"), 64), pad(tokenId, 64), "clearApproval `tokenId` is invalid")
    //
    // assert.equal(transferEvent.from, minter, "transfer `from` is invalid")
    // assert.equal(transferEvent.to, redeemer, "transfer `to` is invalid")
    // assert.equal(pad(transferEvent.tokenId.toString("hex"), 64), pad(tokenId, 64), "transfer `tokenId` is invalid")
}
const redeemShouldSucceed = async (instance, result, lazyMintData, minter, redeemer) => {
    await checkRedeemEvents(result.logs, lazyMintData.expectedTokenId.toString("hex").substr(2), minter, redeemer)

    let owner = await instance.ownerOf(lazyMintData.expectedTokenId)
    assert.equal(owner, redeemer, "owner not valid")
}

contract('ERC721 with LazyMint', (accounts) => {
    let instance
    let address

    let minter = accounts[0]
    let approved = accounts[1]
    let notApproved = accounts[2]
    let redeemer = accounts[3]

    before(async () => {
        instance = await contractName.deployed()
        address = await instance.address

        await instance.setApprovalForAll(approved, true)
    })

    describe('redeem', async () => {
        it('should redeem an NFT from a valid signature (sent by owner)', async () => {
            let lazyMintData = await randomRedeemData(address, minter)

            let result = await instance.redeem(redeemer, lazyMintData.uri, lazyMintData.signature, {from: minter})
            await redeemShouldSucceed(instance, result, lazyMintData, minter, redeemer)
        })

        it('should redeem an NFT from a valid signature (sent by approved)', async () => {
            let lazyMintData = await randomRedeemData(address, minter)

            let result = await instance.redeem(redeemer, lazyMintData.uri, lazyMintData.signature, {from: approved})
            await redeemShouldSucceed(instance, result, lazyMintData, minter, redeemer)
        })

        it('should fail to redeem an NFT from a valid signature but sent by notApproved', async () => {
            let lazyMintData = await randomRedeemData(address, minter)

            try {
                await instance.redeem(redeemer, lazyMintData.uri, lazyMintData.signature, {from: notApproved})
                shouldNotPass()
            } catch (error) {
                shouldErrorContainMessage(error, ERC721_MUST_BE_OWNER_OR_APPROVED)
            }
        })

        it('should fail to redeem an already-been-redeemed NFT', async () => {
            let lazyMintData = await randomRedeemData(address, minter)

            let result = await instance.redeem(redeemer, lazyMintData.uri, lazyMintData.signature, {from: minter})
            await redeemShouldSucceed(instance, result, lazyMintData, minter, redeemer)
            try {
                await instance.redeem(redeemer, lazyMintData.uri, lazyMintData.signature, {from: minter})
                shouldNotPass()
            } catch (error) {
                shouldErrorContainMessage(error, ERC721_TOKEN_ALREADY_MINTED)
            }
        })

        it('should fail to redeem an already-been-minted NFT', async () => {
            let lazyMintData = await randomRedeemData(address, minter)

            await mintToken(instance, minter, lazyMintData.uri)
            try {
                await instance.redeem(redeemer, lazyMintData.uri, lazyMintData.signature, {from: minter})
                shouldNotPass()
            } catch (error) {
                shouldErrorContainMessage(error, ERC721_TOKEN_ALREADY_MINTED)
            }
        })

        it('should fail to redeem an NFT with modified URI', async () => {
            let lazyMintData = await randomRedeemData(address, minter)
            lazyMintData.uri = randomURI()
            try {
                await instance.redeem(redeemer, lazyMintData.uri, lazyMintData.signature, {from: minter})
                shouldNotPass()
            } catch (error) {
                shouldErrorContainMessage(error, ERC721_MUST_BE_OWNER_OR_APPROVED)
            }
        })
    })
})
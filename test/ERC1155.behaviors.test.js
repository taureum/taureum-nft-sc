var crypto = require("crypto");
const {assert} = require('chai')
const {contractName, web3} = require("./helper/ERC1155/load")

const {
    ZERO_ADDRESS, mintToken, mintRandomToken,
} = require("./helper/ERC1155/helper")

const {checkTransferSingleEvent} = require("./helper/ERC1155/events");

require('chai')
    .use(require('chai-as-promised'))
    .should()

const mintShouldSucceed = async (instance, result, minter, expectedTokenId, value, baseURI, expectedURI) => {
    await checkTransferSingleEvent(result.logs[0].args, minter, ZERO_ADDRESS, minter, expectedTokenId.toString("hex"), value)

    let owner = await instance.ownerOf(expectedTokenId)
    assert.equal(owner, minter, "owner not valid")

    let uri = await instance.tokenURI(expectedTokenId)
    assert.equal(uri, `${baseURI}${expectedURI}`, "URI not valid")
};

const transferShouldSucceed = async (instance, result, from, to, tokenId) => {
    await checkApproveEvent(result.logs[0].args, tokenId.toString("hex"), from, ZERO_ADDRESS)
    await checkTransferEvent(result.logs[1].args, tokenId.toString("hex"), from, to)

    let owner = await instance.ownerOf(tokenId)
    assert.equal(owner, to, "owner not valid")

    let approved = await instance.getApproved(tokenId)
    assert.equal(approved, ZERO_ADDRESS, "invalid approved")
};

const approveShouldSucceed = async (instance, result, owner, spender, tokenId) => {
    await checkApproveEvent(result.logs[0].args, tokenId.toString("hex"), owner, spender)

    let approved = await instance.getApproved(tokenId)
    assert.equal(approved, spender, "invalid approved")
}

const approveForAllShouldSucceed = async (instance, result, owner, operator, approved) => {
    await checkApprovalForAllEvent(result.logs[0].args, owner, operator, approved)

    let isApproveForAll = await instance.isApprovedForAll(owner, operator)
    assert.equal(isApproveForAll, approved, "isApprovedForAll is invalid")
}

contract('ERC1155', (accounts) => {
    let instance

    let owner = accounts[0]
    let anotherOwner = accounts[1]
    let newOwner = accounts[2]
    let notOwner = accounts[3]
    let approvedUser = accounts[4]
    let anotherApprovedUser = accounts[5]
    let notApprovedUser = accounts[6]
    let operator = accounts[7]
    let anotherOperator = accounts[8]

    let baseURI = ""

    before(async () => {
        instance = await contractName.deployed()
    })

    describe('deployment', async () => {
        it('deploy successfully', async () => {
            const addr = await instance.address

            assert.notEqual(addr, "")
            assert.notEqual(addr, null)
            assert.notEqual(addr, undefined)
        })
    })

    describe('minting', async () => {
        it("create a simple NFT", async () => {
            let uri = crypto.randomBytes(32).toString('hex');
            const result = await mintToken(instance, owner, uri, 1)
            let packed = web3.eth.abi.encodeParameters(['address', 'string'],
                [owner, uri])
            let expectedTokenID = web3.utils.soliditySha3(packed)

            await mintShouldSucceed(instance, result, owner, expectedTokenID, baseURI, uri)
        })

        it("should be able to create a token with supply > 1", async () => {
            let uri = crypto.randomBytes(32).toString('hex');
            const result = await mintToken(instance, owner, uri, 2)
            let packed = web3.eth.abi.encodeParameters(['address', 'string'],
                [owner, uri])
            let expectedTokenID = web3.utils.soliditySha3(packed)

            await mintShouldSucceed(instance, result, owner, expectedTokenID, baseURI, uri)
        })
    })
})
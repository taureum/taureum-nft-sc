var crypto = require("crypto");
const {assert} = require('chai')
const {contractName, web3} = require("./helper/load")
const {shouldSupportInterfaces} = require("./helper/SupportsInterface.behaviors")

const {
    ERC721_MINT_TO_ZERO_ADDRESS_ERROR,
    ERC721_BALANCE_QUERY_FOR_ZERO_ADDRESS,
    ERC721_OWNER_QUERY_FOR_NONEXISTENT_TOKEN,
    ERC721_OPERATOR_QUERY_FOR_NONEXISTENT_TOKEN,
    ERC721_TRANSFER_TO_ZERO_ADDRESS,
    ERC721_NOT_OWNER_OR_APPROVED,
    REVERT_ERROR_MESSAGE,
    REVERT_MESSAGE,
    shouldErrorContainMessage,
} = require("./helper/errors")

const {
    ZERO_ADDRESS,
    pad,
    mintToken,
    mintRandomToken,
} = require("./helper/helper")

require('chai')
    .use(require('chai-as-promised'))
    .should()

const checkMintEvents = async (logs, tokenId, minter) => {
    let mintEvent = logs[0].args

    assert.equal(mintEvent.from, ZERO_ADDRESS, "mint `from` is invalid")
    assert.equal(mintEvent.to, minter, "mint `to` is invalid")
    assert.equal(pad(mintEvent.tokenId.toString("hex"), 64), pad(tokenId, 64), "mint `tokenId` is invalid")
}
const mintShouldSucceed = async (instance, result, minter, expectedTokenId, baseURI, expectedURI) => {
    await checkMintEvents(result.logs, expectedTokenId.toString("hex").substr(2), minter)

    let owner = await instance.ownerOf(expectedTokenId)
    assert.equal(owner, minter, "owner not valid")

    let uri = await instance.tokenURI(expectedTokenId)
    assert.equal(uri, `${baseURI}${expectedURI}`, "URI not valid")
};

const checkTransferEvents = async (logs, tokenId, from, to) => {
    let clearApprovalEvent = logs[0].args
    assert.equal(clearApprovalEvent.owner, from, "clearApproval `from` is invalid")
    assert.equal(clearApprovalEvent.approved, ZERO_ADDRESS, "clearApproval `to` is invalid")
    assert.equal(pad(clearApprovalEvent.tokenId.toString("hex"), 64), pad(tokenId, 64), "clearApproval `tokenId` is invalid")

    let transferEvent = logs[1].args
    assert.equal(transferEvent.from, from, "mint `from` is invalid")
    assert.equal(transferEvent.to, to, "mint `to` is invalid")
    assert.equal(pad(transferEvent.tokenId.toString("hex"), 64), pad(tokenId, 64), "mint `tokenId` is invalid")
}
const transferShouldSucceed = async (instance, result, from, to, tokenId) => {
    await checkTransferEvents(result.logs, tokenId.toString("hex"), from, to)

    let owner = await instance.ownerOf(tokenId)
    assert.equal(owner, to, "owner not valid")

    let approved = await instance.getApproved(tokenId)
    assert.equal(approved, ZERO_ADDRESS, "invalid approved")
};

contract('ERC721 + metadata', (accounts) => {
    let instance

    let owner = accounts[0]
    let anotherOwner = accounts[1]
    let newOwner = accounts[2]
    let notOwner = accounts[3]
    let approvedUser = accounts[4]
    let notApprovedUser = accounts[5]

    let baseURI = ""

    before(async () => {
        instance = await contractName.deployed()
    })

    describe("supportInterfaces", async () => {
        await shouldSupportInterfaces(contractName, [
            'ERC165',
            'ERC721',
            "ERC721Metadata",
        ]);
    })

    describe('deployment', async() => {
        it('deploy successfully', async()=> {
            const addr = await instance.address

            assert.notEqual(addr, "")
            assert.notEqual(addr, null)
            assert.notEqual(addr, undefined)
        })

        it('have a name', async()=> {
            const name = await instance.name()

            assert.equal(name, "Taureum ERC721", "instance name invalid")
        })

        it('have a symbol', async()=> {
            const symbol = await instance.symbol()

            assert.equal(symbol, "Taureum", "instance symbol invalid")
        })
    })

    describe('minting', async() => {
        it("create a simple NFT", async() => {
            let uri = crypto.randomBytes(32).toString('hex');
            const result = await mintToken(instance, owner, uri)
            let packed = web3.eth.abi.encodeParameters(['address', 'string'],
                [owner, uri])
            let expectedTokenID = web3.utils.soliditySha3(packed)

            await mintShouldSucceed(instance, result, owner, expectedTokenID, baseURI, uri)
        })

        it("the zero address cannot mint a new NFT", async() => {
            try {
                await mintRandomToken(instance, ZERO_ADDRESS)
                assert.equal(true, false, 'should not pass')
            } catch (error) {
                assert.equal(shouldErrorContainMessage(error, ERC721_MINT_TO_ZERO_ADDRESS_ERROR), true)
            }
        })
    })

    describe("balanceOf", async() => {
        it("should update balance of an owner when minting new tokens", async () => {
            let oldBalance = await instance.balanceOf(owner)

            await mintRandomToken(instance, owner)

            let newBalance = await instance.balanceOf(owner)
            assert.equal(newBalance.toNumber(), oldBalance.toNumber() + 1, "invalid balance")
        })

        it("should return zero when querying balances of `notOwner`", async () => {
            let balance = await instance.balanceOf(notOwner);
            assert.equal(balance.toNumber(), 0, "invalid balance")
        })

        it("should revert when querying balances of the zero address", async () => {
            try {
                await instance.balanceOf(ZERO_ADDRESS)
                assert.equal(true, false, REVERT_MESSAGE)
            } catch (error) {
                assert.equal(shouldErrorContainMessage(error, ERC721_BALANCE_QUERY_FOR_ZERO_ADDRESS), true, REVERT_ERROR_MESSAGE)
            }
        })
    })

    describe("ownerOf", async() => {
        it("should return the owner of a valid tokenId", async () => {
            let uri = crypto.randomBytes(32).toString('hex');
            await mintToken(instance, owner, uri)
            let packed = await web3.eth.abi.encodeParameters(['address', 'string'],
                [owner, uri])
            let tokenId = web3.utils.soliditySha3(packed)

            let tmpOwner = await instance.ownerOf(tokenId)
            assert.equal(tmpOwner, owner, "invalid owner")
        })

        it("should revert when querying the owner of an invalid tokenId", async () => {
            try {
                let tokenId = crypto.randomBytes(32)
                await instance.ownerOf(tokenId)
                assert.equal(true, false, REVERT_MESSAGE)
            } catch (error) {
                assert.equal(shouldErrorContainMessage(error, ERC721_OWNER_QUERY_FOR_NONEXISTENT_TOKEN), true, REVERT_ERROR_MESSAGE)
            }
        })
    })

    describe('transferFrom', async () => {
        it("owner should be able to transfer its token", async() => {
            //mint a token to test
            let result = await mintRandomToken(instance, owner)
            const event = result.logs[0].args
            let tokenId = event.tokenId

            //Transfer to another account
            result = await instance.transferFrom(owner, newOwner, tokenId)
            await transferShouldSucceed(instance, result, owner, newOwner, tokenId)
        })

        it("approved should be able to transfer a token", async() => {
            //mint a token to test
            let result = await mintRandomToken(instance, owner)
            const event = result.logs[0].args
            let tokenId = event.tokenId

            await instance.approve(approvedUser, tokenId)

            //Transfer to another account
            result = await instance.transferFrom(owner, newOwner, tokenId, {from: approvedUser})
            await transferShouldSucceed(instance, result, owner, newOwner, tokenId)
        })

        it("newOwner should be able to transfer the token", async() => {
            //mint a token to test
            let result = await mintRandomToken(instance, owner)
            const event = result.logs[0].args
            let tokenId = event.tokenId

            //Transfer to another account
            result = await instance.transferFrom(owner, newOwner, tokenId)
            await transferShouldSucceed(instance, result, owner, newOwner, tokenId)

            result = await instance.transferFrom(newOwner, anotherOwner, tokenId, {from: newOwner});
            await transferShouldSucceed(instance, result, newOwner, anotherOwner, tokenId)
        })

        it("oldOwner should not be able to transfer the previously-owned token", async() => {
            //mint a token to test
            let result = await mintRandomToken(instance, owner)
            const event = result.logs[0].args
            let tokenId = event.tokenId

            //Transfer to another account
            result = await instance.transferFrom(owner, newOwner, tokenId)
            await transferShouldSucceed(instance, result, owner, newOwner, tokenId)

            try {
                await instance.transferFrom(owner, anotherOwner, tokenId);
                assert.equal(true, false, REVERT_MESSAGE)
            } catch(error) {
                assert.equal(shouldErrorContainMessage(error, ERC721_NOT_OWNER_OR_APPROVED), true, REVERT_ERROR_MESSAGE)
            }
        })

        it("should not be able to transfer to the zero address", async() => {
            try {
                let result = await mintRandomToken(instance, owner)
                const event = result.logs[0].args
                let tokenId = event.tokenId
                await instance.transferFrom(owner, ZERO_ADDRESS, tokenId, {from: owner})
                assert.equal(true, false, REVERT_MESSAGE)
            } catch (error) {
                assert.equal(shouldErrorContainMessage(error, ERC721_TRANSFER_TO_ZERO_ADDRESS), true, REVERT_ERROR_MESSAGE)
            }
        })

        it("should not be able to transfer an invalid token", async() => {
            try {
                let tokenId = crypto.randomBytes(32)
                await instance.transferFrom(owner, newOwner, tokenId, {from: owner})
                assert.equal(true, false, REVERT_MESSAGE)
            } catch (error) {
                assert.equal(shouldErrorContainMessage(error, ERC721_OPERATOR_QUERY_FOR_NONEXISTENT_TOKEN), true, REVERT_ERROR_MESSAGE)
            }
        })

        it("notApprovedUser should not be able to transfer a token", async() => {
            //mint a token to test
            let result = await mintRandomToken(instance, owner)
            const event = result.logs[0].args
            let tokenId = event.tokenId

            await instance.approve(approvedUser, tokenId)
            try {
                await instance.transferFrom(owner, newOwner, tokenId, {from: notApprovedUser})
                assert.equal(true, false, REVERT_MESSAGE)
            } catch (error) {
                assert.equal(shouldErrorContainMessage(error, ERC721_NOT_OWNER_OR_APPROVED), true, REVERT_ERROR_MESSAGE)
            }
        })

        it("approvedForAll user should be able to transfer all tokens of the approving user", async() => {
            //mint a token to test
            let result = await mintRandomToken(instance, owner)
            let event = result.logs[0].args
            let tokenId1 = event.tokenId

            result = await mintRandomToken(instance, owner, 1)
            event = result.logs[0].args
            let tokenId2 = event.tokenId

            //Approve another user to transfer token
            await instance.setApprovalForAll(approvedUser, true, {from:owner})

            //Transfer to another account
            result = await instance.transferFrom(owner, newOwner, tokenId1, {from: approvedUser})
            await transferShouldSucceed(instance, result, owner, newOwner, tokenId1)

            //Transfer to another account
            result = await instance.transferFrom(owner, anotherOwner, tokenId2, {from: approvedUser})
            await transferShouldSucceed(instance, result, owner, anotherOwner, tokenId2)
        })

        it("revoking approvalForAll should work", async() => {
            let result = await mintRandomToken(instance, owner)
            let event = result.logs[0].args
            let tokenId1 = event.tokenId

            result = await mintRandomToken(instance, owner)
            event = result.logs[0].args
            let tokenId2 = event.tokenId

            //Approve another user to transfer token
            await instance.setApprovalForAll(approvedUser, true, {from:owner})

            //Transfer to another account
            result = await instance.transferFrom(owner, newOwner, tokenId1, {from: approvedUser})
            await transferShouldSucceed(instance, result, owner, newOwner, tokenId1)

            //Revoke another user to transfer token
            await instance.setApprovalForAll(approvedUser, false, {from:owner})

            //Transfer to another account
            try {
                await instance.transferFrom(owner, newOwner, tokenId2, {from: approvedUser})
                assert.equal(true, false, REVERT_MESSAGE)
            } catch (error) {
                assert.equal(shouldErrorContainMessage(error, ERC721_NOT_OWNER_OR_APPROVED), true, REVERT_ERROR_MESSAGE)
            }
        })
    })

    describe('safeTransferFrom', async () => {
        it("owner should be able to transfer its token", async() => {
            //mint a token to test
            let result = await mintRandomToken(instance, owner)
            const event = result.logs[0].args
            let tokenId = event.tokenId

            //Transfer to another account
            result = await instance.safeTransferFrom(owner, newOwner, tokenId)
            await transferShouldSucceed(instance, result, owner, newOwner, tokenId)
        })

        it("approved should be able to transfer a token", async() => {
            //mint a token to test
            let result = await mintRandomToken(instance, owner)
            const event = result.logs[0].args
            let tokenId = event.tokenId

            await instance.approve(approvedUser, tokenId)

            //Transfer to another account
            result = await instance.safeTransferFrom(owner, newOwner, tokenId, {from: approvedUser})
            await transferShouldSucceed(instance, result, owner, newOwner, tokenId)
        })

        it("newOwner should be able to transfer the token", async() => {
            //mint a token to test
            let result = await mintRandomToken(instance, owner)
            const event = result.logs[0].args
            let tokenId = event.tokenId

            //Transfer to another account
            result = await instance.safeTransferFrom(owner, newOwner, tokenId)
            await transferShouldSucceed(instance, result, owner, newOwner, tokenId)

            result = await instance.safeTransferFrom(newOwner, anotherOwner, tokenId, {from: newOwner});
            await transferShouldSucceed(instance, result, newOwner, anotherOwner, tokenId)
        })

        it("oldOwner should not be able to transfer the previously-owned token", async() => {
            //mint a token to test
            let result = await mintRandomToken(instance, owner)
            const event = result.logs[0].args
            let tokenId = event.tokenId

            //Transfer to another account
            result = await instance.safeTransferFrom(owner, newOwner, tokenId)
            await transferShouldSucceed(instance, result, owner, newOwner, tokenId)

            try {
                await instance.transferFrom(owner, anotherOwner, tokenId);
                assert.equal(true, false, REVERT_MESSAGE)
            } catch(error) {
                assert.equal(shouldErrorContainMessage(error, ERC721_NOT_OWNER_OR_APPROVED), true, REVERT_ERROR_MESSAGE)
            }
        })

        it("should not be able to transfer to the zero address", async() => {
            try {
                let result = await mintRandomToken(instance, owner)
                const event = result.logs[0].args
                let tokenId = event.tokenId
                await instance.safeTransferFrom(owner, ZERO_ADDRESS, tokenId, {from: owner})
                assert.equal(true, false, REVERT_MESSAGE)
            } catch (error) {
                assert.equal(shouldErrorContainMessage(error, ERC721_TRANSFER_TO_ZERO_ADDRESS), true, REVERT_ERROR_MESSAGE)
            }
        })

        it("should not be able to transfer an invalid token", async() => {
            try {
                let tokenId = crypto.randomBytes(32)
                await instance.safeTransferFrom(owner, newOwner, tokenId, {from: owner})
                assert.equal(true, false, REVERT_MESSAGE)
            } catch (error) {
                assert.equal(shouldErrorContainMessage(error, ERC721_OPERATOR_QUERY_FOR_NONEXISTENT_TOKEN), true, REVERT_ERROR_MESSAGE)
            }
        })

        it("notApprovedUser should not be able to transfer a token", async() => {
            //mint a token to test
            let result = await mintRandomToken(instance, owner)
            const event = result.logs[0].args
            let tokenId = event.tokenId

            await instance.approve(approvedUser, tokenId)
            try {
                await instance.safeTransferFrom(owner, newOwner, tokenId, {from: notApprovedUser})
                assert.equal(true, false, REVERT_MESSAGE)
            } catch (error) {
                assert.equal(shouldErrorContainMessage(error, ERC721_NOT_OWNER_OR_APPROVED), true, REVERT_ERROR_MESSAGE)
            }
        })

        it("approvedForAll user should be able to transfer all tokens of the approving user", async() => {
            //mint a token to test
            let result = await mintRandomToken(instance, owner)
            let event = result.logs[0].args
            let tokenId1 = event.tokenId

            result = await mintRandomToken(instance, owner, 1)
            event = result.logs[0].args
            let tokenId2 = event.tokenId

            //Approve another user to transfer token
            await instance.setApprovalForAll(approvedUser, true, {from:owner})

            //Transfer to another account
            result = await instance.safeTransferFrom(owner, newOwner, tokenId1, {from: approvedUser})
            await transferShouldSucceed(instance, result, owner, newOwner, tokenId1)

            //Transfer to another account
            result = await instance.safeTransferFrom(owner, anotherOwner, tokenId2, {from: approvedUser})
            await transferShouldSucceed(instance, result, owner, anotherOwner, tokenId2)
        })

        it("revoking approvalForAll should work", async() => {
            let result = await mintRandomToken(instance, owner)
            let event = result.logs[0].args
            let tokenId1 = event.tokenId

            result = await mintRandomToken(instance, owner)
            event = result.logs[0].args
            let tokenId2 = event.tokenId

            //Approve another user to transfer token
            await instance.setApprovalForAll(approvedUser, true, {from:owner})

            //Transfer to another account
            result = await instance.safeTransferFrom(owner, newOwner, tokenId1, {from: approvedUser})
            await transferShouldSucceed(instance, result, owner, newOwner, tokenId1)

            //Revoke another user to transfer token
            await instance.setApprovalForAll(approvedUser, false, {from:owner})

            //Transfer to another account
            try {
                await instance.safeTransferFrom(owner, newOwner, tokenId2, {from: approvedUser})
                assert.equal(true, false, REVERT_MESSAGE)
            } catch (error) {
                assert.equal(shouldErrorContainMessage(error, ERC721_NOT_OWNER_OR_APPROVED), true, REVERT_ERROR_MESSAGE)
            }
        })
    })
})
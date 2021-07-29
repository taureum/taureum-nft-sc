var crypto = require("crypto");
const {assert} = require('chai')
const {contractName, web3} = require("./helper/load")
const {shouldSupportInterfaces} = require("./helper/SupportsInterface.behaviors")
const {checkApproveEvent, checkTransferEvent, checkApprovalForAllEvent} = require("./helper/events")

const {
    ERC721_MINT_TO_ZERO_ADDRESS_ERROR,
    ERC721_BALANCE_QUERY_FOR_ZERO_ADDRESS,
    ERC721_OWNER_QUERY_FOR_NONEXISTENT_TOKEN,
    ERC721_OPERATOR_QUERY_FOR_NONEXISTENT_TOKEN,
    ERC721_TRANSFER_TO_ZERO_ADDRESS,
    ERC721_APPROVE_TO_CALLER,
    ERC721_APPROVE_SELF,
    ERC721_NOT_OWNER_OR_APPROVED,
    ERC721_NOT_OWNER_OR_APPROVED_FOR_ALL,
    REVERT_MESSAGE,
    shouldErrorContainMessage,
    shouldNotPass,
} = require("./helper/errors")

const {
    ZERO_ADDRESS,
    mintToken,
    mintRandomToken,
} = require("./helper/helper")

require('chai')
    .use(require('chai-as-promised'))
    .should()

const mintShouldSucceed = async (instance, result, minter, expectedTokenId, baseURI, expectedURI) => {
    await checkTransferEvent(result.logs[0].args, expectedTokenId.toString("hex"), ZERO_ADDRESS, minter)

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

contract('ERC721 + metadata', (accounts) => {
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

    describe("supportInterfaces", async () => {
        await shouldSupportInterfaces(contractName, [
            'ERC165',
            'ERC721',
            "ERC721Metadata",
        ]);
    })

    describe('deployment', async () => {
        it('deploy successfully', async () => {
            const addr = await instance.address

            assert.notEqual(addr, "")
            assert.notEqual(addr, null)
            assert.notEqual(addr, undefined)
        })

        it('have a name', async () => {
            const name = await instance.name()

            assert.equal(name, "Taureum ERC721", "instance name invalid")
        })

        it('have a symbol', async () => {
            const symbol = await instance.symbol()

            assert.equal(symbol, "Taureum", "instance symbol invalid")
        })
    })

    describe('minting', async () => {
        it("create a simple NFT", async () => {
            let uri = crypto.randomBytes(32).toString('hex');
            const result = await mintToken(instance, owner, uri)
            let packed = web3.eth.abi.encodeParameters(['address', 'string'],
                [owner, uri])
            let expectedTokenID = web3.utils.soliditySha3(packed)

            await mintShouldSucceed(instance, result, owner, expectedTokenID, baseURI, uri)
        })

        it("the zero address cannot mint a new NFT", async () => {
            try {
                await mintRandomToken(instance, ZERO_ADDRESS)
                assert.equal(true, false, 'should not pass')
            } catch (error) {
                shouldErrorContainMessage(error, ERC721_MINT_TO_ZERO_ADDRESS_ERROR)
            }
        })
    })

    describe("balanceOf", async () => {
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
                shouldNotPass()
            } catch (error) {
                shouldErrorContainMessage(error, ERC721_BALANCE_QUERY_FOR_ZERO_ADDRESS)
            }
        })
    })

    describe("ownerOf", async () => {
        it("should return the owner of a valid tokenId", async () => {
            let uri = crypto.randomBytes(32).toString('hex');
            await mintToken(instance, owner, uri)
            let packed = web3.eth.abi.encodeParameters(['address', 'string'],
                [owner, uri])
            let tokenId = web3.utils.soliditySha3(packed)

            let tmpOwner = await instance.ownerOf(tokenId)
            assert.equal(tmpOwner, owner, "invalid owner")
        })

        it("should revert when querying the owner of an invalid tokenId", async () => {
            try {
                let tokenId = crypto.randomBytes(32)
                await instance.ownerOf(tokenId)
                shouldNotPass()
            } catch (error) {
                shouldErrorContainMessage(error, ERC721_OWNER_QUERY_FOR_NONEXISTENT_TOKEN)
            }
        })
    })

    describe("setApproveForAll", async () => {
        it("granting permission should work", async () => {
            let result = await instance.setApprovalForAll(operator, true, {from: owner})
            await approveForAllShouldSucceed(instance, result, owner, operator, true)
        })

        it("should be able to grant permission to > 1 operators", async () => {
            let result = await instance.setApprovalForAll(operator, true, {from: owner})
            await approveForAllShouldSucceed(instance, result, owner, operator, true)

            result = await instance.setApprovalForAll(anotherOperator, true, {from: owner})
            await approveForAllShouldSucceed(instance, result, owner, anotherOperator, true)
        })

        it("withdrawing permission should work", async () => {
            let result = await instance.setApprovalForAll(operator, false, {from: owner})
            await approveForAllShouldSucceed(instance, result, owner, operator, false)
        })

        it("cannot setApprovalForAll for self", async () => {
            try {
                let result = await instance.setApprovalForAll(owner, true, {from: owner})
                await checkApprovalForAllEvent(result.logs[0].args, owner.operator, true)
                shouldNotPass()
            } catch (e) {
                shouldErrorContainMessage(e, ERC721_APPROVE_TO_CALLER)
            }
        })
    })

    describe("approve + getApproved", async () => {
        it("owner should be able approve other to use its tokens", async () => {
            let result = await mintRandomToken(instance, owner)
            const event = result.logs[0].args
            let tokenId = event.tokenId

            result = await instance.approve(approvedUser, tokenId, {from: owner})
            await approveShouldSucceed(instance, result, owner, approvedUser, tokenId)
        })

        it("operator should be able approve other to use the owner's tokens", async () => {
            let result = await mintRandomToken(instance, owner)
            const event = result.logs[0].args
            let tokenId = event.tokenId

            await instance.setApprovalForAll(operator, tokenId, {from: owner})

            result = await instance.approve(approvedUser, tokenId, {from: operator})
            await approveShouldSucceed(instance, result, owner, approvedUser, tokenId)
        })

        it("should be able to approve a second time, doing this will clear the Approval for the first user", async () => {
            let result = await mintRandomToken(instance, owner)
            const event = result.logs[0].args
            let tokenId = event.tokenId

            result = await instance.approve(approvedUser, tokenId, {from: owner})
            await approveShouldSucceed(instance, result, owner, approvedUser, tokenId)

            result = await instance.approve(anotherApprovedUser, tokenId, {from: owner})
            await approveShouldSucceed(instance, result, owner, anotherApprovedUser, tokenId)
        })

        it("should be able to approve the ZERO_ADDRESS", async () => {
            let result = await mintRandomToken(instance, owner)
            const event = result.logs[0].args
            let tokenId = event.tokenId

            result = await instance.approve(ZERO_ADDRESS, tokenId, {from: owner})
            await approveShouldSucceed(instance, result, owner, ZERO_ADDRESS, tokenId)
        })

        it("cannot approve a not-owned tokenId", async () => {
            let result = await mintRandomToken(instance, owner)
            const event = result.logs[0].args
            let tokenId = event.tokenId

            try {
                await instance.approve(ZERO_ADDRESS, tokenId, {from: notOwner})
                shouldNotPass()
            } catch (error) {
                shouldErrorContainMessage(error, ERC721_NOT_OWNER_OR_APPROVED_FOR_ALL)
            }

        })

        it("cannot approve self", async () => {
            let result = await mintRandomToken(instance, owner)
            const event = result.logs[0].args
            let tokenId = event.tokenId

            try {
                await instance.approve(owner, tokenId, {from: owner})
                shouldNotPass()
            } catch (error) {
                shouldErrorContainMessage(error, ERC721_APPROVE_SELF)
            }

        })

        it("cannot approve a non-existed tokenId", async () => {
            let tokenId = crypto.randomBytes(32)

            try {
                await instance.approve(ZERO_ADDRESS, tokenId, {from: owner})
                shouldNotPass()
            } catch (error) {
                shouldErrorContainMessage(error, ERC721_OWNER_QUERY_FOR_NONEXISTENT_TOKEN)
            }

        })
    })

    describe('transferFrom', async () => {
        it("owner should be able to transfer its token", async () => {
            //mint a token to test
            let result = await mintRandomToken(instance, owner)
            const event = result.logs[0].args
            let tokenId = event.tokenId

            //Transfer to another account
            result = await instance.transferFrom(owner, newOwner, tokenId)
            await transferShouldSucceed(instance, result, owner, newOwner, tokenId)
        })

        it("approved should be able to transfer a token", async () => {
            //mint a token to test
            let result = await mintRandomToken(instance, owner)
            const event = result.logs[0].args
            let tokenId = event.tokenId

            await instance.approve(approvedUser, tokenId)

            //Transfer to another account
            result = await instance.transferFrom(owner, newOwner, tokenId, {from: approvedUser})
            await transferShouldSucceed(instance, result, owner, newOwner, tokenId)
        })

        it("newOwner should be able to transfer the token", async () => {
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

        it("oldOwner should not be able to transfer the previously-owned token", async () => {
            //mint a token to test
            let result = await mintRandomToken(instance, owner)
            const event = result.logs[0].args
            let tokenId = event.tokenId

            //Transfer to another account
            result = await instance.transferFrom(owner, newOwner, tokenId)
            await transferShouldSucceed(instance, result, owner, newOwner, tokenId)

            try {
                await instance.transferFrom(owner, anotherOwner, tokenId);
                shouldNotPass()
            } catch (error) {
                shouldErrorContainMessage(error, ERC721_NOT_OWNER_OR_APPROVED)
            }
        })

        it("should not be able to transfer to the zero address", async () => {
            try {
                let result = await mintRandomToken(instance, owner)
                const event = result.logs[0].args
                let tokenId = event.tokenId
                await instance.transferFrom(owner, ZERO_ADDRESS, tokenId, {from: owner})
                shouldNotPass()
            } catch (error) {
                shouldErrorContainMessage(error, ERC721_TRANSFER_TO_ZERO_ADDRESS)
            }
        })

        it("should not be able to transfer an invalid token", async () => {
            try {
                let tokenId = crypto.randomBytes(32)
                await instance.transferFrom(owner, newOwner, tokenId, {from: owner})
                shouldNotPass()
            } catch (error) {
                shouldErrorContainMessage(error, ERC721_OPERATOR_QUERY_FOR_NONEXISTENT_TOKEN)
            }
        })

        it("notApprovedUser should not be able to transfer a token", async () => {
            //mint a token to test
            let result = await mintRandomToken(instance, owner)
            const event = result.logs[0].args
            let tokenId = event.tokenId

            await instance.approve(approvedUser, tokenId)
            try {
                await instance.transferFrom(owner, newOwner, tokenId, {from: notApprovedUser})
                shouldNotPass()
            } catch (error) {
                shouldErrorContainMessage(error, ERC721_NOT_OWNER_OR_APPROVED)
            }
        })

        it("approvedForAll user should be able to transfer all tokens of the approving user", async () => {
            //mint a token to test
            let result = await mintRandomToken(instance, owner)
            let event = result.logs[0].args
            let tokenId1 = event.tokenId

            result = await mintRandomToken(instance, owner, 1)
            event = result.logs[0].args
            let tokenId2 = event.tokenId

            //Approve another user to transfer token
            await instance.setApprovalForAll(approvedUser, true, {from: owner})

            //Transfer to another account
            result = await instance.transferFrom(owner, newOwner, tokenId1, {from: approvedUser})
            await transferShouldSucceed(instance, result, owner, newOwner, tokenId1)

            //Transfer to another account
            result = await instance.transferFrom(owner, anotherOwner, tokenId2, {from: approvedUser})
            await transferShouldSucceed(instance, result, owner, anotherOwner, tokenId2)
        })

        it("revoking approvalForAll should work", async () => {
            let result = await mintRandomToken(instance, owner)
            let event = result.logs[0].args
            let tokenId1 = event.tokenId

            result = await mintRandomToken(instance, owner)
            event = result.logs[0].args
            let tokenId2 = event.tokenId

            //Approve another user to transfer token
            await instance.setApprovalForAll(approvedUser, true, {from: owner})

            //Transfer to another account
            result = await instance.transferFrom(owner, newOwner, tokenId1, {from: approvedUser})
            await transferShouldSucceed(instance, result, owner, newOwner, tokenId1)

            //Revoke another user to transfer token
            await instance.setApprovalForAll(approvedUser, false, {from: owner})

            //Transfer to another account
            try {
                await instance.transferFrom(owner, newOwner, tokenId2, {from: approvedUser})
                shouldNotPass()
            } catch (error) {
                shouldErrorContainMessage(error, ERC721_NOT_OWNER_OR_APPROVED)
            }
        })
    })

    describe('safeTransferFrom', async () => {
        it("owner should be able to transfer its token", async () => {
            //mint a token to test
            let result = await mintRandomToken(instance, owner)
            const event = result.logs[0].args
            let tokenId = event.tokenId

            //Transfer to another account
            result = await instance.safeTransferFrom(owner, newOwner, tokenId)
            await transferShouldSucceed(instance, result, owner, newOwner, tokenId)
        })

        it("approved should be able to transfer a token", async () => {
            //mint a token to test
            let result = await mintRandomToken(instance, owner)
            const event = result.logs[0].args
            let tokenId = event.tokenId

            await instance.approve(approvedUser, tokenId)

            //Transfer to another account
            result = await instance.safeTransferFrom(owner, newOwner, tokenId, {from: approvedUser})
            await transferShouldSucceed(instance, result, owner, newOwner, tokenId)
        })

        it("newOwner should be able to transfer the token", async () => {
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

        it("oldOwner should not be able to transfer the previously-owned token", async () => {
            //mint a token to test
            let result = await mintRandomToken(instance, owner)
            const event = result.logs[0].args
            let tokenId = event.tokenId

            //Transfer to another account
            result = await instance.safeTransferFrom(owner, newOwner, tokenId)
            await transferShouldSucceed(instance, result, owner, newOwner, tokenId)

            try {
                await instance.transferFrom(owner, anotherOwner, tokenId);
                shouldNotPass()
            } catch (error) {
                shouldErrorContainMessage(error, ERC721_NOT_OWNER_OR_APPROVED)
            }
        })

        it("should not be able to transfer to the zero address", async () => {
            try {
                let result = await mintRandomToken(instance, owner)
                const event = result.logs[0].args
                let tokenId = event.tokenId
                await instance.safeTransferFrom(owner, ZERO_ADDRESS, tokenId, {from: owner})
                shouldNotPass()
            } catch (error) {
                shouldErrorContainMessage(error, ERC721_TRANSFER_TO_ZERO_ADDRESS)
            }
        })

        it("should not be able to transfer an invalid token", async () => {
            try {
                let tokenId = crypto.randomBytes(32)
                await instance.safeTransferFrom(owner, newOwner, tokenId, {from: owner})
                shouldNotPass()
            } catch (error) {
                shouldErrorContainMessage(error, ERC721_OPERATOR_QUERY_FOR_NONEXISTENT_TOKEN)
            }
        })

        it("notApprovedUser should not be able to transfer a token", async () => {
            //mint a token to test
            let result = await mintRandomToken(instance, owner)
            const event = result.logs[0].args
            let tokenId = event.tokenId

            await instance.approve(approvedUser, tokenId)
            try {
                await instance.safeTransferFrom(owner, newOwner, tokenId, {from: notApprovedUser})
                shouldNotPass()
            } catch (error) {
                shouldErrorContainMessage(error, ERC721_NOT_OWNER_OR_APPROVED)
            }
        })

        it("approvedForAll user should be able to transfer all tokens of the approving user", async () => {
            //mint a token to test
            let result = await mintRandomToken(instance, owner)
            let event = result.logs[0].args
            let tokenId1 = event.tokenId

            result = await mintRandomToken(instance, owner, 1)
            event = result.logs[0].args
            let tokenId2 = event.tokenId

            //Approve another user to transfer token
            await instance.setApprovalForAll(approvedUser, true, {from: owner})

            //Transfer to another account
            result = await instance.safeTransferFrom(owner, newOwner, tokenId1, {from: approvedUser})
            await transferShouldSucceed(instance, result, owner, newOwner, tokenId1)

            //Transfer to another account
            result = await instance.safeTransferFrom(owner, anotherOwner, tokenId2, {from: approvedUser})
            await transferShouldSucceed(instance, result, owner, anotherOwner, tokenId2)
        })

        it("revoking approvalForAll should work", async () => {
            let result = await mintRandomToken(instance, owner)
            let event = result.logs[0].args
            let tokenId1 = event.tokenId

            result = await mintRandomToken(instance, owner)
            event = result.logs[0].args
            let tokenId2 = event.tokenId

            //Approve another user to transfer token
            await instance.setApprovalForAll(approvedUser, true, {from: owner})

            //Transfer to another account
            result = await instance.safeTransferFrom(owner, newOwner, tokenId1, {from: approvedUser})
            await transferShouldSucceed(instance, result, owner, newOwner, tokenId1)

            //Revoke another user to transfer token
            await instance.setApprovalForAll(approvedUser, false, {from: owner})

            //Transfer to another account
            try {
                await instance.safeTransferFrom(owner, newOwner, tokenId2, {from: approvedUser})
                shouldNotPass()
            } catch (error) {
                shouldErrorContainMessage(error, ERC721_NOT_OWNER_OR_APPROVED)
            }
        })
    })
})
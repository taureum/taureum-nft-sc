var crypto = require("crypto");
const {assert} = require('chai')
const {contractName, web3} = require("./helper/ERC1155/load")

const {
    ZERO_ADDRESS,
    ERC1155_mintToken,
    ERC1155_mintRandomToken,
    ERC1155_mintBatchToken,
    ERC1155_mintRandomBatchToken, randomURI,
} = require("./helper/helper")
const {shouldSupportInterfaces} = require("./helper/SupportsInterface.behaviors");
const {checkTransferSingleEvent, checkTransferBatchEvent, checkApproveForAllEvent} = require("./helper/ERC1155/events");
const {shouldNotPass, shouldErrorContainMessage} = require("./helper/errors");
const {
    ERC1155_MINT_TO_ZERO_ADDRESS,
    ERC1155_TRANSFER_TO_ZERO_ADDRESS,
    ERC1155_BALANCE_QUERY_FOR_ZERO_ADDRESS,
    ERC1155_SETTING_APPROVAL_FOR_SELF,
    ERC1155_INSUFFICIENT_BALANCE,
} = require("./helper/ERC1155/errors");
const {BigNumber} = require("ethers");

require('chai')
    .use(require('chai-as-promised'))
    .should()

const mintShouldSucceed = async (instance, result, minter, tokenId, totalSupply, baseURI, uri) => {
    await checkTransferSingleEvent(result.logs[0].args, minter, ZERO_ADDRESS, minter, tokenId.toString("hex"), totalSupply)

    let tmpBalance = await instance.balanceOf(minter, tokenId)
    assert.equal(tmpBalance.toString(), totalSupply, "balance not valid")

    let tmpURI = await instance.tokenURI(tokenId)
    assert.equal(tmpURI, `${baseURI}${uri}`, "URI not valid")

    let tmpSupply = await instance.totalSupply(tokenId)
    assert.equal(tmpSupply, totalSupply)

    let tmpCreator = await instance.getCreator(tokenId)
    assert.equal(tmpCreator, minter)
};

const mintBatchShouldSucceed = async (instance, result, minter, tokenIds, totalSupplies, baseURI, uris, checkBalance = true) => {
    await checkTransferBatchEvent(result.logs[0].args, minter, ZERO_ADDRESS, minter, tokenIds, totalSupplies)

    if (checkBalance) {
        for (let i = 0; i < tokenIds.length; i++) {
            let tokenId = BigNumber.from("0x" + tokenIds[i])
            let tmpBalance = await instance.balanceOf(minter, tokenId)
            assert.equal(tmpBalance.toString(), totalSupplies[i], "balance not valid")

            let tmpURI = await instance.tokenURI(tokenId)
            assert.equal(tmpURI, `${baseURI}${uris[i]}`, "URI not valid")

            let tmpSupply = await instance.totalSupply(tokenId)
            assert.equal(tmpSupply, totalSupplies[i])
        }
    }
};

const transferShouldSucceed = async (instance, result, operator, from, to, tokenId, oldFromBalance, oldToBalance, amount) => {
    await checkTransferSingleEvent(result.logs[0].args, operator, from, to, tokenId.toString("hex"), amount)

    let fromBalance = await instance.balanceOf(from, tokenId)
    assert.equal(fromBalance.toNumber(), oldFromBalance - amount, "balance of `from` not valid")

    let toBalance = await instance.balanceOf(to, tokenId)
    assert.equal(toBalance.toNumber(), oldToBalance + amount, "balance of `to` not valid")
};

const approveForAllShouldSucceed = async (instance, result, account, operator, approved) => {
    await checkApproveForAllEvent(result.logs[0].args, account, operator, approved)

    let isApproved = await instance.isApprovedForAll(account, operator)
    assert.equal(isApproved, approved, "isApprovedForAll is invalid")
}

contract('ERC1155', (accounts) => {
    let instance

    let owner = accounts[0]
    let anotherOwner = accounts[1]
    let newOwner = accounts[2]
    let notOwner = accounts[3]
    let operator = accounts[4]

    let baseURI = ""

    before(async () => {
        instance = await contractName.deployed()
    })

    describe("supportInterfaces", async () => {
        await shouldSupportInterfaces(contractName, [
            'ERC1155',
        ]);
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
            let uri = randomURI()
            const result = await ERC1155_mintToken(instance, owner, uri, 1)
            let packed = web3.eth.abi.encodeParameters(['address', 'string'],
                [owner, uri])
            let expectedTokenID = web3.utils.soliditySha3(packed)

            await mintShouldSucceed(instance, result, owner, expectedTokenID, 1, baseURI, uri)
        })

        it("should be able to create a token with supply > 1", async () => {
            let uri = randomURI()
            let supply = crypto.randomInt(1000000000000)
            const result = await ERC1155_mintToken(instance, owner, uri, supply)
            let packed = web3.eth.abi.encodeParameters(['address', 'string'],
                [owner, uri])
            let expectedTokenID = web3.utils.soliditySha3(packed)

            await mintShouldSucceed(instance, result, owner, expectedTokenID, supply, baseURI, uri)
        })

        it("should be able to re-mint a token", async () => {
            let uri = randomURI()
            let supply = crypto.randomInt(1000000000000)
            let result = await ERC1155_mintToken(instance, owner, uri, supply)
            let packed = web3.eth.abi.encodeParameters(['address', 'string'],
                [owner, uri])
            let expectedTokenID = web3.utils.soliditySha3(packed)

            await mintShouldSucceed(instance, result, owner, expectedTokenID, supply, baseURI, uri)

            let moreSupply = crypto.randomInt(1000000)
            result = await ERC1155_mintToken(instance, owner, uri, moreSupply)
            await checkTransferSingleEvent(result.logs[0].args, owner, ZERO_ADDRESS, owner, expectedTokenID.toString("hex"), moreSupply)

            let tmpBalance = await instance.balanceOf(owner, expectedTokenID)
            assert.equal(tmpBalance.toNumber(), supply + moreSupply, "balance not valid")
            let tmpSupply = await instance.totalSupply(expectedTokenID)
            assert.equal(tmpSupply.toNumber(), supply + moreSupply)
        })

        it("cannot mint to the zero address", async () => {
            try {
                await ERC1155_mintRandomToken(instance, ZERO_ADDRESS)
                shouldNotPass()
            } catch (e) {
                shouldErrorContainMessage(e, ERC1155_MINT_TO_ZERO_ADDRESS)
            }

        })
    })

    describe('batch Minting', async () => {
        it("should be able to create a batch of tokens", async () => {
            let r = 1 + crypto.randomInt(10)
            let uris = new Array(r)
            let expectedIDs = new Array(r)
            let supplies = new Array(r)
            for (let i = 0; i < r; i++) {
                uris[i] = randomURI()
                supplies[i] = crypto.randomInt(1000000000000)
                let packed = web3.eth.abi.encodeParameters(['address', 'string'],
                    [owner, uris[i]])
                expectedIDs[i] = web3.utils.soliditySha3(packed)
            }
            const result = await ERC1155_mintBatchToken(instance, owner, uris, supplies)

            await mintBatchShouldSucceed(instance, result, owner, expectedIDs, supplies, baseURI, uris)
        })

        it("cannot mint to the zero address", async () => {
            try {
                await ERC1155_mintRandomBatchToken(instance, ZERO_ADDRESS)
                shouldNotPass()
            } catch (e) {
                shouldErrorContainMessage(e, ERC1155_MINT_TO_ZERO_ADDRESS)
            }
        })

        it("should be able to mint duplicate tokens", async () => {
            let uris = new Array(2)
            let expectedIDs = new Array(2)
            let supplies = new Array(2)

            uris[0] = randomURI()
            uris[1] = uris[0]

            let packed = web3.eth.abi.encodeParameters(['address', 'string'],
                [owner, uris[0]])
            expectedIDs[0] = web3.utils.soliditySha3(packed)
            expectedIDs[1] = expectedIDs[0]

            supplies[0] = crypto.randomInt(1000000000000)
            supplies[1] = crypto.randomInt(1000000000000)

            const result = await ERC1155_mintBatchToken(instance, owner, uris, supplies)
            await mintBatchShouldSucceed(instance, result, owner, expectedIDs, supplies, baseURI, uris, false)

            let tokenId = BigNumber.from("0x" + expectedIDs[0])
            let tmpBalance = await instance.balanceOf(owner, tokenId)
            assert.equal(tmpBalance.toString(), supplies[0] + supplies[1], "balance not valid")

            let tmpURI = await instance.tokenURI(tokenId)
            assert.equal(tmpURI, `${baseURI}${uris[1]}`, "URI not valid")

            let tmpSupply = await instance.totalSupply(tokenId)
            assert.equal(tmpSupply, supplies[0] + supplies[1])
        })
    })

    describe('balanceOf', async () => {
        it("should revert when queried about the balance of the zero address.", async () => {
            try {
                let res = await ERC1155_mintRandomToken(instance, owner)
                let tokenID = res.logs[0].args.id

                await instance.balanceOf(ZERO_ADDRESS, tokenID)
                shouldNotPass()
            } catch (e) {
                shouldErrorContainMessage(e, ERC1155_BALANCE_QUERY_FOR_ZERO_ADDRESS)
            }
        })

        it("should return 0 for accounts that don't own the token.", async () => {
            let res = await ERC1155_mintRandomToken(instance, owner)
            let tokenID = res.logs[0].args.id

            let balance = await instance.balanceOf(notOwner, tokenID)
            assert.equal(balance.toNumber(), 0, "invalid balance")
        })

        it("should return the correct amount for accounts that own the token.", async () => {
            let numTokens = crypto.randomInt(100)
            let uri = crypto.randomBytes(32).toString('hex');
            const result = await ERC1155_mintToken(instance, owner, uri, numTokens)
            let packed = web3.eth.abi.encodeParameters(['address', 'string'],
                [owner, uri])
            let expectedTokenID = web3.utils.soliditySha3(packed)
            await mintShouldSucceed(instance, result, owner, expectedTokenID, numTokens, "", uri)

            let balance = await instance.balanceOf(owner, expectedTokenID)
            assert.equal(balance.toNumber(), numTokens, "invalid balance")
        })
    })

    describe('balanceOfBatch', async () => {
        it("should revert when queried about the balance of the zero address.", async () => {
            try {
                let res = await ERC1155_mintRandomToken(instance, owner)
                let tokenID = res.logs[0].args.id

                let tmpAccounts = new Array(2)
                let tmpIDs = new Array(2)

                tmpAccounts[0] = owner
                tmpAccounts[1] = ZERO_ADDRESS
                tmpIDs[0] = tokenID
                tmpIDs[1] = tokenID

                await instance.balanceOfBatch(tmpAccounts, tmpIDs)
                shouldNotPass()
            } catch (e) {
                shouldErrorContainMessage(e, ERC1155_BALANCE_QUERY_FOR_ZERO_ADDRESS)
            }
        })

        it("should return the correct amount.", async () => {
            let res = await ERC1155_mintRandomToken(instance, owner)
            let tokenID1 = res.logs[0].args.id
            let supply1 = res.logs[0].args.value
            res = await ERC1155_mintRandomToken(instance, anotherOwner)
            let tokenID2 = res.logs[0].args.id
            let supply2 = res.logs[0].args.value

            let tmpAccounts = new Array(2)
            let tmpIDs = new Array(2)

            tmpAccounts[0] = owner
            tmpAccounts[1] = anotherOwner
            tmpIDs[0] = tokenID1
            tmpIDs[1] = tokenID2

            let balances = await instance.balanceOfBatch(tmpAccounts, tmpIDs)
            assert.equal(balances[0].toNumber(), supply1.toNumber(), "invalid balance")
            assert.equal(balances[1].toNumber(), supply2.toNumber(), "invalid balance")
        })
    })

    describe("setApprovalForAll + isApprovedForAll", async () => {
        it('should set approval status', async () => {
            for (let i = 0; i < 10; i++) {
                let isApproved = crypto.randomInt(2) === 1
                // console.log(i, isApproved)
                let result = await instance.setApprovalForAll(operator, isApproved, {from: owner})

                await approveForAllShouldSucceed(instance, result, owner, operator, isApproved)
            }
        });

        it('should revert if attempting to approve self as an operator', async () => {
            try {
                let isApproved = crypto.randomInt(2) === 1
                await instance.setApprovalForAll(owner, isApproved, {from: owner})
                shouldNotPass()
            } catch (e) {
                shouldErrorContainMessage(e, ERC1155_SETTING_APPROVAL_FOR_SELF)
            }
        });
    })

    describe('safeTransferFrom', function () {
        it('should allow the owner to transfer his token', async () => {
            let supply = crypto.randomInt(10000)
            let res = await ERC1155_mintRandomToken(instance, owner, supply)
            let tokenID = res.logs[0].args.id
            let transferAmount = crypto.randomInt(supply)

            let result = await instance.safeTransferFrom(owner, newOwner, tokenID, transferAmount, '0x', {from: owner})
            await transferShouldSucceed(instance, result, owner, owner, newOwner, tokenID, supply, 0, transferAmount)
        });

        it('should allow an operator to transfer the token', async () => {
            let supply = crypto.randomInt(10000)
            let res = await ERC1155_mintRandomToken(instance, owner, supply)
            let tokenID = res.logs[0].args.id
            let transferAmount = crypto.randomInt(supply)

            await instance.setApprovalForAll(operator, true, {from: owner})

            let result = await instance.safeTransferFrom(owner, newOwner, tokenID, transferAmount, '0x', {from: operator})
            await transferShouldSucceed(instance, result, operator, owner, newOwner, tokenID, supply, 0, transferAmount)
        });

        it('should revert when transferring more than balance', async () => {
            let supply = crypto.randomInt(10000)
            let res = await ERC1155_mintRandomToken(instance, owner, supply)
            let tokenID = res.logs[0].args.id

            try {
                await instance.safeTransferFrom(owner, newOwner, tokenID, supply + 1, '0x')
            } catch (e) {
                shouldErrorContainMessage(e, ERC1155_INSUFFICIENT_BALANCE)
            }
        });

        it('should revert when transferring to the zero address', async () => {
            let supply = crypto.randomInt(10000)
            let res = await ERC1155_mintRandomToken(instance, owner, supply)
            let tokenID = res.logs[0].args.id

            try {
                await instance.safeTransferFrom(owner, ZERO_ADDRESS, tokenID, 1, '0x')
            } catch (e) {
                shouldErrorContainMessage(e, ERC1155_TRANSFER_TO_ZERO_ADDRESS)
            }
        });
    });
})
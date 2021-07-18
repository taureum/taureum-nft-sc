var crypto = require("crypto");
const {assert} = require('chai')
const Web3 = require('web3');
const TaureumNFT = artifacts.require("./TaureumERC721.sol")
const {addVerifiedUser} = require("./helper/kyc_helper")

const { BigNumber } = require("ethers");

const {
    ERC721_MINT_TO_ZERO_ADDRESS_ERROR,
    ERC721_BALANCE_QUERY_FOR_ZERO_ADDRESS,
    NOT_OWNER_OR_APPROVED,
    TOKEN_NOT_TRANSFERABLE,
    NFT_COUNT_MAX_EXCEEDED,
    URI_EXISTS,
    EXPIRY_DATE_NOT_VALID,
    NOT_CONTRACT_OWNER,
    shouldErrorContainMessage,
} = require("./helper/errors")

const {
    mintToken,
    mintRandomToken,
    wait
} = require("./helper/helper")

require('chai')
    .use(require('chai-as-promised'))
    .should()

contract('TaureumNFT', (accounts) => {
    let contract
    let web3

    let contractOwner = accounts[0]
    let notContractOwner = accounts[1]
    let verifiedUser = accounts[0]
    let anotherVerifiedUser = accounts[1]
    let notVerifiedUser = accounts[2]
    let newOwner = accounts[3]
    let approvedUser = accounts[4]
    let anotherApprovedUser = accounts[5]
    let notApprovedUser = accounts[6]
    let zeroAddress = '0x0000000000000000000000000000000000000000'

    before(async () => {
        web3 = new Web3("http://127.0.0.1:7545")

        await addVerifiedUser(anotherVerifiedUser)
        await addVerifiedUser(newOwner)
        await addVerifiedUser(approvedUser)
        await addVerifiedUser(anotherApprovedUser)

        contract = await TaureumNFT.deployed()
    })

    describe('deployment', async() => {
        it('deploy successfully', async()=> {
            const addr = await contract.address

            assert.notEqual(addr, "")
            assert.notEqual(addr, null)
            assert.notEqual(addr, undefined)
        })

        it('have a name', async()=> {
            const name = await contract.name()

            assert.equal(name, "Taureum NFT", "contract name invalid")
        })

        it('have a symbol', async()=> {
            const symbol = await contract.symbol()

            assert.equal(symbol, "Taureum", "contract symbol invalid")
        })
    })

    describe('minting', async() => {
        it("create a simple NFT", async() => {
            let uri = "aaaaababababababababababababababababa"
            let license = 1
            let expiryBlock = 10000000
            const result = await mintToken(contract, verifiedUser, uri, license, expiryBlock)
            let packed = await web3.eth.abi.encodeParameters(['address', 'string', 'uint8', 'uint256'],
                [verifiedUser, uri, license, expiryBlock])
            console.log(`pack`, packed)

            let expectedTokenID = web3.utils.soliditySha3(packed).toString('hex')
            console.log(`expectTokenID`, expectedTokenID)

            //SUCCESS
            const event = result.logs[0].args
            assert.equal(event.tokenId.toString('hex'), expectedTokenID.substring(2, 66), "id is incorrect")
            assert.equal(event.from, "0x0000000000000000000000000000000000000000", '_from is incorrect')
            assert.equal(event.to, verifiedUser, "to is incorrect")

            //Check tokenURI
            let tokenId = event.tokenId
            const tokenURI = await contract.tokenURI(tokenId)
            assert.equal(tokenURI, `ipfs://${uri}`, "tokenURI is invalid")

            //Check owner
            const owner = await contract.ownerOf(tokenId)
            assert.equal(owner, verifiedUser, "own is invalid")
        })

        it("should be valid for verified accounts", async() => {
            const count = await contract.balanceOf(verifiedUser)
            // console.log(`countNFT of ${verifiedUser}: ${count}`)
            for (let i = 1; i <= 10 - count; i++) {
                const result = await mintRandomToken(contract, verifiedUser, 1)
                // console.log(result)

                const event = result.logs[0].args
                assert.equal(event.from, "0x0000000000000000000000000000000000000000", 'from is incorrect')
                assert.equal(event.to, verifiedUser, "to is incorrect")

                const balance = await contract.balanceOf(verifiedUser)
                assert.equal(balance, parseInt(count) + parseInt(i), "balance is incorrect")
            }
        })

        it("the zero address cannot mint a new NFT", async() => {
            let license = crypto.randomInt(0, 2)
            try {
                await mintRandomToken(contract, zeroAddress, license)
                assert.equal(true, false, 'should not pass')
            } catch (error) {
                assert.equal(shouldErrorContainMessage(error, ERC721_BALANCE_QUERY_FOR_ZERO_ADDRESS), true)
            }
        })

        it("unVerifiedUser can only mint upto 10 NFTs", async() => {
            const count = await contract.balanceOf(notVerifiedUser)
            // console.log(`countNFT of the unVerifiedUser ${notVerifiedUser}: ${count}`)
            for (let i = 1; i <= 10 - count; i++) {
                const result = await mintRandomToken(contract, notVerifiedUser, crypto.randomInt(0, 2))

                const event = result.logs[0].args
                assert.equal(event.to, notVerifiedUser, "to is incorrect")

                const balance = await contract.balanceOf(notVerifiedUser)
                assert.equal(balance, parseInt(count) + parseInt(i), "balance is incorrect")
            }

            try {
                let license = crypto.randomInt(0, 2)
                await mintRandomToken(contract, notVerifiedUser, license)
                assert.equal(true, false, 'should not pass')
            } catch (error) {
                assert.equal(shouldErrorContainMessage(error, NFT_COUNT_MAX_EXCEEDED), true)
            }
        })

        it("mint with expiryDate prior to current timeStamp should be rejected", async() => {
            let uri = crypto.randomBytes(32).toString('hex');
            let blockTime = 5
            // set the token expire data to be 10 blocks from now
            let currentBlock = await web3.eth.getBlockNumber()
            let expiryDate = currentBlock - 1
            console.log(`\t currentBlock: ${currentBlock}, expiryBlock: ${expiryDate}`)
            try {
                await mintToken(contract, verifiedUser, uri, crypto.randomInt(0, 2), expiryDate);
                assert.equal(true, false, 'should not pass')
            } catch (error) {
                assert.equal(shouldErrorContainMessage(error, EXPIRY_DATE_NOT_VALID), true)
            }
        })
    })

    describe('transferring and approval', async () => {
        it("owner should be able to transfer its token", async() => {
            //mint a token to test
            const result = await mintRandomToken(contract, verifiedUser, 1)
            const event = result.logs[0].args
            let tokenId = event.tokenId

            //Transfer to another account
            await contract.transferFrom(verifiedUser, newOwner, tokenId)

            //Ownership of the token should be changed to newOwner
            tmpOwner = await contract.ownerOf(tokenId)
            assert.equal(tmpOwner, newOwner, "owner is invalid")
        })

        it("newOwner should be able to transfer a fully-licensed token", async() => {
            //mint a token to test
            const result = await mintRandomToken(contract, verifiedUser, 1)
            const event = result.logs[0].args
            let tokenId = event.tokenId

            //Transfer to another account
            await contract.transferFrom(verifiedUser, newOwner, tokenId)

            //Ownership of the token should be changed to newOwner
            tmpOwner = await contract.ownerOf(tokenId)
            assert.equal(tmpOwner, newOwner, "owner is invalid")

            //SUCCESS: newOwner should be able to transfer this token
            await contract.transferFrom(newOwner, anotherVerifiedUser, tokenId, {from: newOwner});

            //Ownership of this token now should be returned back to owner
            tmpOwner = await contract.ownerOf(tokenId)
            assert.equal(tmpOwner, anotherVerifiedUser, "owner is invalid")
        })

        it("oldOwner should not be able to transfer the previously-owned token", async() => {
            //mint a token to test
            const result = await mintRandomToken(contract, verifiedUser, 1)
            const event = result.logs[0].args
            let tokenId = event.tokenId

            //Transfer to another account
            await contract.transferFrom(verifiedUser, newOwner, tokenId)

            //Ownership of the token should be changed to newOwner
            tmpOwner = await contract.ownerOf(tokenId)
            assert.equal(tmpOwner, newOwner, "owner is invalid")

            //FAIL: owner cannot transfer this token since its ownership has been transferred to newOwner
            try {
                await contract.transferFrom(verifiedUser, newOwner, tokenId);
                assert.equal(true, false, 'should not pass')
            } catch(error) {
                // Should throw a NOT_OWNER_OR_APPROVED message
                assert.equal(shouldErrorContainMessage(error, NOT_OWNER_OR_APPROVED), true)
            }
        })

        it("newOwner should not be able to transfer a personal-licensed token", async() => {
            //mint a token to test
            const result = await mintRandomToken(contract, verifiedUser, 0)
            const event = result.logs[0].args
            let tokenId = event.tokenId

            //Transfer to another account
            await contract.transferFrom(verifiedUser, newOwner, tokenId)

            //Ownership of the token should be changed to newOwner
            tmpOwner = await contract.ownerOf(tokenId)
            assert.equal(tmpOwner, newOwner, "owner is invalid")

            //FAIL: newOwner cannot transfer this token since its is personal-licensed.
            try {
                await contract.transferFrom(newOwner, verifiedUser, tokenId, {from : newOwner});
                assert.equal(true, false, 'should not pass')
            } catch(error) {
                // Should throw a TOKEN_NOT_TRANSFERABLE message
                assert.equal(shouldErrorContainMessage(error, TOKEN_NOT_TRANSFERABLE), true)
            }
        })

        it("approvedUser should be able to transfer a token", async() => {
            //mint a token to test
            const result = await mintRandomToken(contract, verifiedUser, 1)
            const event = result.logs[0].args
            let tokenId = event.tokenId

            //Approve another user to transfer token
            await contract.approve(approvedUser, tokenId)

            //Transfer to another account
            await contract.transferFrom(verifiedUser, newOwner, tokenId, {from: approvedUser})

            //Ownership of the token should be changed to newOwner
            tmpOwner = await contract.ownerOf(tokenId)
            assert.equal(tmpOwner, newOwner, "owner is invalid")
        })

        it("unApprovedUser should not be able to transfer a token", async() => {
            //mint a token to test
            const result = await mintRandomToken(contract, verifiedUser, 1)
            const event = result.logs[0].args
            let tokenId = event.tokenId

            //Approve another user to transfer token
            await contract.approve(approvedUser, tokenId)

            //Transfer to another account
            try {
                await contract.transferFrom(verifiedUser, newOwner, tokenId, {from: notApprovedUser})
                assert.equal(true, false, 'should not pass')
            } catch (error) {
                // Should throw a NOT_OWNER_OR_APPROVED message
                assert.equal(shouldErrorContainMessage(error, NOT_OWNER_OR_APPROVED), true)
            }
        })

        it("approvedForAll user should be able to transfer all tokens of the approving user", async() => {
            //mint a token to test
            let result = await mintRandomToken(contract, verifiedUser, 1)
            let event = result.logs[0].args
            let tokenId1 = event.tokenId

            result = await mintRandomToken(contract, verifiedUser, 1)
            event = result.logs[0].args
            let tokenId2 = event.tokenId

            //Approve another user to transfer token
            await contract.setApprovalForAll(approvedUser, true, {from:verifiedUser})

            isApprovalForAll = await contract.isApprovedForAll(verifiedUser, approvedUser)
            assert.equal(isApprovalForAll, true, "should be approved for all")

            //Transfer to another account
            await contract.transferFrom(verifiedUser, newOwner, tokenId1, {from: approvedUser})
            //Ownership of the token should be changed to newOwner
            tmpOwner = await contract.ownerOf(tokenId1)
            assert.equal(tmpOwner, newOwner, "owner of tokenId2 is invalid")

            //Transfer to another account
            await contract.transferFrom(verifiedUser, newOwner, tokenId2, {from: approvedUser})
            //Ownership of the token should be changed to newOwner
            tmpOwner = await contract.ownerOf(tokenId2)
            assert.equal(tmpOwner, newOwner, "owner of tokenId2 is invalid")
        })

        it("revoking approvalForAll should work", async() => {
            //mint a token to test
            let result = await mintRandomToken(contract, verifiedUser, 1)
            let event = result.logs[0].args
            let tokenId1 = event.tokenId

            result = await mintRandomToken(contract, verifiedUser, 1)
            event = result.logs[0].args
            let tokenId2 = event.tokenId

            //Approve another user to transfer token
            await contract.setApprovalForAll(approvedUser, true, {from:verifiedUser})

            isApprovalForAll = await contract.isApprovedForAll(verifiedUser, approvedUser)
            assert.equal(isApprovalForAll, true, "should be approved for all")

            //Transfer to another account
            await contract.transferFrom(verifiedUser, newOwner, tokenId1, {from: approvedUser})
            //Ownership of the token should be changed to newOwner
            tmpOwner = await contract.ownerOf(tokenId1)
            assert.equal(tmpOwner, newOwner, "owner of tokenId2 is invalid")

            //Revoke another user to transfer token
            await contract.setApprovalForAll(approvedUser, false, {from:verifiedUser})

            //Transfer to another account
            try {
                await contract.transferFrom(verifiedUser, newOwner, tokenId2, {from: approvedUser})
                assert.equal(true, false, 'should not pass')
            } catch (error) {
                // Should throw a NOT_OWNER_OR_APPROVED message
                assert.equal(shouldErrorContainMessage(error, NOT_OWNER_OR_APPROVED), true)
            }
        })

        it("transferring an expired token should be rejected", async () => {
            let uri = crypto.randomBytes(32).toString('hex');
            let blockTime = 5
            // set the token expire data to be 10 blocks from now
            let currentBlock = await web3.eth.getBlockNumber()
            let expiryDate = currentBlock + 2
            console.log(`\t currentBlock: ${currentBlock}, expiryBlock: ${expiryDate}`)
            try {
                // mint should be successful
                const result = await mintToken(contract, verifiedUser, uri, 1, expiryDate);
                let event = result.logs[0].args
                let tokenId = event.tokenId

                // transfer this token to another user should also work
                await contract.transferFrom(verifiedUser, newOwner, tokenId, {from: verifiedUser})

                // sleep 10 blocks
                await wait(2 * blockTime * 1000)

                // transfer this token to another user should also work
                currentBlock = await web3.eth.getBlockNumber()
                console.log(`\t attempt to transfer at block ${currentBlock}`)
                await contract.transferFrom(newOwner, anotherVerifiedUser, tokenId, {from: newOwner})
                assert.equal(true, false, "should not pass")
            } catch (error) {
                assert.equal(shouldErrorContainMessage(error, TOKEN_NOT_TRANSFERABLE), true)
            }
        })
    })

    describe('KYC contract address', async () => {
        it("contract owner should be able to set new KYC contract address", async() => {
            //mint a token to test
            const currentKYCAddress = await contract.getKYCAddress()
            console.log(`\t currentKYCAddress: ${currentKYCAddress}`)

            //Contract owner should be able to set new KYC contract address
            let newKYCAddress = '0x20227ba0f3451438ff0311e9b67fcfa8e3ccd57a'
            await contract.setKYCImplementation(newKYCAddress)

            const tmpNewKYCAddress = await contract.getKYCAddress()
            console.log(`\t newKYCAddress: ${tmpNewKYCAddress}`)
            assert.equal(BigNumber.from(tmpNewKYCAddress).toString(),
                BigNumber.from(newKYCAddress).toString()    ,
                "KYC address is invalid")

            await contract.setKYCImplementation(currentKYCAddress)
        })

        it("not contract owner should not be able to set new KYC contract address", async() => {
            //mint a token to test
            const currentKYCAddress = await contract.getKYCAddress()
            console.log(`\t currentKYCAddress: ${currentKYCAddress}`)

            //Contract owner should be able to set new KYC contract address
            let newKYCAddress = '0x20227ba0f3451438ff0311e9b67fcfa8e3ccd57a'
            await contract.setKYCImplementation(newKYCAddress, {from: notContractOwner}).should.be.rejected;
        })


    })
})
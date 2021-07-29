var crypto = require("crypto");
const {assert, expect} = require('chai')
const {contractName, web3} = require("./helper/ERC721/load")
const {shouldSupportInterfaces} = require("./helper/ERC721/SupportsInterface.behaviors")
const {checkApproveEvent, checkTransferEvent, checkApprovalForAllEvent} = require("./helper/ERC721/events")

const {
    NOT_CONTRACT_OWNER,
    ERC721_METADATA_URI_QUERY_FOR_NONEXISTENT_TOKEN,
    shouldErrorContainMessage,
    shouldNotPass,
} = require("./helper/ERC721/errors")

const {
    ZERO_ADDRESS,
    mintToken,
    mintRandomToken,
} = require("./helper/ERC721/helper")

require('chai')
    .use(require('chai-as-promised'))
    .should()

contract('ERC721Metadata', (accounts) => {
    let instance

    let contractOwner = accounts[0]
    let notContractOwner = accounts[1]
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
            "ERC721Metadata",
        ]);
    })

    describe('deployment', async () => {
        it('have a name', async () => {
            const name = await instance.name()

            assert.equal(name, "Taureum ERC721", "instance name invalid")
        })

        it('have a symbol', async () => {
            const symbol = await instance.symbol()

            assert.equal(symbol, "Taureum", "instance symbol invalid")
        })
    })

    describe("URI", async () => {
        it("the contract owner can set new baseURI", async () => {
            let baseURI = crypto.randomBytes(32).toString("hex")
            await instance.setBaseURI(baseURI, {from: contractOwner})

            let actualBaseURI = await instance.baseURI()
            assert.equal(actualBaseURI, baseURI, "invalid baseURI")
        })

        it("not contract owner cannot set new baseURI", async () => {
            let baseURI = crypto.randomBytes(32).toString("hex")
            try {
                await instance.setBaseURI(baseURI, {from: notContractOwner})
                shouldNotPass()
            } catch (error) {
                shouldErrorContainMessage(error, NOT_CONTRACT_OWNER)
            }
        })

        it('base URI should be added as a prefix to the token URI', async function () {
            let baseURI = crypto.randomBytes(32).toString("hex")
            await instance.setBaseURI(baseURI, {from: contractOwner})

            let uri = crypto.randomBytes(32).toString("hex")
            let result = await mintToken(instance, contractOwner, uri)
            let tokenId = result.logs[0].args.tokenId

            let fullURI = await instance.tokenURI(tokenId)
            assert.equal(fullURI, `${baseURI}${uri}`)
        })

        it('cannot query the URI for non-existing token', async function () {
            try {
                let tokenId = crypto.randomBytes(32)
                let result = await instance.tokenURI(tokenId)
                shouldNotPass()
            } catch (e) {
                shouldErrorContainMessage(e, ERC721_METADATA_URI_QUERY_FOR_NONEXISTENT_TOKEN)
            }
        })
    })
})
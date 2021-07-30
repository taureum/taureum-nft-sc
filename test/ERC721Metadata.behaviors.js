const crypto = require("crypto");
const {assert} = require('chai')
const {contractName} = require("./helper/ERC721/load")
const {shouldSupportInterfaces} = require("./helper/ERC721/SupportsInterface.behaviors")

const {
    NOT_CONTRACT_OWNER,
    ERC721_METADATA_URI_QUERY_FOR_NONEXISTENT_TOKEN,
} = require("./helper/ERC721/errors")

const {
    shouldNotPass,
    shouldErrorContainMessage,
} = require("./helper/errors")

const {
    ERC721_mintToken,
} = require("./helper/helper")

require('chai')
    .use(require('chai-as-promised'))
    .should()

contract('ERC721Metadata', (accounts) => {
    let instance

    let contractOwner = accounts[0]
    let notContractOwner = accounts[1]

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
            let result = await ERC721_mintToken(instance, contractOwner, uri)
            let tokenId = result.logs[0].args.tokenId

            let fullURI = await instance.tokenURI(tokenId)
            assert.equal(fullURI, `${baseURI}${uri}`)
        })

        it('cannot query the URI for non-existing token', async function () {
            try {
                let tokenId = crypto.randomBytes(32)
                await instance.tokenURI(tokenId)
                shouldNotPass()
            } catch (e) {
                shouldErrorContainMessage(e, ERC721_METADATA_URI_QUERY_FOR_NONEXISTENT_TOKEN)
            }
        })
    })
})
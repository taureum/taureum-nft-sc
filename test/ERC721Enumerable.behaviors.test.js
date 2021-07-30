const {assert} = require('chai')
const {contractName} = require("./helper/ERC721/load")
const {shouldSupportInterfaces} = require("./helper/ERC721/SupportsInterface.behaviors")

const {
    ERC721_mintRandomToken,
} = require("./helper/helper")

require('chai')
    .use(require('chai-as-promised'))
    .should()

contract('ERC721Enumerable', (accounts) => {
    let instance

    let owner = accounts[0]

    before(async () => {
        instance = await contractName.deployed()
    })

    describe("supportsInterface", async () => {
        await shouldSupportInterfaces(contractName, ["ERC721Enumerable"])
    })

    describe('totalSupply', async() => {
        it('should return the correct total token supply when minting a new token', async()=> {
            let oldSupply = await instance.totalSupply()

            await ERC721_mintRandomToken(instance, owner)

            let newSupply = await instance.totalSupply()

            assert.equal(newSupply.toNumber(), oldSupply.toNumber() + 1, "invalid totalSupply")
        })
    })
})
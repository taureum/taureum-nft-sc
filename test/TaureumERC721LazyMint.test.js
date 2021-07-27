const {assert} = require('chai')
const Web3 = require('web3');
const contractInstance = artifacts.require("./TaureumNFTLazyMint.sol")
const {randomURI} = require("./helper/helper")
const {LazyMinter} = require("./helper/lazy-minter")

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

contract('TaureumNFTLazyMint', (accounts) => {
    let instance
    let web3
    let address

    let minter = accounts[0]
    let notMinter = accounts[1]
    let signer = accounts[2]
    let redeemer = accounts[3]
    let contractOwner = accounts[0]

    before(async () => {
        web3 = new Web3("http://127.0.0.1:7545")

        await addVerifiedUser(signer)

        instance = await contractInstance.deployed()
        address = await instance.address
    })

    describe('redeem', async() => {
        it('the minter should be able to call the `redeem` function', async()=> {
            let lm = new LazyMinter({contractAddress: address, signer: minter})
            let uri = randomURI()

            let lazyMintData = await lm.createLazyMintingData(uri)
            console.log("lazyMintData", lazyMintData)

            let result = await instance.redeem(minter, redeemer, uri, lazyMintData.signature)
            console.log("result", result)
        })
    })
})
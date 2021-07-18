// var crypto = require("crypto");
// const {assert} = require('chai')
// const Web3 = require('web3');
// const TaureumNFTLazyMint = artifacts.require("./TaureumNFTLazyMint.sol")
// const {addVerifiedUser} = require("./helper/kyc_helper")
//
// const { BigNumber } = require("ethers");
//
// const {
//     ERC721_MINT_TO_ZERO_ADDRESS_ERROR,
//     ERC721_BALANCE_QUERY_FOR_ZERO_ADDRESS,
//     NOT_OWNER_OR_APPROVED,
//     TOKEN_NOT_TRANSFERABLE,
//     NFT_COUNT_MAX_EXCEEDED,
//     URI_EXISTS,
//     EXPIRY_DATE_NOT_VALID,
//     NOT_CONTRACT_OWNER,
//     shouldErrorContainMessage,
// } = require("./helper/errors")
//
// const {
//     mintToken,
//     mintRandomToken,
//     wait
// } = require("./helper/helper")
//
// require('chai')
//     .use(require('chai-as-promised'))
//     .should()
//
// contract('TaureumNFTLazyMint', (accounts) => {
//     let contract
//     let web3
//
//     let minter = accounts[0]
//     let notMinter = accounts[1]
//     let signer = accounts[2]
//     let redeemer = accounts[3]
//     let contractOwner = accounts[0]
//
//     before(async () => {
//         web3 = new Web3("http://127.0.0.1:7545")
//
//         await addVerifiedUser(signer)
//
//         contract = await TaureumNFT.deployed()
//     })
//
//     describe('deployment', async() => {
//         it('the minter should be able to call the `redeem` function', async()=> {
//             const addr = await contract.address
//
//             assert.notEqual(addr, "")
//             assert.notEqual(addr, null)
//             assert.notEqual(addr, undefined)
//         })
//
//         it('have a name', async()=> {
//             const name = await contract.name()
//
//             assert.equal(name, "Taureum NFT", "contract name invalid")
//         })
//
//         it('have a symbol', async()=> {
//             const symbol = await contract.symbol()
//
//             assert.equal(symbol, "Taureum", "contract symbol invalid")
//         })
//     })
// })
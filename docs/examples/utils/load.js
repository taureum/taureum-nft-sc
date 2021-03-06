const Web3 = require('web3')
const provider = new Web3.providers.HttpProvider('https://data-seed-prebsc-1-s1.binance.org:8545')
const web3 = new Web3(provider)

const {walletAddress, loadKeys} = require('./load-keys')
loadKeys(web3)

const TaureumERC721ABI = require('../../../abi/TaureumERC721LazyMint.json').abi
const TaureumERC721Address = require('../../../config.json').deployed.testnet.TaureumERC721LazyMint
const TaureumERC721 = new web3.eth.Contract(TaureumERC721ABI, TaureumERC721Address);

const TaureumERC1155ABI = require('../../../abi/TaureumERC1155LazyMint.json').abi
const TaureumERC1155Address = require('../../../config.json').deployed.testnet.TaureumERC1155LazyMint
const TaureumERC1155 = new web3.eth.Contract(TaureumERC1155ABI, TaureumERC1155Address);

module.exports = {TaureumERC721, TaureumERC721Address, TaureumERC1155, TaureumERC1155Address, web3, walletAddress}
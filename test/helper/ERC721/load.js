const Web3 = require('web3');
const provider = new Web3.providers.HttpProvider("http://127.0.0.1:7545")
const web3 = new Web3(provider);

const contractName = artifacts.require("./TaureumERC721LazyMint.sol")
module.exports = {contractName, web3}
const Web3 = require('web3')
const provider = new Web3.providers.HttpProvider('https://data-seed-prebsc-1-s1.binance.org:8545')
const web3 = new Web3(provider)

var crypto = require("crypto");

const walletAddress = require('./config.json').walletAddress

const fs = require('fs');
const privateKey = fs.readFileSync("../../.secret").toString().trim(); // read the secret key of the account.
web3.eth.accounts.wallet.add({
    privateKey: privateKey,
    address: walletAddress
});

const TaureumERC721ABI = require('../../abi/TaureumERC721Enumerable.json').abi
const TaureumERC721Address = require('../../config.json').deployed.testnet.TaureumERC721Enumerable

var TaureumERC721 = new web3.eth.Contract(TaureumERC721ABI, TaureumERC721Address);


const mintRandomNFT = async(address) => {
    uri = crypto.randomBytes(20).toString('hex');
    gasEstimate = await TaureumERC721.methods.mint(
        address, uri
    ).estimateGas({ from: walletAddress });

    let res = await TaureumERC721.methods.mint(
        address, uri
    ).send({
        from: walletAddress,
        gas: gasEstimate
    })

    return res.events.Transfer.returnValues.tokenId
}

module.exports = {mintRandomNFT}

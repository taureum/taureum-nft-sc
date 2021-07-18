const Web3 = require('web3')
const provider = new Web3.providers.HttpProvider('https://data-seed-prebsc-1-s1.binance.org:8545')
const web3 = new Web3(provider)

var crypto = require("crypto");

const walletAddress = require('./config.json').walletAddress

const fs = require('fs');
const {BigNumber} = require("ethers");
const {mintRandomNFT} = require('./utils')
const privateKey = fs.readFileSync("../../.secret").toString().trim(); // read the secret key of the account.
web3.eth.accounts.wallet.add({
    privateKey: privateKey,
    address: walletAddress
});

const TaureumERC721ABI = require('../../abi/TaureumERC721.json').abi
const TaureumERC721Address = require('../../config.json').deployed.testnet.TaureumERC721

var TaureumERC721 = new web3.eth.Contract(TaureumERC721ABI, TaureumERC721Address);


(async () => {
    try {
        let id = await mintRandomNFT(walletAddress)
        console.log(`minted tokenId`, id)

        const gasEstimate = await TaureumERC721.methods.transferFrom(walletAddress, walletAddress, id).estimateGas(
            { from: walletAddress });
        console.log(`estimatedGas for transferFrom: ${gasEstimate}`)

        await TaureumERC721.methods.transferFrom(walletAddress, walletAddress, id)
            .send({
                from: walletAddress,
                gas: gasEstimate
            }).then((res) => {
                console.log(res.events)
            })
    } catch (e) {
        // This should return `Error: Returned error: execution reverted: User already has a proxy`
        console.log(e);
    }
})();

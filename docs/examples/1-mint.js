const Web3 = require('web3')
const provider = new Web3.providers.HttpProvider('https://data-seed-prebsc-1-s1.binance.org:8545')
const web3 = new Web3(provider)

var crypto = require("crypto");

const walletAddress = require('./config.json').walletAddress

const fs = require('fs');
const {BigNumber} = require("ethers");
const privateKey = fs.readFileSync("../../.secret").toString().trim(); // read the secret key of the account.
web3.eth.accounts.wallet.add({
    privateKey: privateKey,
    address: walletAddress
});

const TaureumERC721ABI = require('../../abi/TaureumERC721Enumerable.json').abi
const TaureumERC721Address = require('../../config.json').deployed.testnet.TaureumERC721Enumerable

var TaureumERC721 = new web3.eth.Contract(TaureumERC721ABI, TaureumERC721Address);


(async () => {
    try {
        let uri = crypto.randomBytes(20).toString('hex')

        let packed = web3.eth.abi.encodeParameters(['address', 'string'],
            [walletAddress, uri])
        let expectedTokenId = web3.utils.soliditySha3(packed).toString('hex')
        console.log(`expectedTokenId`, expectedTokenId)

        const gasEstimate = await TaureumERC721.methods.mint(walletAddress, uri).estimateGas(
            { from: walletAddress });
        console.log(`estimatedGas for minting: ${gasEstimate}`)

        let res = await TaureumERC721.methods.mint(walletAddress, uri)
            .send({
                from: walletAddress,
                gas: gasEstimate
            })
        tokenId = res.events.Transfer.returnValues.tokenId
        tokenId = BigNumber.from(tokenId)
        console.log(`tokenId`, tokenId.toHexString())
    } catch (e) {
        // This should return `Error: Returned error: execution reverted: User already has a proxy`
        console.log(e);
    }
})();

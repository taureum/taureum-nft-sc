const crypto = require("crypto");
const {web3, TaureumERC1155, walletAddress} = require("../utils/load");
const {BigNumber} = require("ethers");

(async () => {
    try {
        let uri = crypto.randomBytes(20).toString('hex')
        let amount = crypto.randomInt(1000)

        let packed = web3.eth.abi.encodeParameters(['address', 'string'],
            [walletAddress, uri])
        let expectedTokenId = web3.utils.soliditySha3(packed).toString('hex')
        console.log(`expectedTokenId`, expectedTokenId)

        const gasEstimate = await TaureumERC1155.methods.mint(walletAddress, uri, amount, "0x").estimateGas(
            { from: walletAddress });
        console.log(`estimatedGas for minting: ${gasEstimate}`)

        let res = await TaureumERC1155.methods.mint(walletAddress, uri, amount, "0x")
            .send({
                from: walletAddress,
                gas: gasEstimate
            })
        let tokenId = res.events.TransferSingle.returnValues.id
        tokenId = BigNumber.from(tokenId)
        console.log(`tokenId`, tokenId.toHexString())
    } catch (e) {
        // This should return `Error: Returned error: execution reverted: User already has a proxy`
        console.log(e);
    }
})();

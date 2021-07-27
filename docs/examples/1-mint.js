const crypto = require("crypto");
const {web3, TaureumERC721, walletAddress} = require("./utils/load");

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

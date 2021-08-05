const {TaureumERC721, TaureumERC721Address} = require("./utils/load");
const {sellerWalletAddress, buyerWalletAddress} = require("./utils/load-keys");
const {LazyMinter} = require("./utils/lazy-minter");
const {randomURI} = require("./utils/helper");

(async () => {
    try {
        let minter = sellerWalletAddress
        let redeemer = buyerWalletAddress

        let lm = new LazyMinter({contractAddress: TaureumERC721Address, signer: minter})
        let uri = randomURI()
        let lazyData = await lm.createLazyMintingData(uri)
        console.log("sig", lazyData.signature)

        const gasEstimate = await TaureumERC721.methods.redeem(redeemer, lazyData.uri, lazyData.signature).estimateGas(
            { from: minter });
        console.log(`estimatedGas for redeeming: ${gasEstimate}`)

        let res = await TaureumERC721.methods.redeem(redeemer, lazyData.uri, lazyData.signature)
            .send({
                from: minter,
                gas: gasEstimate
            })
        console.log("res", res)
    } catch (e) {
        console.log(e)
    }
})();

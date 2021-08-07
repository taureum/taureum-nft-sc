const crypto = require("crypto")
const {TaureumERC1155, TaureumERC1155Address} = require("../utils/load");
const {sellerWalletAddress, buyerWalletAddress} = require("../utils/load-keys");
const {ERC1155LazyMinter} = require("./utils/lazy-minter");
const {randomURI} = require("./utils/utils");

(async () => {
    try {
        let minter = sellerWalletAddress
        let redeemer = buyerWalletAddress

        let lm = new ERC1155LazyMinter({contractAddress: TaureumERC1155Address, signer: minter})
        let uri = randomURI()
        let amount = crypto.randomInt(10000)
        let lazyData = await lm.createLazyMintingData(uri, amount)

        const gasEstimate = await TaureumERC1155.methods.redeem(redeemer, lazyData.mintData).estimateGas(
            { from: minter });
        console.log(`estimatedGas for redeeming: ${gasEstimate}`)

        let res = await TaureumERC1155.methods.redeem(redeemer, lazyData.mintData)
            .send({
                from: minter,
                gas: gasEstimate
            })
        console.log("res", res)
    } catch (e) {
        console.log(e)
    }
})();

const {mintRandomNFT} = require("./utils/utils");
const {TaureumERC721, walletAddress} = require("./utils/load");

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

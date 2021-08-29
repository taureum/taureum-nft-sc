const {TaureumERC721, walletAddress} = require("../utils/load");

// to call this function, `walletAddress` must the the owner of the target contract.
(async () => {
    try {
        const gasEstimate = await TaureumERC721.methods.unPause().estimateGas(
            { from: walletAddress });
        console.log(`estimatedGas for pausing: ${gasEstimate}`)

        let res = await TaureumERC721.methods.unPause()
            .send({
                from: walletAddress,
                gas: gasEstimate
            })
        console.log(res.events)
    } catch (e) {
        // This should return `Error: Returned error: execution reverted: User already has a proxy`
        console.log(e);
    }
})();

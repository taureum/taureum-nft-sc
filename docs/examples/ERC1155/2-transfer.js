const {ERC1155_mintRandomToken} = require("./utils/utils");
const {TaureumERC1155, walletAddress} = require("../utils/load");

(async () => {
    try {
        let id = await ERC1155_mintRandomToken(walletAddress)
        console.log(`minted tokenId`, id)

        const gasEstimate = await TaureumERC1155.methods.safeTransferFrom(walletAddress, walletAddress, id, 2, 0).estimateGas(
            { from: walletAddress });
        console.log(`estimatedGas for safeTransferFrom: ${gasEstimate}`)

        await TaureumERC1155.methods.safeTransferFrom(walletAddress, walletAddress, id, 2, 0)
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

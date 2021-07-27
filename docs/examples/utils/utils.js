const crypto = require("crypto");
const {TaureumERC721} = require('./load')

const mintRandomNFT = async(address) => {
    let uri = crypto.randomBytes(20).toString('hex');
    let gasEstimate = await TaureumERC721.methods.mint(
        address, uri
    ).estimateGas({ from: address });

    let res = await TaureumERC721.methods.mint(
        address, uri
    ).send({
        from: address,
        gas: gasEstimate
    })

    return res.events.Transfer.returnValues.tokenId
}

module.exports = {mintRandomNFT}

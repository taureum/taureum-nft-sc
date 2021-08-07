const crypto = require("crypto");
const {TaureumERC721} = require('../../utils/load')

function randomURI() {
    return crypto.randomBytes(32).toString('hex');
}

const mintRandomNFT = async(address) => {
    let uri = randomURI()
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

module.exports = {mintRandomNFT, randomURI}

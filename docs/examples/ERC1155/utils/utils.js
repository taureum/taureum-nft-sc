const crypto = require("crypto");
const {TaureumERC1155} = require('../../utils/load')

function randomURI() {
    return crypto.randomBytes(32).toString('hex');
}

const ERC1155_mintRandomToken = async (address) => {
    let amount = crypto.randomInt(1000000000)
    let uri = randomURI()

    let gasEstimate = await TaureumERC1155.methods.mint(
        address, uri, amount, 0,
    ).estimateGas({ from: address });

    let res = await TaureumERC1155.methods.mint(
        address, uri, amount, 0,
    ).send({
        from: address,
        gas: gasEstimate
    })

    return res.events.TransferSingle.returnValues.id
}

module.exports = {randomURI, ERC1155_mintRandomToken}
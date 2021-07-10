const ERC721_MINT_TO_ZERO_ADDRESS_ERROR = "ERC721: mint to the zero address"
const ERC721_BALANCE_QUERY_FOR_ZERO_ADDRESS = "ERC721: balance query for the zero address"
const NOT_OWNER_OR_APPROVED = "ERC721: transfer caller is not owner nor approved"
const TOKEN_NOT_TRANSFERABLE = "TOKEN_NOT_TRANSFERABLE"

function shouldErrorContainMessage(error, message) {
    return error.message.search(`${message}`) > 0
}

module.exports = {
    ERC721_MINT_TO_ZERO_ADDRESS_ERROR,
    ERC721_BALANCE_QUERY_FOR_ZERO_ADDRESS,
    NOT_OWNER_OR_APPROVED,
    TOKEN_NOT_TRANSFERABLE,
    shouldErrorContainMessage
}
const ERC721_MINT_TO_ZERO_ADDRESS_ERROR = "ERC721: mint to the zero address"
const ERC721_TOKEN_ALREADY_MINTED = "ERC721: token already minted"
const ERC721_BALANCE_QUERY_FOR_ZERO_ADDRESS = "ERC721: balance query for the zero address"
const ERC721_OWNER_QUERY_FOR_NONEXISTENT_TOKEN = "ERC721: owner query for nonexistent token"
const ERC721_OPERATOR_QUERY_FOR_NONEXISTENT_TOKEN = "ERC721: operator query for nonexistent token"
const ERC721_TRANSFER_TO_ZERO_ADDRESS = "ERC721: transfer to the zero address"
const ERC721_MUST_BE_OWNER_OR_APPROVED = "MUST_BE_OWNER_OR_APPROVED"
const ERC721_NOT_OWNER_OR_APPROVED = "ERC721: transfer caller is not owner nor approved"
const NOT_CONTRACT_OWNER = "Ownable: caller is not the owner"

const REVERT_ERROR_MESSAGE = "should contain error"
const REVERT_MESSAGE = "should not pass"

function shouldErrorContainMessage(error, message) {
    return error.message.search(`${message}`) > 0
}

module.exports = {
    ERC721_MINT_TO_ZERO_ADDRESS_ERROR,
    ERC721_TOKEN_ALREADY_MINTED,
    ERC721_BALANCE_QUERY_FOR_ZERO_ADDRESS,
    ERC721_OWNER_QUERY_FOR_NONEXISTENT_TOKEN,
    ERC721_OPERATOR_QUERY_FOR_NONEXISTENT_TOKEN,
    ERC721_TRANSFER_TO_ZERO_ADDRESS,
    ERC721_MUST_BE_OWNER_OR_APPROVED,
    ERC721_NOT_OWNER_OR_APPROVED,
    NOT_CONTRACT_OWNER,
    REVERT_ERROR_MESSAGE,
    REVERT_MESSAGE,
    shouldErrorContainMessage
}
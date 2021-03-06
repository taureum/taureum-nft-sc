const ERC1155_TOKEN_EXISTED = "ERC1155: token already minted"
const ERC1155_MINT_TO_ZERO_ADDRESS = "ERC1155: mint to the zero address"
const ERC1155_TRANSFER_TO_ZERO_ADDRESS = "ERC1155: transfer to the zero address"
const ERC1155_BALANCE_QUERY_FOR_ZERO_ADDRESS = "ERC1155: balance query for the zero address"
const ERC1155_SETTING_APPROVAL_FOR_SELF = "ERC1155: setting approval status for self"
const ERC1155_INSUFFICIENT_BALANCE = "ERC1155: insufficient balance for transfer"
const ERC1155_NOT_CREATOR_OR_APPROVED = "ERC1155: caller is not creator nor approved"
const ERC1155_ALREADY_REDEEMED = "ERC1155: mint data already redeemed"
const ERC1155_PAUSED = "ERC1155Pausable: token transfer while paused"

module.exports = {
    ERC1155_TOKEN_EXISTED,
    ERC1155_MINT_TO_ZERO_ADDRESS,
    ERC1155_TRANSFER_TO_ZERO_ADDRESS,
    ERC1155_BALANCE_QUERY_FOR_ZERO_ADDRESS,
    ERC1155_SETTING_APPROVAL_FOR_SELF,
    ERC1155_INSUFFICIENT_BALANCE,
    ERC1155_NOT_CREATOR_OR_APPROVED,
    ERC1155_ALREADY_REDEEMED,
    ERC1155_PAUSED,
}
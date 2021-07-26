// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.4;

import "./lib/access/AccessControl.sol";
import "./lib/utils/cryptography/ECDSA.sol";
import "./lib/utils/cryptography/draft-EIP712.sol";
import "./TaureumERC721Enumerable.sol";

contract TaureumNFTLazyMint is TaureumERC721Enumerable, EIP712, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    string private constant SIGNING_DOMAIN = "TaureumNFT";
    string private constant SIGNATURE_VERSION = "1";

    /**
     * @dev Emitted when a pending token is redeemed in the lazy-minting protocol.
     */
    event Redeem(
        address indexed minter,
        address indexed redeemer,
        string uri,
        bytes signature);

    /**
     * @dev Create a new TaureumNFTLazyMint contract and and assign `DEFAULT_ADMIN_ROLE, MINTER_ROLE` for the creator.
     * This construction function should be called from an exchange.
     *
     */
    constructor(address exchange) TaureumERC721Enumerable() EIP712(SIGNING_DOMAIN, SIGNATURE_VERSION)
    {
        _setupRole(MINTER_ROLE, exchange);
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(TaureumERC721Enumerable, AccessControl) returns (bool) {
        return
        super.supportsInterface(interfaceId);
    }

    /**
     * @dev Implement a lazy minting mechanism in which the NFT-minting process is delayed until the first order is successful.
     * This function should be handled by a smart contract which creates this contract.
     * @notice It throws if
     *      - `msg.sender` does not have the `MINTER_ROLE`.
     *      - redeem data and signature are not valid.
     * @param minter The address that the sells this NFT, or the first of owner of the NFT.
     * @param redeemer The address that the minted NFT will be transferred to.
     * @param uri The URI consists of metadata description of the minting NFT on the IPFS (without prefix).
     * @param signature The signature signed by `to` designating `msg.sender` to mint the NFT for it.
     */
    function redeem(address minter, address redeemer, string calldata uri, bytes calldata signature)
    external
    {
        require(minter == _verify(_hash(uri), signature));
        require(hasRole(MINTER_ROLE, minter), "INVALID_MINTER_ROLE");

        // mint the token to the signer
        uint256 id = mint(minter, uri);

        // transfer the minted token to the redeemer
        _transfer(minter, redeemer, id);

        emit Redeem(minter, redeemer, uri, signature);
    }

    /// @notice Returns a hash of the given PendingNFT, prepared using EIP712 typed data hashing rules.
    function _hash(string calldata uri)
    internal view returns (bytes32)
    {
        return _hashTypedDataV4(keccak256(abi.encode(
                keccak256("TaureumNFT(string uri)"),
                keccak256(bytes(uri))
            )));
    }

    /**
     * @dev Returns the signer for a pair of digested message and singature.
     */
    function _verify(bytes32 digest, bytes memory signature)
    internal pure returns (address)
    {
        return ECDSA.recover(digest, signature);
    }
}

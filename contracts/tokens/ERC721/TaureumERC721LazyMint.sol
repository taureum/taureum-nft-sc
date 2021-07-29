// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.4;

import "./TaureumERC721Enumerable.sol";
import "../../lib/utils/cryptography/draft-EIP712.sol";

contract TaureumERC721LazyMint is TaureumERC721Enumerable, EIP712 {
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
    constructor() TaureumERC721Enumerable() EIP712(SIGNING_DOMAIN, SIGNATURE_VERSION)
    {}

    /**
     * @dev Implement a lazy minting mechanism in which the NFT-minting process is delayed until the first order is successful.
     * This function should be handled by a smart contract which is allowed by the `minter`.
     * @notice It throws if
     *      - `msg.sender` is not the `minter` or has not been approved by the `minter`.
     *      - redeem data and signature are not valid.
     *      - if the redeemer is a contract and it cannot receive the NFT.
     * @param redeemer The address that the minted NFT will be transferred to.
     * @param uri The URI consists of metadata description of the minting NFT on the IPFS (without prefix).
     * @param signature The signature signed by `to` designating `msg.sender` to mint the NFT for it.
     */
    function redeem(address redeemer, string calldata uri, bytes calldata signature)
    external
    {
        address minter = _verify(_hash(uri), signature);
        require(msg.sender == minter || isApprovedForAll(minter, msg.sender), "MUST_BE_OWNER_OR_APPROVED");

        // mint the token to the signer
        uint256 id = mint(minter, uri);

        // transfer the minted token to the redeemer
        _safeTransfer(minter, redeemer, id, "");

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
     * @dev Returns the signer for a pair of digested message and signature.
     */
    function _verify(bytes32 digest, bytes memory signature)
    internal pure returns (address)
    {
        bytes memory prefix = "\x19Ethereum Signed Message:\n32";
        bytes32 prefixedHash = keccak256(abi.encodePacked(prefix, digest));
        return ECDSA.recover(prefixedHash, signature);
    }
}

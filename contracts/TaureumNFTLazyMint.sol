// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.4;
//
//import "./TaureumERC721.sol";
//import "./lib/access/AccessControl.sol";
//import "./ITaureumKYC.sol";
//import "./lib/utils/cryptography/ECDSA.sol";
//import "./lib/utils/cryptography/draft-EIP712.sol";
//
//contract TaureumNFTLazyMint is TaureumERC721, EIP712, AccessControl {
//    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
//    string private constant SIGNING_DOMAIN = "LazyTaureumNFT";
//    string private constant SIGNATURE_VERSION = "1";
//
//    /**
//     * @dev Emitted when a pending token is redeemed in the lazy-minting protocol.
//     */
//    event Redeem(
//        address indexed redeemer,
//        address indexed firstOwner,
//        string uri,
//        uint8 license,
//        uint expiryDate,
//        bytes signature);
//
//    /**
//     * @dev Create a new TaureumNFTLazyMint contract and and assign `MINTER_ROLE` for the creator.
//     * This construction function should be called from an exchange.
//     *
//     */
//    constructor(address KYCAddress) TaureumERC721(KYCAddress) EIP712(SIGNING_DOMAIN, SIGNATURE_VERSION)
//    {
//        _setupRole(MINTER_ROLE, msg.sender);
//    }
//
//    /**
//     * @dev See {IERC165-supportsInterface}.
//     */
//    function supportsInterface(bytes4 interfaceId) public view virtual override(TaureumERC721, AccessControl) returns (bool) {
//        return
//        interfaceId == type(IERC721).interfaceId ||
//        interfaceId == type(IERC721Metadata).interfaceId ||
//        interfaceId == type(IAccessControl).interfaceId ||
//        super.supportsInterface(interfaceId);
//    }
//
//    /**
//     * @dev Implement a lazy minting mechanism in which the NFT-minting process is delayed until the first order is successful.
//     * This function should be handled by a smart contract which creates this contract.
//     * @notice It throws if
//     *      - `to` does not have the `MINTER_ROLE`.
//     *      - redeem data and signature are not valid.
//     * @param redeemer The address that the minted NFT will be transferred to.
//     * @param firstOwner The address that the sells this NFT.
//     * @param uri The URI consists of metadata description of the minting NFT on the IPFS (without prefix).
//     * @param license The license of the minting NFT (0 - personally-licensed or 1 - fully-licensed).
//     * @param expiryDate The block number at which the minting NFT is expired.
//     * @param signature The signature signed by `to` designating `msg.sender` to mint the NFT for it.
//     */
//    function redeem(address redeemer, address firstOwner, string calldata uri, uint8 license, uint expiryDate, bytes calldata signature)
//    external notExists(uri) canReceiveNFT(redeemer)
//    {
//        require(hasRole(MINTER_ROLE, msg.sender), "REQUIRE_MINTER_ROLE");
//        require(_verify(firstOwner, _hash(uri, license, expiryDate), signature), "Invalid signature");
//
//        // mint the token to the signer
//        uint256 id = _mint(firstOwner, uri, license, expiryDate);
//
//        // transfer the minted token to the redeemer
//        _transfer(firstOwner, redeemer, id);
//
//        emit Redeem(redeemer, firstOwner, uri, license, expiryDate, signature);
//    }
//
//    /// @notice Returns a hash of the given PendingNFT, prepared using EIP712 typed data hashing rules.
//    function _hash(string calldata uri, uint8 license, uint256 expiryDate)
//    internal view returns (bytes32)
//    {
//        return _hashTypedDataV4(keccak256(abi.encode(
//                keccak256("NFTVoucher(string uri,uint8 license,uint256 expiryDate)"),
//                keccak256(bytes(uri)),
//                license,
//                expiryDate
//            )));
//    }
//
//    /**
//     * @dev Check if the signature is valid for the digested-message.
//     */
//    function _verify(address signer, bytes32 digest, bytes memory signature)
//    internal pure returns (bool)
//    {
//        return signer == ECDSA.recover(digest, signature);
//    }
//}

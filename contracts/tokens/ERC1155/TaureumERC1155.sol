// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.4;

import "../../lib/token/ERC1155/ERC1155.sol";
import "../../lib/token/ERC1155/extensions/ERC1155Supply.sol";
import "../../lib/access/Ownable.sol";

contract TaureumERC1155 is ERC1155Supply, Ownable {
    /**
     * @dev Mapping from NFT ID to metadata uri.
     */
    mapping(uint256 => string) internal idToUri;

    /**
     * @dev Create a new TaureumERC1155 contract and set the `_uri` value.
     *
     */
    constructor(string memory uri_) ERC1155(uri_) Ownable() {
    }

    /**
     * @dev Mint a new ERC1155 token. A token can only be minted once.
     */
    function mint(
        address to,
        string calldata uri,
        uint256 supply,
        bytes memory data
    ) external returns (uint256){
        uint256 id = uint256(keccak256(abi.encode(to, uri)));
//        require(!exists(id), "ERC1155: token already minted");

        _mint(to, id, supply, data);
        _setTokenUri(id, uri);

        return id;
    }

    /**
     * @dev Mint a batch of tokens.
     */
    function mintBatch(
        address to,
        string[] calldata uriList,
        uint256[] calldata supplies,
        bytes memory data
    ) external returns (uint256[] memory) {
        require(uriList.length == supplies.length, "ERC1155: mintBatch lengths mismatch");

        uint256[] memory ids = new uint256[](uriList.length);
        for (uint256 i = 0; i < uriList.length; ++i) {
            ids[i] = uint256(keccak256(abi.encode(to, uriList[i])));
        }

        _mintBatch(to, ids, supplies, data);
        for (uint256 i = 0; i < uriList.length; ++i) {
            _setTokenUri(ids[i], uriList[i]);
        }

        return ids;
    }

    /**
     * @dev Sets a new URI for all token types, by relying on the token type ID
     * substitution mechanism
     * https://eips.ethereum.org/EIPS/eip-1155#metadata[defined in the EIP].
     *
     * By this mechanism, any occurrence of the `\{id\}` substring in either the
     * URI or any of the amounts in the JSON file at said URI will be replaced by
     * clients with the token type ID.
     *
     * For example, the `https://token-cdn-domain/\{id\}.json` URI would be
     * interpreted by clients as
     * `https://token-cdn-domain/000000000000000000000000000000000000000000000000000000000004cce0.json`
     * for token type ID 0x4cce0.
     *
     * See {uri}.
     *
     * Because these URIs cannot be meaningfully represented by the {URI} event,
     * this function emits no events.
     */
    function setURI(string memory newURI) external onlyOwner {
        _setURI(newURI);
    }

    /**
     * @dev Return the URI of a tokenId.
     */
    function tokenURI(uint256 tokenId) public view virtual returns (string memory) {
        require(exists(tokenId), "ERC1155: URI query for nonexistent token");

        string memory baseURI = uri(tokenId);

        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, idToUri[tokenId])) : idToUri[tokenId];
    }

    /**
     * @dev Set a distinct URI (RFC 3986) for a given NFT ID.
     * @notice This is an internal function which should be called from user-implemented external
     * function.
     * @notice It throws an exception if the _tokenId does not exist.
     * @param tokenId_ Id for which we want URI.
     * @param uri_ String representing RFC 3986 URI.
     */
    function _setTokenUri(
        uint256 tokenId_,
        string calldata uri_
    )
    internal
    {
        require(exists(tokenId_), "ERC1155: URI query for nonexistent token");
        idToUri[tokenId_] = uri_;
    }

}

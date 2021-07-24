// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.4;

import "./lib/token/ERC721/ERC721.sol";
import "./lib/token/ERC721/extensions/ERC721Enumerable.sol";
import "./lib/access/Ownable.sol";

contract TaureumERC721Enumerable is ERC721, ERC721Enumerable, Ownable {
    /**
     * @dev Mapping from NFT ID to metadata uri.
     */
    mapping(uint256 => string) internal idToUri;

    /**
     * @dev Create a new TaureumERC721 contract and assign the KYCAddress to _KYCAddress.
     *
     * TODO: change the default name and symbol.
     */
    constructor() ERC721("Taureum ERC721Enumerable", "Taureum") Ownable() {
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, ERC721Enumerable) returns (bool) {
        return
        interfaceId == type(IERC721).interfaceId ||
        interfaceId == type(IERC721Metadata).interfaceId ||
        super.supportsInterface(interfaceId);
    }

    /**
      * @dev Mint a new NFT.
      * @notice It throws an exception if
      *    - `to` cannot receive NFTs.
      * @param to The address that will own the minted NFT.
      * @param uri The URI consists of metadata description of the minting NFT on the IPFS (without prefix).
      */
    function mint(
        address to,
        string calldata uri
    )
    public
    returns (uint256)
    {
        require(to != address(0), "ZERO_ADDRESS");
        return _mint(to, uri);
    }

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

        string memory baseURI = _baseURI();
        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, idToUri[tokenId])) : idToUri[tokenId];
    }

    /**
     * @dev See {IERC721-transferFrom}.
     * @notice It throws an exception if
     *      - the tokenId is not transferable.
     *      - the receiver `to` cannot receive more TaureumNFTs.
     */
    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override {
        //solhint-disable-next-line max-line-length
        require(_isApprovedOrOwner(_msgSender(), tokenId), "ERC721: transfer caller is not owner nor approved");
        _transfer(from, to, tokenId);
    }

    /**
     * @dev See {IERC721-safeTransferFrom}.
     * @notice It throws an exception if
     *      - the tokenId is not transferable.
     *      - the receiver `to` cannot receive more TaureumNFTs.
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory _data
    ) public override {
        require(_isApprovedOrOwner(_msgSender(), tokenId), "ERC721: transfer caller is not owner nor approved");
        _safeTransfer(from, to, tokenId, _data);
    }

    /**
      * @dev Mint a new NFT.
      * @notice It throws an exception if
      *    - `license` is not valid.
      *    - `expiryBlock` is less than the current block number.
      * @param to The address that will own the minted NFT.
      * @param uri The URI consists of metadata description of the minting NFT on the IPFS (without prefix).
      */
    function _mint(
        address to,
        string calldata uri
    )
    internal
    returns (uint256)
    {
        uint256 id = uint256(keccak256(abi.encode(to, uri)));

        super._mint(to, id);
        _setTokenUri(id, uri);

        return id;
    }

    /**
     * @dev Hook that is called before any token transfer. This includes minting
     * and burning.
     *
     * Calling conditions:
     *
     * - When `from` and `to` are both non-zero, ``from``'s `tokenId` will be
     * transferred to `to`.
     * - When `from` is zero, `tokenId` will be minted for `to`.
     * - When `to` is zero, ``from``'s `tokenId` will be burned.
     * - `from` cannot be the zero address.
     * - `to` cannot be the zero address.
     *
     * To learn more about hooks, head to xref:ROOT:extending-contracts.adoc#using-hooks[Using Hooks].
     */
    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    /**
     * @dev Base URI for computing {tokenURI}. If set, the resulting URI for each
     * token will be the concatenation of the `baseURI` and the `tokenId`.
     */
    function _baseURI() internal pure override returns (string memory) {
        return "ipfs://";
    }

    /**
     * @dev Set a distinct URI (RFC 3986) for a given NFT ID.
     * @notice This is an internal function which should be called from user-implemented external
     * function.
     * @notice It throws an exception if the _tokenId does not exist.
     * @param _tokenId Id for which we want URI.
     * @param _uri String representing RFC 3986 URI.
     */
    function _setTokenUri(
        uint256 _tokenId,
        string calldata _uri
    )
    internal
    {
        require(_exists(_tokenId), "TOKEN_ID_NOT_EXISTED");
        idToUri[_tokenId] = _uri;
    }
}

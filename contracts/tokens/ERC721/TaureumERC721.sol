// SPDX-License-Identifier: UNLICENSED

pragma solidity 0.8.4;

import "../../lib/token/ERC721/ERC721.sol";
import "../../lib/access/Ownable.sol";

contract TaureumERC721 is ERC721, Ownable {
    /**
     * @dev Mapping from NFT ID to metadata uri.
     */
    mapping(uint256 => string) internal idToUri;

    /**
     * @dev The base URI for all NFT.
     */
    string private __baseURI;

    /**
     * @dev Create a new TaureumERC721 contract.
     *
     */
    constructor() ERC721("Taureum ERC721", "Taureum") Ownable() {
        __baseURI = "";
    }

    /**
      * @dev Safely mint a new NFT.
      * @notice It throws an exception if
      *    - `to` is a "ZERO_ADDRESS.
      *    - If `to` refers to a smart contract, it must implement {IERC721Receiver-onERC721Received}, which is called upon a safe transfer.
      * @param to The address that will own the minted NFT.
      * @param uri The URI consists of metadata description of the minting NFT on the IPFS (without prefix).
      */
    function safeMint(
        address to,
        string calldata uri
    )
    public
    returns (uint256)
    {
        uint256 id = uint256(keccak256(abi.encode(to, uri)));

        _safeMint(to, id);
        _setTokenUri(id, uri);

        return id;
    }

    /**
      * @dev Mint a new NFT.
      * @notice It throws an exception if
      *    - `to` is a "ZERO_ADDRESS.
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
        uint256 id = uint256(keccak256(abi.encode(to, uri)));

        _mint(to, id);
        _setTokenUri(id, uri);

        return id;
    }

    /**
     * @dev See {IERC721Metadata-tokenURI}.
     */
    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

        return bytes(__baseURI).length > 0 ? string(abi.encodePacked(__baseURI, idToUri[tokenId])) : idToUri[tokenId];
    }

    /**
     * @dev Sets new value for the `__baseURI`. This operation can only been done by the owner of this contract.
     */
    function setBaseURI(string memory newBaseURI) external onlyOwner {
        __baseURI = newBaseURI;
    }

    /**
     * @dev Returns `__baseURI`.
     */
    function baseURI() external view returns(string memory) {
        return __baseURI;
    }

    /**
     * @dev Base URI for computing {tokenURI}. If set, the resulting URI for each
     * token will be the concatenation of the `baseURI` and the `tokenId`.
     */
    function _baseURI() internal view virtual override returns (string memory) {
        return __baseURI;
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

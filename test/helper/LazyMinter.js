const ethers = require('ethers')

// These constants must match the ones used in the smart contract.
const SIGNING_DOMAIN_NAME = "LazyNFT-Voucher"
const SIGNING_DOMAIN_VERSION = "1"

/**
 * JSDoc typedefs.
 *
 * @typedef {object} PendingNFT
 * @property {string} uri the metadata URI to associate with this NFT
 * @property {ethers.BigNumber | number } license the license type of this NFT
 * @property {ethers.BigNumber | number } expiryDate the expired date of this NFT measured by the block number
 * @property {ethers.BytesLike} signature an EIP-712 signature of all fields in the PendingNFT, apart from signature itself.
 */

/**
 * LazyMinter is a helper class that creates NFTVoucher objects and signs them, to be redeemed later by the LazyNFT contract.
 */
class LazyMinter {

    /**
     * Create a new LazyMinter targeting a deployed instance of the LazyNFT contract.
     *
     * @param {Object} options
     * @param {string} contractAddress the address of the deployed LazyNFT contract
     * @param {ethers.Signer} signer a Signer whose account is authorized to mint NFTs on the deployed contract
     */
    constructor({contractAddress, signer}) {
        this.contractAddress = contractAddress
        this.signer = signer
    }

    /**
     * Creates a new PendingNFT object and signs it using this LazyMinter's signing key.
     *
     * @param {string} uri the metadata URI to associate with this NFT
     * @param {ethers.BigNumber | number } license the license type of this NFT. Defaults to 1.
     * @param {ethers.BigNumber | number } expiryDate the expired date of this NFT measured by the block number.
     *
     * @returns {PendingNFT}
     */
    async createPendingNFT(uri, expiryDate, license = 1) {
        const voucher = {uri, license, expiryDate}
        const domain = await this._signingDomain()
        const types = {
            PendingNFT: [
                {name: "uri", type: "string"},
                {name: "license", type: "uint8"},
                {name: "expiryDate", type: "uint256"},
            ]
        }
        const signature = await this.signer._signTypedData(domain, types, voucher)
        return {
            ...voucher,
            signature,
        }
    }

    /**
     * @private
     * @returns {object} the EIP-721 signing domain, tied to the chainId of the signer
     */
    async _signingDomain() {
        if (this._domain != null) {
            return this._domain
        }
        const chainId = await this.signer.getChainId()
        this._domain = {
            name: SIGNING_DOMAIN_NAME,
            version: SIGNING_DOMAIN_VERSION,
            verifyingContract: this.contractAddress,
            chainId,
        }
        return this._domain
    }
}

module.exports = {
    LazyMinter
}
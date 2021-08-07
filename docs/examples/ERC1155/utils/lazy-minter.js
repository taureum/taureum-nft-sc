const crypto = require("crypto");
const {web3} = require("../../utils/load")

class ERC1155LazyMinter {
    constructor({contractAddress, signer}) {
        this.contractAddress = contractAddress
        this.signer = signer
        this.hashedName = web3.utils.soliditySha3({type: "string", value: "TaureumERC1155"})
        this.hashedVersion = web3.utils.soliditySha3({type: "string", value: "1"})
        this.typeHash = web3.utils.soliditySha3("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)")
    }

    async _buildDomainSeparator() {
        this.chainId = await web3.eth.getChainId()
        let packed = web3.eth.abi.encodeParameters(
            ["bytes32", "bytes32", "bytes32", "uint256", "address"],
            [this.typeHash, this.hashedName, this.hashedVersion, this.chainId, this.contractAddress]
        )
        return web3.utils.soliditySha3(packed)
    }

    async _toTypedDataHash(digest) {
        let domainSeparator = await this._buildDomainSeparator()
        return web3.utils.soliditySha3(
            "\x19\x01", domainSeparator, digest
        )
    }

    async _getStructHash(uri, amount, salt) {
        let packed = web3.eth.abi.encodeParameters(
            ["bytes32", "bytes32", "uint256", "uint256"],
            [
                web3.utils.soliditySha3("TaureumERC1155(string uri,uint256 amount,uint256 salt)"),
                web3.utils.soliditySha3(uri),
                amount,
                salt,
            ],
        )
        return web3.utils.soliditySha3(packed)
    }

    async createLazyMintingData(uri, amount) {
        let expectedTokenId = web3.utils.soliditySha3(web3.eth.abi.encodeParameters(['address', 'string'],
            [this.signer, uri]))
        let salt = crypto.randomBytes(32)

        const structHash = await this._getStructHash(uri, amount, salt)
        const typedDataHash = await this._toTypedDataHash(structHash)

        let signature = await web3.eth.sign(typedDataHash, this.signer)
        let mintData = {tokenURI: uri, amount: amount, salt: salt, signature: signature}
        return {
            mintData,
            expectedTokenId,
            signature,
            typedDataHash,
        }
    }
}

module.exports = {
    ERC1155LazyMinter
}
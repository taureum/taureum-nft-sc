const Web3 = require("web3")
const {randomURI} = require("./helper")
const {web3} = require("./load")

class LazyMinter {
    constructor({contractAddress, signer}) {
        this.contractAddress = contractAddress
        this.signer = signer
        this.hashedName = web3.utils.soliditySha3({type: "string", value: "TaureumNFT"})
        this.hashedVersion = web3.utils.soliditySha3({type: "string", value: "1"})
        this.typeHash = web3.utils.soliditySha3("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)")
    }

    async _buildDomainSeparator() {
        this.chainId = 1
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

    async _getStructHash(uri) {
        let packed = web3.eth.abi.encodeParameters(
            ["bytes32", "bytes32"],
            [web3.utils.soliditySha3("TaureumNFT(string uri)"), web3.utils.soliditySha3(uri)]
        )
        return web3.utils.soliditySha3(packed)
    }

    async createLazyMintingData(uri) {
        let expectedTokenId = web3.utils.soliditySha3(web3.eth.abi.encodeParameters(['address', 'string'],
            [this.signer, uri]))

        const structHash = await this._getStructHash(uri)
        const typedDataHash = await this._toTypedDataHash(structHash)

        let signature = await web3.eth.sign(typedDataHash, this.signer)
        let v = parseInt(signature.substr(130), 16) + 27
        signature = signature.substr(0, 130).concat(v.toString(16))
        return {
            uri,
            expectedTokenId,
            signature,
            typedDataHash,
        }
    }
}

const randomRedeemData = async (contractAddress, signer) => {
    let lm = new LazyMinter({contractAddress: contractAddress, signer: signer});
    let uri = randomURI()

    return await lm.createLazyMintingData(uri)
}

module.exports = {
    LazyMinter,
    randomRedeemData
}
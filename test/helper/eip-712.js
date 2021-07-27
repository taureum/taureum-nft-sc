const Web3 = require("web3")
const web3 = new Web3()

const typeHash = web3.utils.soliditySha3("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)")
const hashedName = web3.utils.soliditySha3("TaureumNFT")
const hashedVersion = web3.utils.soliditySha3(1)

const buildDomainSeparator = (chainId, atAddress) => {
    let packed = web3.eth.abi.encodeParameters(
        ["bytes32", "bytes32", "bytes32", "uint256", "address"], [typeHash, hashedName, hashedVersion, chainId, atAddress]
    )

    return web3.utils.soliditySha3(packed)
}

const toTypedDataHash = (domainSeparator, structHash) => {
    return web3.utils.soliditySha3(
        {"string": "\x19\x01"},
        {"bytes32": domainSeparator},
        {"bytes32": structHash}
    )
}

const hashTypedDataV4 = (structHash, chainId, atAddress) => {
    let domainSeparator = buildDomainSeparator(chainId, atAddress)
    return toTypedDataHash(domainSeparator, structHash)
}

module.exports = {buildDomainSeparator, toTypedDataHash, hashTypedDataV4}
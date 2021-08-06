const crypto = require('crypto')

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

const randomURI = () => {
    return crypto.randomBytes(32).toString('hex');
}

const wait = async (timeOut) => {
    return new Promise(resolve => {
        setTimeout(resolve, timeOut);
    });
}

const pad = (data, l) => {
    if (data.length < l) {
        return new Array(l + 1 - data.length).join("0") + data
    }
    return data
}

const ERC721_mintToken = async (contract, owner, uri) => {
    if (owner === ZERO_ADDRESS) {
        return await contract.mint(owner, uri)
    }
    return await contract.mint(owner, uri, {from: owner})
}
const ERC721_mintRandomToken = async (contract, owner) => {
    let uri = randomURI()
    if (owner === ZERO_ADDRESS) {
        return await contract.mint(owner, uri)
    }
    return await contract.mint(owner, uri, {from: owner})
}

const ERC1155_mintToken = async (contract, owner, uri, supply) => {
    if (owner === ZERO_ADDRESS) {
        return await contract.mint(owner, uri, supply, 0)
    }
    let res =  await contract.mint(owner, uri, supply, 0, {from: owner})
    return res
}

const ERC1155_mintRandomToken = async (contract, owner, supply = 10000000) => {
    let uri = randomURI()
    if (owner === ZERO_ADDRESS) {
        return await contract.mint(owner, uri, supply, 0)
    }
    return await contract.mint(owner, uri, supply, 0, {from: owner})
}

const ERC1155_mintBatchToken = async (contract, owner, uris, supplies) => {
    if (owner === ZERO_ADDRESS) {
        return await contract.mintBatch(owner, uris, supplies, 0)
    }
    let res =  await contract.mintBatch(owner, uris, supplies, 0, {from: owner})
    return res
}

const ERC1155_mintRandomBatchToken = async (contract, owner, numTokens = 10) => {
    let uris = new Array(numTokens)
    let expectedIDs = new Array(numTokens)
    let supplies = new Array(numTokens)
    for (let i = 0; i < numTokens; i++) {
        uris[i] = randomURI()
        supplies[i] = crypto.randomInt(1000000000000)
        let packed = web3.eth.abi.encodeParameters(['address', 'string'],
            [owner, uris[i]])
        expectedIDs[i] = web3.utils.soliditySha3(packed)
    }

    return await ERC1155_mintBatchToken(contract, owner, uris, supplies)
}

module.exports = {
    ZERO_ADDRESS,
    randomURI,
    wait,
    pad,
    ERC721_mintToken,
    ERC721_mintRandomToken,
    ERC1155_mintToken,
    ERC1155_mintRandomToken,
    ERC1155_mintBatchToken,
    ERC1155_mintRandomBatchToken,
}
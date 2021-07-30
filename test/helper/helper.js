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
    if (owner === '0x0000000000000000000000000000000000000000') {
        return await contract.mint(owner, uri)
    }
    return await contract.mint(owner, uri, {from: owner})
}
const ERC721_mintRandomToken = async (contract, owner) => {
    let uri = crypto.randomBytes(32).toString('hex');
    if (owner === '0x0000000000000000000000000000000000000000') {
        return await contract.mint(owner, uri)
    }
    return await contract.mint(owner, uri, {from: owner})
}

const ERC1155_mintToken = async (contract, owner, uri, supply) => {
    if (owner === '0x0000000000000000000000000000000000000000') {
        return await contract.mint(owner, uri, supply, 0)
    }
    let res =  await contract.mint(owner, uri, supply, 0, {from: owner})
    return res
}

const ERC1155_mintRandomToken = async (contract, owner) => {
    let supply = crypto.randomInt(10000000000000000000)
    let uri = crypto.randomBytes(32).toString('hex');
    if (owner === '0x0000000000000000000000000000000000000000') {
        return await contract.mint(owner, uri, supply, 0)
    }
    return await contract.mint(owner, uri, supply, 0, {from: owner})
}

module.exports = {ZERO_ADDRESS, randomURI, wait, pad, ERC721_mintToken, ERC721_mintRandomToken, ERC1155_mintToken, ERC1155_mintRandomToken}
const crypto = require('crypto')

mintToken = async (contract, owner, uri, supply) => {
    if (owner === '0x0000000000000000000000000000000000000000') {
        return await contract.mint(owner, uri, supply, 0)
    }
    let res =  await contract.mint(owner, uri, supply, 0, {from: owner})
    return res
}

const mintRandomToken = async (contract, owner) => {
    let supply = crypto.randomInt(10000000000000000000)
    let uri = crypto.randomBytes(32).toString('hex');
    if (owner === '0x0000000000000000000000000000000000000000') {
        return await contract.mint(owner, uri, supply, 0)
    }
    return await contract.mint(owner, uri, supply, 0, {from: owner})
}

const randomURI = () => {
    return crypto.randomBytes(32).toString('hex');
}

const pad = (data, l) => {
    if (data.length < l) {
        return new Array(l + 1 - data.length).join("0") + data
    }
    return data
}

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

module.exports = {mintToken, mintRandomToken, randomURI, pad, ZERO_ADDRESS}
const crypto = require('crypto')

async function mintToken(contract, owner, uri) {
    if (owner === '0x0000000000000000000000000000000000000000') {
        return await contract.mint(owner, uri)
    }
    return await contract.mint(owner, uri, {from: owner})
}

async function mintRandomToken(contract, owner) {
    let uri = crypto.randomBytes(32).toString('hex');
    if (owner === '0x0000000000000000000000000000000000000000') {
        return await contract.mint(owner, uri)
    }
    return await contract.mint(owner, uri, {from: owner})
}

async function wait(timeOut) {
    return new Promise(resolve => {
        setTimeout(resolve, timeOut);
    });
}

function randomURI() {
    return crypto.randomBytes(32).toString('hex');
}

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000"

const pad = (data, l) => {
    if (data.length < l) {
        return new Array(l + 1 - data.length).join("0") + data
    }
    return data
}

module.exports = {mintToken, mintRandomToken, wait, randomURI, pad, ZERO_ADDRESS}
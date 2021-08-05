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

module.exports = {mintToken, mintRandomToken, wait, randomURI}
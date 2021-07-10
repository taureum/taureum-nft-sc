async function mintToken(contract, owner, uri, license, expiryDate) {
    return await contract.mint(owner, uri, license, expiryDate)
}

async function mintRandomToken(contract, owner, license) {
    let uri = crypto.randomBytes(30).toString('hex');
    let expiryDate = "10000000000000000000";
    return await contract.mint(owner, uri, license, expiryDate)
}

module.exports = {mintToken, mintRandomToken}
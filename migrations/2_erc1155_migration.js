const { setConfig } = require('./config.js')

const TaureumNFT = artifacts.require("TaureumERC1155");

module.exports = async function (deployer, network) {
    let mainContract
    let mainContractAddress
    await deployer.deploy(TaureumNFT, "");
    mainContract = await TaureumNFT.deployed();
    mainContractAddress = await mainContract.address
    console.log("Main contract (ERC1155) deployed at address", mainContractAddress)
    setConfig('deployed.' + network + '.TaureumERC1155', mainContractAddress)

};
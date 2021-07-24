const { setConfig } = require('./config.js')

const TaureumNFT = artifacts.require("TaureumERC721");
const TaureumNFTEnum = artifacts.require("TaureumERC721Enumerable");

module.exports = async function (deployer, network) {
    if (network === 'testnet') {
        // await deployer.deploy(TaureumNFT);
        // let mainContract = await TaureumNFT.deployed();
        // let mainContractAddress = await mainContract.address
        // setConfig('deployed.' + network + '.TaureumERC721', mainContractAddress)
        // console.log("Main contract deployed at address", mainContractAddress)

        await deployer.deploy(TaureumNFTEnum);
        mainContract = await TaureumNFTEnum.deployed();
        mainContractAddress = await mainContract.address
        setConfig('deployed.' + network + '.TaureumERC721Enumerable', mainContractAddress)
        console.log("Main contract enumerable deployed at address", mainContractAddress)

    } else {
        await deployer.deploy(TaureumNFT);
        mainContract = await TaureumNFT.deployed();
        mainContractAddress = await mainContract.address
        console.log("Main contract deployed at address", mainContractAddress)
        setConfig('deployed.' + network + '.TaureumERC721', mainContractAddress)

        await deployer.deploy(TaureumNFTEnum);
        mainContract = await TaureumNFTEnum.deployed();
        mainContractAddress = await mainContract.address
        console.log("Main contract (enumerable) deployed at address", mainContractAddress)
        setConfig('deployed.' + network + '.TaureumERC721Enumerable', mainContractAddress)
    }
};
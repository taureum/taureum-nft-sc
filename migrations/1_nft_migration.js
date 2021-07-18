const { setConfig } = require('./config.js')

const TaureumKYCMock = artifacts.require("TaureumKYCMock");
const TaureumNFT = artifacts.require("TaureumERC721");

module.exports = async function (deployer, network) {
    if (network === 'testnet') {
        let kycContractAddress = '0xD667a74c61221d516Db45E5FAE45f9602e0427A4'
        console.log("KYC contract deployed at address", kycContractAddress)
        await deployer.deploy(TaureumNFT, kycContractAddress);
        mainContract = await TaureumNFT.deployed();
        mainContractAddress = await mainContract.address
        setConfig('deployed.' + network + '.TaureumERC721', mainContractAddress)
        console.log("Main contract deployed at address", mainContractAddress)
    } else {
        let kycContractAddress

        await deployer.deploy(TaureumKYCMock)
        kycContract = await TaureumKYCMock.deployed()
        kycContractAddress = kycContract.address
        console.log("KYC contract deployed at address", kycContractAddress)
        setConfig('deployed.' + network + '.TaureumKYCMock', kycContractAddress)

        await deployer.deploy(TaureumNFT, kycContractAddress);
        mainContract = await TaureumNFT.deployed();
        mainContractAddress = await mainContract.address
        console.log("Main contract deployed at address", mainContractAddress)
        setConfig('deployed.' + network + '.TaureumERC721', mainContractAddress)
    }
};
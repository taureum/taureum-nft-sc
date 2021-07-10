const TaureumKYCMock = artifacts.require("TaureumKYCMock");
const TaureumNFT = artifacts.require("TaureumNFT");

module.exports = function (deployer) {
    deployer.deploy(TaureumKYCMock).then(async() => {
        kycContractAddress = await TaureumKYCMock.deployed().address
        console.log("KYC Contract Address", kycContractAddress)

        deployer.deploy(TaureumNFT, kycContractAddress)
    });
};
const { setConfig } = require('./config.js')

const TaureumERC1155 = artifacts.require("TaureumERC1155");
const TaureumERC1155LazyMint = artifacts.require("TaureumERC1155LazyMint");

module.exports = async function (deployer, network) {
    if (network !== "mainnet") {
        let mainContract
        let mainContractAddress

        await deployer.deploy(TaureumERC1155LazyMint, "");
        mainContract = await TaureumERC1155LazyMint.deployed();
        mainContractAddress = await mainContract.address
        console.log("Main contract (ERC1155LazyMint) deployed at address", mainContractAddress)
        setConfig('deployed.' + network + '.TaureumERC1155LazyMint', mainContractAddress)
    } else {
        let mainContract
        let mainContractAddress
        // await deployer.deploy(TaureumERC1155, "");
        // mainContract = await TaureumERC1155.deployed();
        // mainContractAddress = await mainContract.address
        // console.log("Main contract (ERC1155) deployed at address", mainContractAddress)
        // setConfig('deployed.' + network + '.TaureumERC1155', mainContractAddress)

        await deployer.deploy(TaureumERC1155LazyMint, "");
        mainContract = await TaureumERC1155LazyMint.deployed();
        mainContractAddress = await mainContract.address
        console.log("Main contract (ERC1155LazyMint) deployed at address", mainContractAddress)
        setConfig('deployed.' + network + '.TaureumERC1155LazyMint', mainContractAddress)
    }
};
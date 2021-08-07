const { setConfig } = require('./config.js')

const TaureumNFT = artifacts.require("TaureumERC721");
const TaureumNFTEnum = artifacts.require("TaureumERC721Enumerable");
const TaureumNFTLazyMint = artifacts.require("TaureumERC721LazyMint");

module.exports = async function (deployer, network) {
    if (network === 'testnet') {
        let mainContract
        let mainContractAddress

        // await deployer.deploy(TaureumNFT);
        // let mainContract = await TaureumNFT.deployed();
        // let mainContractAddress = await mainContract.address
        // setConfig('deployed.' + network + '.TaureumERC721', mainContractAddress)
        // console.log("Main contract deployed at address", mainContractAddress)

        // await deployer.deploy(TaureumNFTEnum);
        // mainContract = await TaureumNFTEnum.deployed();
        // mainContractAddress = await mainContract.address
        // setConfig('deployed.' + network + '.TaureumERC721Enumerable', mainContractAddress)
        // console.log("Main contract (enumerable) deployed at address", mainContractAddress)

        await deployer.deploy(TaureumNFTLazyMint);
        mainContract = await TaureumNFTLazyMint.deployed();
        mainContractAddress = await mainContract.address
        console.log("Main contract (lazyMint) deployed at address", mainContractAddress)
        setConfig('deployed.' + network + '.TaureumERC721LazyMint', mainContractAddress)

    } else {
        let mainContract
        let mainContractAddress

        await deployer.deploy(TaureumNFT);
        mainContract = await TaureumNFT.deployed();
        mainContractAddress = await mainContract.address
        console.log("Main contract (ERC721) deployed at address", mainContractAddress)
        setConfig('deployed.' + network + '.TaureumERC721', mainContractAddress)

        await deployer.deploy(TaureumNFTEnum);
        mainContract = await TaureumNFTEnum.deployed();
        mainContractAddress = await mainContract.address
        console.log("Main contract (ERC721Enumerable) deployed at address", mainContractAddress)
        setConfig('deployed.' + network + '.TaureumERC721Enumerable', mainContractAddress)

        await deployer.deploy(TaureumNFTLazyMint);
        mainContract = await TaureumNFTLazyMint.deployed();
        mainContractAddress = await mainContract.address
        console.log("Main contract (ERC721LazyMint) deployed at address", mainContractAddress)
        setConfig('deployed.' + network + '.TaureumERC721LazyMint', mainContractAddress)
    }
};
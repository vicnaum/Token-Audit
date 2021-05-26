const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');

const RenderToken = artifacts.require("RenderToken");
const Escrow = artifacts.require("Escrow");
const RenderToken_v2 = artifacts.require("RenderToken_v2");
// const Escrow_v2 = artifacts.require("Escrow_v2");

const name = "RenderToken";
const symbol = "RNDR";

const metaMaskAddress = "0x1CC506b64bcB8CC1FE722f05b197c0c52688236F";

module.exports = async (deployer, network, accounts) => {
  const renderToken = await RenderToken.deployed();
  console.log("RenderToken address:", renderToken.address)
  let implementation = await web3.eth.getStorageAt(renderToken.address, "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc")
  console.log("v1 implementation:", implementation)
  renderToken_v2 = await upgradeProxy(renderToken.address, RenderToken_v2, { unsafeAllow: ['constructor'] });
  console.log("Upgraded RenderToken to v2 successfully. Address stays the same:", renderToken_v2.address)
  let implementation_v2 = await web3.eth.getStorageAt(renderToken.address, "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc")
  console.log("v2 implementation:", implementation_v2)
  

  console.log("RenderToken_v2 parameters:");
  console.log("Owner:", await renderToken_v2.owner())
  console.log("childChainManagerProxy:", await renderToken_v2.childChainManagerProxy())
  console.log("Name:", await renderToken_v2.name())
  console.log("Symbol:", await renderToken_v2.symbol())

  const forwarderAddress = require('../build/gsn/Forwarder.json').address
  await renderToken_v2.setTrustedForwarder(forwarderAddress);
  console.log("TrustedForwarder:", await renderToken_v2.trustedForwarder())

  console.log("Test mint Matic RNDR...")
  await renderToken_v2.deposit(metaMaskAddress, web3.eth.abi.encodeParameter('uint256', web3.utils.toWei('1000')))
  console.log("Balance:", web3.utils.fromWei(await renderToken_v2.balanceOf(metaMaskAddress)))
};
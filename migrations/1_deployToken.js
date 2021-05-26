const { deployProxy } = require('@openzeppelin/truffle-upgrades');

const RenderToken = artifacts.require("RenderToken");
const Escrow = artifacts.require("Escrow");
const RenderToken_v2 = artifacts.require("RenderToken_v2");
// const Escrow_v2 = artifacts.require("Escrow_v2");

const name = "RenderToken";
const symbol = "RNDR";


module.exports = async (deployer, network, accounts) => {
  const owner = accounts[0]; // Change this to real owner on prod
  const childChainManagerProxy = accounts[0]; // Change this to real childChainManagerProxy on prod

  console.log("Deploying RenderToken...");
  await deployProxy(RenderToken, [owner, childChainManagerProxy, name, symbol], { deployer, initializer: 'initialize', unsafeAllow: ['constructor'] });
  
  const renderToken = await RenderToken.deployed();
  console.log("Deployed RenderToken at", renderToken.address);

  console.log("With the following parameters:");
  console.log("Owner:", await renderToken.owner())
  console.log("childChainManagerProxy:", await renderToken.childChainManagerProxy())
  console.log("Name:", await renderToken.name())
  console.log("Symbol:", await renderToken.symbol())

  console.log("Deploying Escrow...");
  await deployProxy(Escrow, [owner, renderToken.address], { deployer, initializer: 'initialize', unsafeAllow: ['constructor'] });
  
  const escrow = await Escrow.deployed();
  console.log("Deployed Escrow at", escrow.address);

  console.log("With the following parameters:");
  console.log("Owner:", await escrow.owner())
  console.log("Disbursal address:", await escrow.disbursalAddress())
  console.log("RenderToken address:", await escrow.renderTokenAddress())
};
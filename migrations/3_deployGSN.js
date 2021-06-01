const RenderToken_v2 = artifacts.require('RenderToken_v2')
const Escrow_v2 = artifacts.require('Escrow_v2')
const VerifyingPaymaster = artifacts.require('VerifyingPaymaster')

const ethers = require('ethers')
const { networks } = require('../truffle-config.js')
const { signerAddress } = require('../config.js')

module.exports = async function (deployer, network) {

  // Check RenderToken_v2 parameters
  const renderToken_v2 = await RenderToken_v2.deployed()
  console.log("RenderToken_v2 parameters:");
  console.log("Address:", renderToken_v2.address)
  console.log("Owner:", await renderToken_v2.owner())
  console.log("childChainManagerProxy:", await renderToken_v2.childChainManagerProxy())
  console.log("Name:", await renderToken_v2.name())
  console.log("Symbol:", await renderToken_v2.symbol())

  // Check Escrow_v2 parameters
  const escrow_v2 = await Escrow_v2.deployed()
  console.log("Escrow_v2 parameters:");
  console.log("Address:", escrow_v2.address)
  console.log("Owner:", await escrow_v2.owner())
  console.log("Disbursal address:", await escrow_v2.disbursalAddress())
  console.log("RenderToken address:", await escrow_v2.renderTokenAddress())
  
  await deployer.deploy(VerifyingPaymaster)
  console.log("Deployed VerifyingPaymaster at:", VerifyingPaymaster.address)
  const { host, port } = (networks[network] || {})
  const ethersProvider = new ethers.providers.JsonRpcProvider(`http://${host}:${port}`)
  
  const relayHubAddress = require('../build/gsn/RelayHub.json').address
  console.log("relayHubAddress:", relayHubAddress)
  const paymaster = await VerifyingPaymaster.deployed()

  const forwarderAddress = require('../build/gsn/Forwarder.json').address
  console.log("forwarderAddress:", forwarderAddress)

  await paymaster.setRelayHub(relayHubAddress)
  await paymaster.setTrustedForwarder(forwarderAddress)
  await paymaster.setSigner(signerAddress)
  console.log("signerAddress:", signerAddress)

  console.log(`RelayHub(${relayHubAddress}) set on Paymaster(${VerifyingPaymaster.address})`)
  await ethersProvider.getSigner(0).sendTransaction({
    to: VerifyingPaymaster.address,
    value: ethers.utils.parseEther('1.0')
  })
  console.log(`1 ETH deposited to Paymaster(${VerifyingPaymaster.address})`)
}

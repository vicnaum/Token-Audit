const RenderToken_v2 = artifacts.require('RenderToken_v2')
const VerifyingPaymaster = artifacts.require('VerifyingPaymaster')

const ethers = require('ethers')
const { networks } = require('../truffle-config.js')

module.exports = async function (deployer, network) {
  const instance = await RenderToken_v2.deployed()
  console.log("RenderToken_v2 parameters:");
  console.log("Address:", instance.address)
  console.log("Owner:", await instance.owner())
  console.log("childChainManagerProxy:", await instance.childChainManagerProxy())
  console.log("Name:", await instance.name())
  console.log("Symbol:", await instance.symbol())

  await deployer.deploy(VerifyingPaymaster)
  const { host, port } = (networks[network] || {})
  const ethersProvider = new ethers.providers.JsonRpcProvider(`http://${host}:${port}`)
  const relayHubAddress = require('../build/gsn/RelayHub.json').address
  const paymaster = await VerifyingPaymaster.deployed()

  const forwarderAddress = await instance.trustedForwarder();

  await paymaster.setRelayHub(relayHubAddress)
  await paymaster.setTrustedForwarder(forwarderAddress)
  await paymaster.setSigner("0x9942Ff6354783e13F4679fBecC5AB192731A4161")

  console.log(`RelayHub(${relayHubAddress}) set on Paymaster(${VerifyingPaymaster.address})`)
  await ethersProvider.getSigner(0).sendTransaction({
    to: VerifyingPaymaster.address,
    value: ethers.utils.parseEther('1.0')
  })
  console.log(`1 ETH deposited to Paymaster(${VerifyingPaymaster.address})`)
}

const ethers = require('ethers')

const { ecsign, keccak256, toRpcSig, toBuffer } = require('ethereumjs-util')
const { RelayProvider } = require('@opengsn/gsn')
const paymasterArtifact = require('../build/contracts/VerifyingPaymaster.json')
const verifyingPaymasterAddress = paymasterArtifact.networks[window.ethereum.networkVersion].address

// const paymasterArtifact = require('../build/contracts/WhitelistPaymaster.json')
// const whitelistPaymasterAddress = paymasterArtifact.networks[window.ethereum.networkVersion].address

const contractArtifact = require('../build/contracts/RenderToken_v2.json')
const contractAddress = contractArtifact.networks[window.ethereum.networkVersion].address
const contractAbi = contractArtifact.abi
let contract

let provider
let network

const privkey = toBuffer("0xe84a52dc751f307c3c0849b21b4502051cf8e64cb1397b78bd7a35de6d508392")

function getRequestHash(relayRequest) {
  return keccak256(Buffer.concat([
    Buffer.from(packForwardRequest(relayRequest.request).slice(2), 'hex'),
    Buffer.from(packRelayData(relayRequest.relayData).slice(2), 'hex')
  ]))
}

function packForwardRequest(req) {
  return ethers.utils.defaultAbiCoder.encode(
    ['address', 'address', 'uint256', 'uint256', 'uint256', 'bytes'],
    [req.from, req.to, req.value, req.gas, req.nonce, req.data])
}

function packRelayData(data) {
  return ethers.utils.defaultAbiCoder.encode(
    ['uint256', 'uint256', 'uint256', 'address', 'address', 'bytes', 'uint256'],
    [data.gasPrice, data.pctRelayFee, data.baseRelayFee, data.relayWorker, data.paymaster, data.paymasterData, data.clientId])
}

function signRelayRequest (relayRequest, signerPrivateKey) {
  const sig = ecsign(getRequestHash(relayRequest), signerPrivateKey)
  console.log(sig)
  return toRpcSig(sig.v, sig.r, sig.s)
}

async function mockGetApprovalData(relayRequest) {
  return await mockApprovalFunc(relayRequest)
}

async function mockApprovalFunc(relayRequest) {
  return signRelayRequest(relayRequest, privkey)
}

async function identifyNetwork () {
  console.log("verifyingPaymasterAddress:", verifyingPaymasterAddress)
  // console.log("whitelistPaymasterAddress:", whitelistPaymasterAddress)
  // const gsnConfig = { paymasterAddress: whitelistPaymasterAddress,
  const gsnConfig = { paymasterAddress: verifyingPaymasterAddress,
      loggerConfiguration: {
                            logLevel: 'debug',
                            // loggerUrl: 'logger.opengsn.org',
                        }
                      }
  const gsnProvider = await RelayProvider.newProvider(
    { provider: window.ethereum,
      config: gsnConfig,
      overrideDependencies: {
        asyncApprovalData: mockGetApprovalData
      }
     }).init()
  console.log("gsnProvider:", gsnProvider)
  provider = new ethers.providers.Web3Provider(gsnProvider)
  console.log("provider:", provider)
  network = await provider.ready
  return network
}

async function contractCall () {
  await window.ethereum.enable()
  contract = new ethers.Contract(
    contractAddress, contractAbi, provider.getSigner())
  const transaction = await contract.transfer("0x000000000000000000000000000000000000dead", ethers.utils.parseEther("500"))
  const hash = transaction.hash
  console.log(`Transaction ${hash} sent`)
  const receipt = await provider.waitForTransaction(hash)
  console.log(`Mined in block: ${receipt.blockNumber}`)
}

let logview
function log(message) {
    message = message.replace( /(0x\w\w\w\w)\w*(\w\w\w\w)\b/g, '<b>$1...$2</b>')
    if ( !logview) {
        logview = document.getElementById('logview')
    }
    logview.innerHTML = message+"<br>\n"+logview.innerHTML
}
async function listenToEvents () {
  const contract = new ethers.Contract(
    contractAddress, contractAbi, provider)

  contract.on('Transfer', (sender, recipient, amount, rawEvent) => {
    log(`${ethers.utils.formatEther(amount)} RNDR Transferred from&nbsp;${sender} to&nbsp;${recipient}`)
    console.log(`${ethers.utils.formatEther(amount)} RNDR Transferred from ${sender} to ${recipient}`)
  })
}

window.app = {
  contractCall,
  listenToEvents,
  log,
  identifyNetwork
}

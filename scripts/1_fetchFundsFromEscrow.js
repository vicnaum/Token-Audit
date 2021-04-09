const fs = require('fs');
const path = require('path')
const papaparse = require('papaparse');
const { BN, fromWei } = web3.utils;

const Escrow = artifacts.require('Escrow');
const LegacyToken = artifacts.require('LegacyToken');
const RenderToken = artifacts.require('RenderToken');

const { loadAddressBook, saveAddressBook } = require('../utils/addressBookManager');

module.exports = async deployer => {
  try {
    accounts = await web3.eth.getAccounts();
    const owner = accounts[0]
    console.log("Script is running from:", owner)

    const networkId = await web3.eth.net.getId();
    let addressBook = loadAddressBook(networkId);
    let addresses = addressBook[networkId];

    let legacyToken, renderToken, escrow

    console.log("networkId:", networkId)

    // If the Escrow address is provided in the addressBook - use it. Otherwise - deploy a mock
    if (!addresses["Escrow"] || !addresses["RenderToken"]) {
      console.log("No addresses found in the AddressBook - please check or run 0_deployMocks.js")
      console.log(addresses)
    } else {
      const targetAccount = addresses["TargetAccount"] ? addresses["TargetAccount"] : accounts[1]
      if (!targetAccount) throw new Error("Target Account for this network is not defined - make sure to put it in the AddressBook")

      console.log("\nAddresses found:")
      console.log(addresses)
      console.log("\nWill be using them to fetch funds from Escrow...")

      const csvJobIds = fs.readFileSync(path.join(__dirname, "../jobIds.csv"), { encoding: 'utf8' });
      const jobIds = papaparse.parse(csvJobIds, { delimiter: ',', header: true, skipEmptyLines: true }).data.map(item => item.jobId);

      console.log("The following jobIds were found:")
      console.log(jobIds)

      console.log("Will be using them to fetch RNDR to the target account:", targetAccount)

      renderToken = await RenderToken.at(addresses["RenderToken"])
      escrow = await Escrow.at(addresses["Escrow"])
      
      let output = []

      let balances = {}

      console.log("\nGetting balances...")
      for (jobId of jobIds) {
        balances[jobId] = await escrow.jobBalance(jobId);
        console.log(jobId, ":", fromWei(balances[jobId]), "RNDR")
        output.push(`${jobId},${balances[jobId].toString()}`)
      }

      fs.writeFileSync(path.join(__dirname, `../JobIdsWithBalances.csv`), "jobId,balance\n"+output.join('\n'));

      console.log("\nFetching RNDR from Escrow...")
      for (jobId of jobIds) {
        amount = balances[jobId]
        if (amount > 0) {
          console.log("Trying to fetch", fromWei(amount), "RNDR from", jobId)
          await escrow.disburseJob(jobId, [targetAccount], [amount]);
        } else {
          console.log(jobId, "amount is 0 - skipping")
        }
      }

      console.log("Target Account balance:", fromWei(await renderToken.balanceOf(targetAccount)), "RNDR")

    }
  } catch(e) {
    console.log(e)
  }
  process.exit()
}
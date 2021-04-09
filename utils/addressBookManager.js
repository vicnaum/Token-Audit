const path = require('path')
const fs = require('fs');

const addressBookPath = "../addressBook.json"

function loadAddressBook(networkId) {
  let addressBook = require(path.join(__dirname, addressBookPath))
  if (addressBook[networkId] === undefined) addressBook[networkId] = {}
  let addresses = addressBook[networkId]
  if (addresses === undefined) addressBook[networkId] = {}
  return addressBook;
}

function saveAddressBook(addressBook) {
  fs.writeFileSync(path.join(__dirname, addressBookPath), JSON.stringify(addressBook, null, 2));
}

module.exports = {
  loadAddressBook,
  saveAddressBook
}
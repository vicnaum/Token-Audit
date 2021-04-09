const HDWalletProvider = require("@truffle/hdwallet-provider");
const infuraApiKey = require('./config').infuraApiKey;
const mnemonic = require('./config').mnemonic;
const privateKey = require('./config').privateKey;

module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '*'
    },
    local: {
      host: 'localhost',
      port: 9545,
      network_id: '*'
    },
    mainnet: {
      provider: () => new HDWalletProvider({privateKeys: [privateKey],
          providerOrUrl: `https://kovan.infura.io/v3/${infuraApiKey}`}),
      gasPrice: 50000000000,
      network_id: 42
    },
    kovan: {
      provider: () => new HDWalletProvider({privateKeys: [privateKey],
          providerOrUrl: `https://kovan.infura.io/v3/${infuraApiKey}`}),
      gasPrice: 50000000000,
      network_id: 42
    },
    ropsten:  {
      provider: () => new HDWalletProvider(mnemonic, `https://ropsten.infura.io/v3/${infuraApiKey}`),
      network_id: 3
    }
  },
  compilers: {
    solc: {
      version: "0.4.24",    // Fetch exact version from solc-bin (default: truffle's version)
      settings: {
        optimizer: {
          enabled: true,
          runs: 999999   // Optimize for how many times you intend to run the code
        }
      }
    }
  }
};

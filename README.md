# Escrow L1->L2 migration

0. Run `npm install`

1. Put jobIds in the `jobIds.csv` file

2. Put credentials in `config.js` (based on `config.example.js`)

3. Check the `addressBook.json` for the correct contract addresses

4. If you're testing it on testnet or local machine, run:

    `truffle exec scripts/0_deployMocks.js --network kovan`

    In case there are no addresses in the `addressBook.json` for the specified network - the MOCK contracts will be created and filled with MOCK jobs and tokens

5. Make sure you input the `TargetAddress` in the `addressBook.json` for the needed network - that's the address to where the tokens will be sent from `Escrow`

6. Specify the desired gas price (in wei) in `truffle-config.js` for the chosen network

7. To perform the actual migration run (specifying the network needed: `mainnet`/`kovan`/`ropsten`/`development`):

    `truffle exec scripts/1_fetchFundsFromEscrow.js --network kovan`

This will first fetch all the `jobId` balances and save them in `JobIdsWithBalances.csv` - for future reference.
And then it will try to disburse RNDR from each `jobId` to the `TargetAddress` in separate transactions.

If something goes wrong (not high enough gas price or Infura error) - you can run the step 7 again and if will skip the `jobId`'s that have already been disbursed and have `0` balance.

After all the tokens are on the `TargetAddress` (which should be a multisig or Ledger account - well protected) - you can transfer them to the Matic L2 chain using their PoS Bridge - to a similar single address - that will be used as a disbursor to load them up to Matic L2 Escrow using the Stage 2 script.
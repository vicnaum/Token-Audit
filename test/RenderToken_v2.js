const { BN } = web3.utils;
const { abi } = web3.eth;
const RenderToken = artifacts.require('RenderToken');
const Escrow = artifacts.require('Escrow');
const RenderToken_v2 = artifacts.require('RenderToken_v2');
// const Escrow_v2 = artifacts.require('Escrow_v2');

const MinimalForwarder = artifacts.require('MinimalForwarder');

const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');

require('chai')
    .use(require('chai-as-promised'))
    .use(require('chai-bn')(BN))
    .should();


const name = "RenderToken";
const symbol = "RNDR";

contract('Render Token v2', (accounts) => {
  const owner = accounts[0];
  const childChainManagerProxy = accounts[1];

  let renderTokenDecimalFactor = 1000000000000000000;
  let sampleJob1 = {
    id: 'SampleJob1',
    cost: 10 * renderTokenDecimalFactor
  };
  let sampleJob2 = {
    id: 'SampleJob2',
    cost: 20 * renderTokenDecimalFactor
  };

  before(async () => {
    const renderTokenContractOwner = accounts[0];
    const escrowContractOwner = accounts[0];

    // Create and initialize Render Token contract
    renderToken = await deployProxy(RenderToken, [owner, childChainManagerProxy, name, symbol]);
    renderTokenAddress = await renderToken.address;

    // Create and initialize Escrow contract
    escrow = await deployProxy(Escrow, [owner, renderToken.address]);
    escrowAddress = await escrow.address;

    // Create MinimalForwarder contract
    minimalForwarder = await MinimalForwarder.new();
    minimalForwarderAddress = await minimalForwarder.address;
    console.log("MinimalForwarder:", minimalForwarderAddress)

    // Add funds to accounts
    let amount = 100 * renderTokenDecimalFactor;
    for (let account of accounts) {
      await renderToken.deposit(account, abi.encodeParameter('uint256', amount.toString()), {from: childChainManagerProxy})
    }

    // Set escrow contract address
    await renderToken.setEscrowContractAddress(escrowAddress);
  });

  describe('Upgrade', () => {
    it.only('Should upgrade RenderToken to v2', async () => {
      let implementation = await web3.eth.getStorageAt(renderToken.address, "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc")
      console.log("v1 implementation:", implementation)
      renderToken_v2 = await upgradeProxy(renderToken.address, RenderToken_v2);
      let implementation_v2 = await web3.eth.getStorageAt(renderToken.address, "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc")
      console.log("v2 implementation:", implementation_v2)

      await renderToken_v2.setTrustedForwarder(minimalForwarderAddress);
      console.log("TrustedForwarder:", await renderToken_v2.trustedForwarder())
    });
  });

  describe('Should allow valid transfers of RNDR tokens', () => {

    it('should return correct balances after transfer', async () => {
      let startBalance0 = Number(await renderToken_v2.balanceOf(accounts[0]));
      let startBalance1 = Number(await renderToken_v2.balanceOf(accounts[1]));

      let transferAmount = 100;
      await renderToken_v2.transfer(accounts[1], transferAmount);

      let endBalance0 = Number(await renderToken_v2.balanceOf(accounts[0]));
      let endBalance1 = Number(await renderToken_v2.balanceOf(accounts[1]));

      assert.equal(startBalance0 - transferAmount, endBalance0);
      assert.equal(startBalance1 + transferAmount, endBalance1);
    });

    it('should throw an error when trying to transfer more than balance', async () => {
      let sender = accounts[3];
      let balance = Number(await renderToken_v2.balanceOf(sender));

      let transferAmount = balance * 2;

      await renderToken_v2.transfer(accounts[2], transferAmount, {from: sender})
        .should.be.rejectedWith('overflow');
    });

    it('should return correct balances after transfering from another account', async () => {
      let startBalance0 = Number(await renderToken_v2.balanceOf(accounts[0]));
      let startBalance1 = Number(await renderToken_v2.balanceOf(accounts[1]));
      let startBalance2 = Number(await renderToken_v2.balanceOf(accounts[2]));

      let approvalAmount = 100;
      await renderToken_v2.approve(accounts[1], approvalAmount);
      await renderToken_v2.transferFrom(accounts[0], accounts[2], approvalAmount, {from: accounts[1]});

      let endBalance0 = Number(await renderToken_v2.balanceOf(accounts[0]));
      let endBalance1 = Number(await renderToken_v2.balanceOf(accounts[1]));
      let endBalance2 = Number(await renderToken_v2.balanceOf(accounts[2]));

      assert.equal(startBalance0 - approvalAmount, endBalance0);
      assert.equal(startBalance1, endBalance1);
      assert.equal(startBalance2 + approvalAmount, endBalance2);
    });

    it('should throw an error when trying to transfer more than allowed', async () => {
      let approvalAmount = 100;
      await renderToken_v2.approve(accounts[1], approvalAmount);

      await renderToken_v2.transferFrom(accounts[0], accounts[2], (approvalAmount * 2), {from: accounts[1]})
        .should.be.rejectedWith('revert');
    });

    it('should throw an error when trying to transfer to 0x0', async () => {
      await renderToken_v2.transfer("0x0000000000000000000000000000000000000000", 100)
        .should.be.rejectedWith('revert');
    });

    it('should throw an error when trying to transferFrom to 0x0', async () => {
      await renderToken_v2.approve(accounts[1], 100);
      await renderToken_v2.transferFrom(accounts[0], "0x0000000000000000000000000000000000000000", 100, { from: accounts[1] })
        .should.be.rejectedWith('revert');
    });
  });

  describe('Should maintain a record of allowances', () => {

    it('should return the correct allowance amount after approval', async () => {
      await renderToken_v2.approve(accounts[1], 100);
      let allowance = await renderToken_v2.allowance(accounts[0], accounts[1]);

      assert.equal(allowance, 100);
    });

    it('should allow setting allowance to 0', async () => {
      await renderToken_v2.approve(accounts[1], 0);
      let allowance = await renderToken_v2.allowance(accounts[0], accounts[1]);

      assert.equal(allowance, 0);
    });

    it('should allow updates to allowances', async () => {
      let startApproval = await renderToken_v2.allowance(accounts[0], accounts[1]);
      assert.equal(startApproval, 0);

      await renderToken_v2.increaseAllowance(accounts[1], 50);
      let postIncrease = await renderToken_v2.allowance(accounts[0], accounts[1]);
      startApproval.add(new BN(50)).should.be.bignumber.equal(postIncrease);

      await renderToken_v2.decreaseAllowance(accounts[1], 10);
      let postDecrease = await renderToken_v2.allowance(accounts[0], accounts[1]);
      postIncrease.sub(new BN(10)).should.be.bignumber.equal(postDecrease);
    });

    it('should increase by 50 then set to 0 by decreasing', async () => {
      // Reset the allowance
      await renderToken_v2.approve(accounts[1], 0);

      let startApproval = await renderToken_v2.allowance(accounts[0], accounts[1]);
      assert.equal(startApproval, 0);

      await renderToken_v2.approve(accounts[1], 50);
      await renderToken_v2.decreaseAllowance(accounts[1], 50);

      let postDecrease = await renderToken_v2.allowance(accounts[0], accounts[1]);
      postDecrease.should.be.bignumber.equal("0");
    });
  });

  describe('Should allow tokens to be escrowed', () => {

    it('should remove tokens from calling address', async () => {
      let startBalance = await renderToken_v2.balanceOf(accounts[1]);
      await renderToken_v2.holdInEscrow('userId', startBalance, {from: accounts[1]});

      let endBalance = await renderToken_v2.balanceOf(accounts[1]);
      assert.equal(endBalance, 0);
    });
  });
});

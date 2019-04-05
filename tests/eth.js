const { CryptoRpc } = require('../');
const assert = require('assert');
const mocha = require('mocha');
const { before, describe, it } = mocha;
const EthereumTx = require('ethereumjs-tx');
const util = require('web3-utils');
const config = {
  chain: 'ETH',
  host: 'ganache',
  protocol: 'http',
  rpcPort: '8545',
  account: '0xd8fD14fB0E0848Cb931c1E54a73486c4B968BE3D',
  currencyConfig: {
    sendTo: '0xA15035277A973d584b1d6150e93C21152D6Af440',
    unlockPassword: '',
    privateKey:
      '117ACF0C71DE079057F4D125948D2F1F12CB3F47C234E43438E1E44C93A9C583',
    rawTx:
      '0xf8978202e38471a14e6382ea6094000000000000000000000000000000000000000080b244432d4c353a4e2b4265736a3770445a46784f6149703630735163757a382f4f672b617361655a3673376543676b6245493d26a04904c712736ce12808f531996007d3eb1c1e1c1dcf5431f6252678b626385e40a043ead01a06044cd86fba04ae1dc5259c5b3b5556a8bd86aeb8867e8f1e41512a'
  }
};


describe('ETH Tests', function() {
  const currency = 'ETH';
  const currencyConfig = config.currencyConfig;
  const rpcs = new CryptoRpc(config, currencyConfig);
  let txid = '';
  let blockHash = '';

  this.timeout(10000);

  before(done => {
    setTimeout(done, 5000);
  });

  it('should estimate fee', async () => {
    const fee = await rpcs.estimateFee({ currency, nBlocks: 4 });
    assert(fee);
  });

  it('should send raw transaction', async () => {
    // Reset nonce to 0
    const txCount = await rpcs.getTransactionCount(
      {
        currency,
        address: config.account
      }
    );

    // construct the transaction data
    const txData = {
      nonce: util.toHex(txCount),
      gasLimit: util.toHex(25000),
      gasPrice: util.toHex(10e9), // 10 Gwei
      to: config.currencyConfig.sendTo,
      from: config.account,
      value: util.toHex(util.toWei('123', 'wei'))
    };

    const rawTx = new EthereumTx(txData);
    const privateKey = Buffer.from(config.currencyConfig.privateKey, 'hex');
    rawTx.sign(privateKey);
    const serializedTx = rawTx.serialize();
    const sentTx = await rpcs.sendRawTransaction(
      {
        currency,
        rawTx: '0x' + serializedTx.toString('hex')
      }
    );
    assert(sentTx);
  });


  it('should be able to get a block hash', async () => {
    const block = await rpcs.getBestBlockHash({ currency });
    blockHash = block;
    assert(block);
  });

  it('should get block', async () => {
    const reqBlock = await rpcs.getBlock({ currency, hash: blockHash });
    assert(reqBlock);
  });

  it('should be able to get a balance', async () => {
    const balance = await rpcs.getBalance({ currency });
    assert(balance != undefined);
  });

  it('should be able to send a transaction', async () => {
    txid = await rpcs.unlockAndSendToAddress({ currency, address: config.currencyConfig.sendTo, amount: '10000', passphrase: currencyConfig.unlockPassword });
    assert(txid);
  });

  it('should be able to send many transactions', async () => {
    const address = config.currencyConfig.sendTo;
    const amount = '1000';
    const payToArray = [
      { address, amount },
    ];
    const txids = await rpcs.unlockAndSendToAddressMany({ currency, payToArray, passphrase: currencyConfig.unlockPassword });
    assert(txids[0]);
  });

  it('should reject when one of many transactions fails', async () => {
    const address = config.currencyConfig.sendTo;
    const amount = '1000';
    const payToArray = [
      { address, amount },
      { address: 'funkyColdMedina', amount: 1 },
    ];
    try {
      await rpcs.unlockAndSendToAddressMany({ currency, payToArray, passphrase: currencyConfig.unlockPassword });
    } catch (error) {
      assert(error.message = 'At least one of many requests Failed');
      assert(error.data.failure[1]);
    }
  });

  it('should be able to get a transaction', async () => {
    const tx = await rpcs.getTransaction({ currency, txid });
    assert(tx);
    assert(typeof tx === 'object');
  });

  it('should be able to decode a raw transaction', async () => {
    const { rawTx } = config.currencyConfig;
    assert(rawTx);
    const decoded = await rpcs.decodeRawTransaction({ currency, rawTx });
    assert(decoded);
  });

  it('should get the tip', async () => {
    const tip = await rpcs.getTip({ currency });
    assert(tip != undefined);
  });

  it('should get confirmations', async () => {
    const confirmations = await rpcs.getConfirmations({ currency, txid });
    assert(confirmations != undefined);
  });

  it('should validate address', async () => {
    const isValid = await rpcs.validateAddress({ currency, address: config.currencyConfig.sendTo });
    assert(isValid === true);
  });

  it('should not validate bad address', async () => {
    const isValid = await rpcs.validateAddress({ currency, address: 'NOTANADDRESS' });
    assert(isValid === false);
  });

});
const wallet = require("./wallet");
const ethers = require("ethers");
const web3utils = require("web3-utils");
const axios = require("axios");

const { toBech32, fromBech32 } = require("@harmony-js/crypto");

const TOTPWalletArtifact = require("../build/contracts/TOTPWallet.json");
const NUMOFTOKENS = 5;
var Contract = require("web3-eth-contract");
var contract = new Contract(TOTPWalletArtifact.abi);

class RelayerClient {
  constructor(url, env) {
    this.url = url;
    this.env = env;

    // used for backward compatibility checking
    this.codeVersion = 1;
    this.options = {};
  }

  static getContract() {
    return contract;
  }

  setCodeVersion(codeVersion) {
    this.codeVersion = codeVersion;
  }

  setOptions(options) {
    this.options = options;
  }

  async getFactoryInfo() {
    const res = await axios.post(this.url, {
      operation: "getFactoryInfo",
      env: this.env,
    });
    return res.data.result;
  }

  async getFees() {
    const res = await axios.post(this.url, {
      operation: "getRefundInfo",
      env: this.env,
    });
    this.createFee = res.data.result.createFee;
    this.refundAddress = res.data.result.refundAddress;
    //console.log(`Create Fee ${this.createFee} RefundAddress=${this.refundAddress}`)
  }

  async getDepositAddress(ownerAddress, salt) {
    return axios.post(this.url, {
      operation: "getDepositAddress",
      env: this.env,
      data: {
        owner: ownerAddress,
        salt: salt,
      },
    });
  }

  static isTransactionReceiptSuccess(events) {
    return (
      events.find((e) => {
        return e.event == "TransactionExecuted" && e.args.success == true;
      }) != undefined
    );
  }

  static findTransactionExecuted(events) {
    return events.find((e) => {
      return e.event == "TransactionExecuted";
    });
  }
  static parseRelayReceipt(txReceipt) {
    const { args } = txReceipt.logs.find(
      (e) =>
        e.name === "TransactionExecuted" || e.event === "TransactionExecuted"
    );

    let errorBytes;
    let error;
    if (!args.success && args.returnData) {
      if (args.returnData.startsWith("0x08c379a0")) {
        // Remove the encoded error signatures 08c379a0
        const noErrorSelector = `0x${args.returnData.slice(10)}`;
        const errorBytesArray = ethers.utils.defaultAbiCoder.decode(
          ["bytes"],
          noErrorSelector
        );
        errorBytes = errorBytesArray[0]; // eslint-disable-line prefer-destructuring
      } else {
        errorBytes = args.returnData;
        console.log(errorBytes);
      }
      error = ethers.utils.toUtf8String(errorBytes);
    }
    return { success: args.success, error };
  }

  async submitMetaTx(from, methodData, gasPrice, gasLimit, signers) {
    console.log("getting fees");
    if (!this.refundAddress) {
      await this.getFees();
    }
    console.log("getting nonce");

    var nonce = await wallet.getNonceForRelay();
    console.log(
      "getting sigs",
      wallet,
      signers,
      from,
      0,
      methodData,
      this.codeVersion == 0 ? 0 : this.options.chainId, // support pre-audit code
      nonce,
      gasPrice,
      gasLimit,
      ethers.constants.AddressZero,
      this.refundAddress
    );

    var sigs = await wallet.signOffchain2(
      signers,
      from,
      0,
      methodData,
      this.codeVersion == 0 ? 0 : this.options.chainId, // support pre-audit code
      nonce,
      gasPrice,
      gasLimit,
      ethers.constants.AddressZero,
      this.refundAddress
    );
    console.log("submitting tx");

    try {
      var res = await axios.post(this.url, {
        operation: "submitMetaTx",
        env: this.env,
        data: {
          from: from,
          data: methodData,
          signatures: sigs,
          nonce,
          gasPrice,
          gasLimit,
          refundToken: ethers.constants.AddressZero,
          refundAddress: this.refundAddress,
        },
      });

      if (res.status == 200) {
        const receipt = res.data.result.tx.receipt;
        if (receipt.name == "Error") {
          throw Error(receipt.stack);
        }

        //console.log(JSON.stringify(res.data))
        //console.log(receipt.logs[0].args)
        if (receipt.status == true) {
          var { success, error } = RelayerClient.parseRelayReceipt(
            res.data.result.tx
          );
          if (success) {
            return { success, error, data: res.data.result.tx };
          } else {
            throw Error(error);
          }
        }
        return { success: false, error: null, data: res.data.result.tx };
      }
    } catch (e) {
      if (e.response) {
        throw Error(e.response.data);
      } else {
        throw e;
      }
    }
  }

  //TODO: this looks unsafe - we don't check for secret, no? or is ownerAccount the secret?
  async transferTX(
    from,
    destination,
    amount,
    gasPrice,
    gasLimit,
    ownerAccount
  ) {
    //console.log("Transfer", from, destination, amount)
    const methodData = contract.methods
      .makeTransfer(destination, amount)
      .encodeABI();
    console.log("submitting meta", methodData);
    return this.submitMetaTx(from, methodData, gasPrice, gasLimit, [
      ownerAccount,
    ]);
  }

  async setHashStorageId(from, id, gasPrice, gasLimit, ownerAccount) {
    const methodData = contract.methods.setHashStorageId(id).encodeABI();
    return this.submitMetaTx(from, methodData, gasPrice, gasLimit, [
      ownerAccount,
    ]);
  }

  async startRecoverCommit(from, secretHash, commitHash, gasPrice, gasLimit) {
    if (this.codeVersion == 0) {
      var iface = new ethers.utils.Interface([
        "function startRecoverCommit(bytes32 dataHash)",
      ]);
      var methodData = iface.encodeFunctionData("startRecoverCommit", [
        commitHash,
      ]);
      return this.submitMetaTx(from, methodData, gasPrice, gasLimit, []);
    } else {
      const methodData = contract.methods
        .startRecoverCommit(secretHash, commitHash)
        .encodeABI();
      return this.submitMetaTx(from, methodData, gasPrice, gasLimit, []);
    }
  }

  async startRecoverReveal(from, owner, proof, gasPrice, gasLimit) {
    const methodData = contract.methods
      .startRecoveryReveal(owner, proof)
      .encodeABI();
    return this.submitMetaTx(from, methodData, gasPrice, gasLimit, []);
  }

  async submitWallet(
    name,
    ownerAddress,
    root_arr,
    merkleHeight,
    drainAddr,
    dailyLimit,
    salt,
    password,
    email,
    countryOfResidence,
    resolver
  ) {
    return axios.post(this.url, {
      operation: "createWallet",
      env: this.env,
      config: {
        domain: [name.split(".")[0], name.split(".")[1]],
        owner: ownerAddress,
        rootHash: root_arr,
        merkelHeight: merkleHeight,
        drainAddr: drainAddr,
        dailyLimit: dailyLimit,
        salt: salt,
        password: password,
        email: email,
        countryOfResidence: countryOfResidence,
        feeReceipient: this.refundAddress,
        feeAmount: this.createFee,
        resolver: resolver,
      },
    });
  }

  async storeHashes(wallet, hashes) {
    return axios.post(this.url, {
      operation: "storeHash",
      env: this.env,
      data: {
        wallet: wallet,
        hashes: hashes,
      },
    });
  }

  async getHashes(address) {
    return axios.post(this.url, {
      operation: "getHash",
      env: this.env,
      address: address,
    });
  }

  async getContractCreated() {
    return axios.post(this.url, {
      operation: "getContractCreated",
      env: this.env,
    });
  }
}

module.exports = RelayerClient;

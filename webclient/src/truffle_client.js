import { default as Web3 } from 'web3'

import walletArtifacts from '../../build/contracts/TOTPWallet.json'
import dailyLimitArtifact from '../../build/contracts/DailyLimit.json'
import guardiansArtifact from '../../build/contracts/Guardians.json'
import recoveryArtifact from '../../build/contracts/Recovery.json'

var contract = require("@truffle/contract");
var TOTPWallet = contract(walletArtifacts)
var DailyLimit = contract(dailyLimitArtifact)
var Guardians = contract(guardiansArtifact)
var Recovery = contract(recoveryArtifact)

console.log(DailyLimit);

TOTPWallet.setProvider(window.web3.currentProvider)

var networks = {
    0x4 : "rinkeby",
    0x6357d2e0 : "harmony-testnet",
    0x6357d2e1 : "harmony-testnet",
    0x6357d2e2 : "harmony-testnet",
    0x6357d2e3 : "harmony-testnet",
    0x63564c40 : "harmony-mainnet",
    0x63564c41 : "harmony-mainnet",
    0x63564c42 : "harmony-mainnet",
    0x63564c43 : "harmony-mainnet"
}
var CONFIGS = {
    0x4: {
      "DailyLimit": "0xe99810556BbE9e2EAA48F84eE6450Aa5a18Fb2B4",
      "Guardians": "0xf3ad04b291B3E3f441cFde0C7d41353361282bbb",
      "Recovery" : "0x1bE4e84647843b10bA8D3726F3baCcEC4950Bda5"  ,
      "limit":  Web3.utils.toWei("0.01", "ether"),    
    },
    0x6357d2e0: {
        "DailyLimit": "0x71B48CC260360950428fB842f5DD38cE873a11df",
        "Guardians": "0xc44Ea215a81caC2e7E8aE23911D082EcB2a2D23C",
        "Recovery" : "0xE168817e6d7066E2f2E4a85E26eaB47E0d82acF6",
        "limit":  Web3.utils.toWei("100", "ether"),   
      },
      0x63564c40: {
        "DailyLimit": "0x71B48CC260360950428fB842f5DD38cE873a11df",
        "Guardians": "0xc44Ea215a81caC2e7E8aE23911D082EcB2a2D23C",
        "Recovery" : "0xE168817e6d7066E2f2E4a85E26eaB47E0d82acF6",
        "limit":  Web3.utils.toWei("100", "ether"),
      } 
}
window.App = {}

export async function refresh() {
    var _accounts = (undefined != window.ethereum)? await window.ethereum.enable(): await web3.eth.getAccounts();
    _accounts = await web3.eth.getAccounts();
    const chainId = parseInt(await  ethereum.request({ method: 'eth_chainId' }));

    App.chainId = chainId;
    App.network = networks[chainId];

    if (! (chainId in networks) ) {
        alert("Not supported chain id : " + chainId);
    }

    console.log("Using network ", App.network)

    App.accounts = _accounts;
    App.defaultAccount = _accounts[0];
    TOTPWallet.defaults({ from: App.defaultAccount, gas: 5000 * 1000, gasPrice: 20 * 1000000000 })
    console.log(App);
}
export async function createWallet(rootHash, height, timePeriod, timeOffset, leafs, drainAddr) {
    await TOTPWallet.detectNetwork();
    TOTPWallet.link("DailyLimit", CONFIGS[App.chainId].DailyLimit);
    TOTPWallet.link("Guardians",CONFIGS[App.chainId].Guardians);
    TOTPWallet.link("Recovery",CONFIGS[App.chainId].Recovery);
        
    return TOTPWallet.new(rootHash, height, timePeriod, timeOffset, drainAddr, CONFIGS[chainId].limit).then(e=>{
        console.log(e);
        localStorage.setItem("wallet:"+e.address, JSON.stringify({
            tx: e.transactionHash,
            leafs: leafs
        }))
        return e
    })
}

export async function loadWallet(address) {
    var wallet = await TOTPWallet.at(address);
    var walletData = await wallet.wallet();
    console.log(wallet);
    return {
        rootHash: walletData.rootHash,
        height: walletData.merkelHeight,
        timePeriod: walletData.timePeriod,
        timeOffset: walletData.timeOffset,
        dailyLimit: walletData.dailyLimit,
        spentToday: walletData.spentToday,
        drainAddr: walletData.drainAddr,
        balance: await web3.eth.getBalance(address),
        guardians: await wallet.getGuardians(),
        isRecovering: await wallet.isRecovering(),
        contract: wallet
    }
}

export function getWallets() {
    var wallets = [];
    for (var key in localStorage){
        console.log(key)
        if (key.startsWith("wallet:")) {
            wallets.push(key.split(":")[1]);
        }
    }
    return wallets;
}

export async function load() {
    if (typeof web3 !== 'undefined') { // Checking if Web3 has been injected by the browser (Mist/MetaMask)
        // if (window.ethereum.isMetaMask) { // Checking if Web3 has been injected by the browser (Mist/MetaMask)
          console.warn('Using web3 detected from external source.')
          window.web3 = new Web3(web3.currentProvider) // Use Mist/MetaMask's provider      
        await refresh();
        return App;
    }
}
// window.addEventListener('load', async () => {
//     if (typeof web3 !== 'undefined') { // Checking if Web3 has been injected by the browser (Mist/MetaMask)
//         // if (window.ethereum.isMetaMask) { // Checking if Web3 has been injected by the browser (Mist/MetaMask)
//           console.warn('Using web3 detected from external source.')
//           window.web3 = new Web3(web3.currentProvider) // Use Mist/MetaMask's provider      
//         await refresh();
//     }
// });
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import atm_abi from "../artifacts/contracts/Assessment.sol/Assessment.json";

export default function HomePage() {
  const [ethWallet, setEthWallet] = useState(undefined);
  const [account, setAccount] = useState(undefined);
  const [atm, setATM] = useState(undefined);
  const [balance, setBalance] = useState(undefined);
  const [transactionAmount, setTransactionAmount] = useState("");
  const [etherPrice, setEtherPrice] = useState(undefined);
  const [loading, setLoading] = useState(false);
  const [balanceInUSD, setBalanceInUSD] = useState(null);


  const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const atmABI = atm_abi.abi;

  const getWallet = async () => {
    if (window.ethereum) {
      setEthWallet(window.ethereum);
    }

    if (ethWallet) {
      const accounts = await ethWallet.request({ method: "eth_accounts" });
      handleAccount(accounts[0]);
    }
  };

  const handleAccount = (account) => {
    if (account) {
      console.log("Account connected: ", account);
      setAccount(account);
    } else {
      console.log("No account found");
    }
  };

  const connectAccount = async () => {
    if (!ethWallet) {
      alert("MetaMask wallet is required to connect");
      return;
    }

    const accounts = await ethWallet.request({
      method: "eth_requestAccounts",
    });
    handleAccount(accounts[0]);

    // once wallet is set we can get a reference to our deployed contract
    getATMContract();
  };

  const getATMContract = () => {
    const provider = new ethers.providers.Web3Provider(ethWallet);
    const signer = provider.getSigner();
    const atmContract = new ethers.Contract(
      contractAddress,
      atmABI,
      signer
    );

    setATM(atmContract);
  };

  const getBalance = async () => {
    if (atm) {
      const balanceWei = await atm.getBalance();
      const balanceEther = ethers.utils.formatEther(balanceWei);
      const roundedBalance = Math.round(parseFloat(balanceEther));
      setBalance(roundedBalance);
    }
  };

  const handleTransaction = async (action) => {
    if (!transactionAmount) {
      alert("Please enter an amount.");
      return;
    }

    if (atm) {
      try {
        let tx;
        if (action === "deposit") {
          tx = await atm.deposit(ethers.utils.parseEther(transactionAmount));
        } else if (action === "withdraw") {
          tx = await atm.withdraw(ethers.utils.parseEther(transactionAmount));
        }
        await tx.wait();
        setTransactionAmount("");
        getBalance();
      } catch (error) {
        console.error("Transaction failed:", error);
      }
    }
  };

  const fetchEtherPrice = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
      );
      const data = await response.json();
      const price = data.ethereum.usd;
      setEtherPrice(price);
    } catch (error) {
      console.error("Failed to fetch Ether price:", error);
    } finally {
      setLoading(false);
    }
  };

  const convertBalanceToUSD = () => {
    const balanceInUSD = balance * etherPrice;
    setBalanceInUSD(balanceInUSD);
  };

  const initUser = () => {
    // Check to see if user has Metamask
    if (!ethWallet) {
      return <p>Please install Metamask in order to use this ATM.</p>;
    }

    // Check to see if user is connected. If not, connect to their account
    if (!account) {
      return (
        <button onClick={connectAccount}
        style={{background:'#689e80', 
        color:'white', 
        borderRadius:'5px', 
        height:'30px', 
        border:'none', 
        cursor:'pointer'}}>Connect your Metamask wallet</button>
      );
    }

    if (balance === undefined) {
      getBalance();
    }

    return (
      <div>
        <p>Your Account: {account}</p>
        <p>Your Balance: {balance} ETH</p>
        <input
          type="number"
          value={transactionAmount}
          onChange={(e) => setTransactionAmount(e.target.value)}
          placeholder="Enter amount in ETH"
        />
        <span>&nbsp;</span><span>&nbsp;</span><span>&nbsp;</span><span>&nbsp;</span>
      
        <button onClick={() => handleTransaction("deposit")}
        style={{background:'black', 
        color:'white', 
        borderRadius:'5px', 
        height:'30px', 
        border:'none', 
        cursor:'pointer'}}>Deposit</button> <span>&nbsp;</span><span>&nbsp;</span><span>&nbsp;</span>


        <button onClick={() => handleTransaction("withdraw")}
        style={{background:'#cc1d00', 
        color:'white', 
        borderRadius:'5px', 
        height:'30px', 
        border:'none', 
        cursor:'pointer'}}>Withdraw</button><br></br><br></br>

        <button onClick={fetchEtherPrice} disabled={loading} 
        style={{background:'#b4b5cb', 
        color:'white', 
        borderRadius:'5px', 
        height:'30px', 
        border:'none', 
        cursor:'pointer'}}>
        {loading ? "Loading..." : "Get Current Ether Price"}
      </button> <span>&nbsp;</span><span>&nbsp;</span>
      <button onClick={convertBalanceToUSD}
      style={{background:'#689e80', 
      color:'white', 
      borderRadius:'5px', 
      height:'30px', 
      border:'none', 
      cursor:'pointer'}}>Balance in USD</button>

      {etherPrice && <p>Current Ether Price: ${etherPrice}</p>} 

      
      {balanceInUSD && <p>Balance in USD: ${balanceInUSD}</p>}
      </div>
    );
  };

  useEffect(() => {
    getWallet();
  }, []);

  return (
    <main className="container">
      <header>
        <h1>Welcome to Khaomyx' ATM!</h1>
      </header>
      {initUser()}
      <style jsx>{`
        .container {
          text-align: center;
        }
      `}</style>
    </main>
  );
}

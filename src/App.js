import { useState } from 'react';
import { ethers } from 'ethers';
import { EthereumProvider } from '@walletconnect/ethereum-provider';

const CONTRACT_ADDRESS = "0x3b61dca1b03c5cc303fe5733d40f5bd6588fc66d";
const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";
const ARC_CHAIN_ID = "0x4CE052";
const ARC_CHAIN_ID_NUM = 5042002;
const WALLETCONNECT_PROJECT_ID = "8bb24a433758c9a403057e2e3f2c371b";
const CONTRACT_ABI = [
  "function sendMoney(address token, address recipient, uint256 amount, string memory country) external",
  "function createInvoice(address recipient, uint256 amount, string memory description, string memory country) external returns (bytes32)",
  "function payInvoice(address token, bytes32 invoiceId) external",
  "function getPayments(address user) external view returns (tuple(address sender, address recipient, uint256 amount, string country, uint256 timestamp, bytes32 invoiceId)[])",
  "function invoices(bytes32) view returns (address creator, address recipient, uint256 amount, string description, string country, bool paid, uint256 createdAt)"
];
const ERC20_ABI = ["function approve(address spender, uint256 amount) external returns (bool)"];
const COUNTRIES = ["Mexico","Brazil","India","Philippines","Nigeria","Indonesia","Pakistan","Bangladesh","Vietnam","Ghana","Kenya","Egypt","Turkey","Argentina","Colombia","Ukraine","Ethiopia","Tanzania","Uganda","Nepal"];
const FEES = [{name:"Arc Remittance",fee:"~$0.007",time:"< 1 sec",best:true},{name:"Western Union",fee:"$4.99 + 3%",time:"1-5 days",best:false},{name:"SWIFT / Bank",fee:"$25-45",time:"3-5 days",best:false},{name:"PayPal",fee:"5% up to $4.99",time:"1-3 days",best:false},{name:"Wise",fee:"0.5-2%",time:"1-2 days",best:false}];
const ARC_NETWORK = {chainId:ARC_CHAIN_ID,chainName:"Arc Testnet",nativeCurrency:{name:"USDC",symbol:"USDC",decimals:18},rpcUrls:["https://rpc.testnet.arc.network"],blockExplorerUrls:["https://testnet.arcscan.app"]};

async function detectProvider(){
  if(window.ethereum?.providers?.length) return window.ethereum.providers.find(p=>p.isMetaMask)||window.ethereum.providers[0];
  if(window.ethereum) return window.ethereum;
  if(window.web3?.currentProvider) return window.web3.currentProvider;
  return null;
}

async function switchToArc(provider){
  try{
    await provider.request({method:"wallet_switchEthereumChain",params:[{chainId:ARC_CHAIN_ID}]});
  }catch(e){
    try{
      await provider.request({method:"wallet_addEthereumChain",params:[ARC_NETWORK]});
    }catch(e2){
      try{
        await provider.request({method:"wallet_switchEthereumChain",params:[{chainId:ARC_CHAIN_ID}]});
      }catch(e3){}
    }
  }
}

const tabs=["Send","Invoice","Pay","History","Fees"];

function App(){
const [wallet,setWallet]=useState(null);
const [tab,setTab]=useState("Send");
const [recipient,setRecipient]=useState("");
const [amount,setAmount]=useState("");
const [country,setCountry]=useState("Mexico");
const [description,setDescription]=useState("");
const [invoiceIdInput,setInvoiceIdInput]=useState("");
const [status,setStatus]=useState("");
const [loading,setLoading]=useState(false);
const [payments,setPayments]=useState([]);
const [invoiceId,setInvoiceId]=useState("");
const [providerName,setProviderName]=useState("");
const [walletProvider,setWalletProvider]=useState(null);

async function connectWithExtension(){
  const provider=await detectProvider();
  if(!provider){setStatus("No wallet extension found. Use mobile wallet option below.");return;}
  if(provider.isMetaMask)setProviderName("MetaMask");
  else if(provider.isCoinbaseWallet)setProviderName("Coinbase");
  else if(provider.isBraveWallet)setProviderName("Brave Wallet");
  else if(provider.isRabby)setProviderName("Rabby");
  else setProviderName("Web3 Wallet");
  try{
    await provider.request({method:"eth_requestAccounts"});
    await switchToArc(provider);
    const ep=new ethers.BrowserProvider(provider);
    const s=await ep.getSigner();
    const a=await s.getAddress();
    setWallet(a);setWalletProvider(provider);loadPayments(a,provider);
  }catch(e){setStatus("Failed: "+e.message);}
}

async function connectWithWalletConnect(){
  try{
    setStatus("Opening WalletConnect...");
    const provider=await EthereumProvider.init({
      projectId:WALLETCONNECT_PROJECT_ID,
      chains:[ARC_CHAIN_ID_NUM],
      optionalChains:[1],
      showQrModal:true,
      metadata:{name:"Arc Remittance",description:"Send USDC globally",url:"https://arc-remittance.vercel.app",icons:["https://arc-remittance.vercel.app/logo192.png"]}
    });
    await provider.connect();
    const ep=new ethers.BrowserProvider(provider);
    const s=await ep.getSigner();
    const a=await s.getAddress();
    setWallet(a);setProviderName("WalletConnect");setWalletProvider(provider);
    setStatus("");
    loadPayments(a,provider);
  }catch(e){setStatus("WalletConnect failed: "+e.message);}
}

async function loadPayments(addr,prov){
  try{
    const ep=new ethers.BrowserProvider(prov||window.ethereum);
    const c=new ethers.Contract(CONTRACT_ADDRESS,CONTRACT_ABI,ep);
    const t=await c.getPayments(addr);
    setPayments(t);
  }catch(e){}
}

async function sendMoney(){
  try{
    setLoading(true);setStatus("Approving USDC...");
    const ep=new ethers.BrowserProvider(walletProvider||window.ethereum);
    const s=await ep.getSigner();
    const u=new ethers.Contract(USDC_ADDRESS,ERC20_ABI,s);
    const a=ethers.parseUnits(amount,6);
    const approveTx=await u.approve(CONTRACT_ADDRESS,a);
    await approveTx.wait();
    setStatus("Sending...");
    const c=new ethers.Contract(CONTRACT_ADDRESS,CONTRACT_ABI,s);
    const t=await c.sendMoney(USDC_ADDRESS,recipient.toLowerCase(),a,country);
    await t.wait();
    setStatus("Sent successfully");
    loadPayments(wallet,walletProvider);
  }catch(e){setStatus("Error: "+e.message);}
  setLoading(false);
}

async function createInvoice(){
  try{
    setLoading(true);setStatus("Creating invoice...");
    const ep=new ethers.BrowserProvider(walletProvider||window.ethereum);
    const s=await ep.getSigner();
    const c=new ethers.Contract(CONTRACT_ADDRESS,CONTRACT_ABI,s);
    const a=ethers.parseUnits(amount,6);
    const t=await c.createInvoice(recipient.toLowerCase(),a,description,country);
    const r=await t.wait();
    setInvoiceId(r.logs[0].topics[1]);
    setStatus("Invoice created");
  }catch(e){setStatus("Error: "+e.message);}
  setLoading(false);
}

async function payInvoice(){
  try{
    setLoading(true);setStatus("Loading invoice...");
    const ep=new ethers.BrowserProvider(walletProvider||window.ethereum);
    const s=await ep.getSigner();
    const c=new ethers.Contract(CONTRACT_ADDRESS,CONTRACT_ABI,ep);
    const inv=await c.invoices(invoiceIdInput);
    if(inv.paid){setStatus("Error: Invoice already paid");setLoading(false);return;}
    const u=new ethers.Contract(USDC_ADDRESS,ERC20_ABI,s);
    setStatus("Approving USDC...");
    const approveTx=await u.approve(CONTRACT_ADDRESS,inv.amount);
    await approveTx.wait();
    setStatus("Paying invoice...");
    const cw=new ethers.Contract(CONTRACT_ADDRESS,CONTRACT_ABI,s);
    const t=await cw.payInvoice(USDC_ADDRESS,invoiceIdInput);
    await t.wait();
    setStatus("Invoice paid successfully");
  }catch(e){setStatus("Error: "+e.message);}
  setLoading(false);
}

const inp={width:"100%",padding:12,marginTop:4,marginBottom:14,borderRadius:10,border:"1px solid #ddd",boxSizing:"border-box",fontSize:14};
const lbl={fontSize:13,color:"#444",fontWeight:"bold"};
const isOk=status.includes("successfully")||status.includes("created");

return(
<div style={{minHeight:"100vh",background:"linear-gradient(135deg,#667eea,#764ba2)",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
<div style={{background:"white",borderRadius:20,padding:32,width:"100%",maxWidth:480,boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
<div style={{textAlign:"center",marginBottom:20}}>
<h1 style={{margin:"8px 0",fontSize:26,color:"#1a1a2e"}}>Arc Remittance</h1>
<p style={{color:"#666",margin:0,fontSize:14}}>Send USDC globally in seconds</p>
</div>
{!wallet?(
<div style={{textAlign:"center"}}>
<p style={{color:"#888",marginBottom:16,fontSize:14}}>Connect your wallet to get started</p>
<button onClick={connectWithExtension} style={{width:"100%",padding:"14px",background:"linear-gradient(135deg,#667eea,#764ba2)",color:"white",border:"none",borderRadius:12,cursor:"pointer",fontSize:15,fontWeight:"bold",marginBottom:10}}>
Connect Browser Wallet
</button>
<button onClick={connectWithWalletConnect} style={{width:"100%",padding:"14px",background:"white",color:"#667eea",border:"2px solid #667eea",borderRadius:12,cursor:"pointer",fontSize:15,fontWeight:"bold"}}>
Connect Mobile Wallet
</button>
{status&&<p style={{color:"red",marginTop:10,fontSize:13}}>{status}</p>}
</div>
):(
<>
<div style={{background:"#f0f4ff",borderRadius:10,padding:"8px 14px",marginBottom:16,fontSize:13,color:"#4F46E5",display:"flex",justifyContent:"space-between"}}>
<span>Connected: {wallet.slice(0,6)}...{wallet.slice(-4)}</span>
<span style={{color:"#888"}}>{providerName}</span>
</div>
<div style={{display:"flex",gap:4,marginBottom:20,flexWrap:"wrap"}}>
{tabs.map(t=>(<button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"8px 4px",borderRadius:8,border:"none",background:tab===t?"linear-gradient(135deg,#667eea,#764ba2)":"#f0f4ff",color:tab===t?"white":"#4F46E5",cursor:"pointer",fontSize:11,fontWeight:"bold",minWidth:55}}>{t}</button>))}
</div>
{tab==="Send"&&(
<div>
<label style={lbl}>Recipient Address</label>
<input placeholder="0x..." value={recipient} onChange={e=>setRecipient(e.target.value)} style={inp}/>
<label style={lbl}>Amount (USDC)</label>
<input placeholder="10" value={amount} onChange={e=>setAmount(e.target.value)} style={inp}/>
<label style={lbl}>Destination Country</label>
<select value={country} onChange={e=>setCountry(e.target.value)} style={inp}>{COUNTRIES.map(c=><option key={c}>{c}</option>)}</select>
<button onClick={sendMoney} disabled={loading} style={{width:"100%",padding:"14px",background:loading?"#ccc":"linear-gradient(135deg,#667eea,#764ba2)",color:"white",border:"none",borderRadius:12,cursor:loading?"not-allowed":"pointer",fontSize:16,fontWeight:"bold"}}>{loading?"Processing...":"Send USDC"}</button>
</div>
)}
{tab==="Invoice"&&(
<div>
<p style={{color:"#888",fontSize:13,marginBottom:14}}>Create an invoice to request payment from a client</p>
<label style={lbl}>Client Wallet Address</label>
<input placeholder="0x..." value={recipient} onChange={e=>setRecipient(e.target.value)} style={inp}/>
<label style={lbl}>Amount (USDC)</label>
<input placeholder="500" value={amount} onChange={e=>setAmount(e.target.value)} style={inp}/>
<label style={lbl}>Description</label>
<input placeholder="Logo design - March 2026" value={description} onChange={e=>setDescription(e.target.value)} style={inp}/>
<label style={lbl}>Your Country</label>
<select value={country} onChange={e=>setCountry(e.target.value)} style={inp}>{COUNTRIES.map(c=><option key={c}>{c}</option>)}</select>
<button onClick={createInvoice} disabled={loading} style={{width:"100%",padding:"14px",background:loading?"#ccc":"linear-gradient(135deg,#667eea,#764ba2)",color:"white",border:"none",borderRadius:12,cursor:loading?"not-allowed":"pointer",fontSize:16,fontWeight:"bold"}}>{loading?"Creating...":"Create Invoice"}</button>
{invoiceId&&(<div style={{marginTop:14,padding:12,borderRadius:10,background:"#f0fff4",fontSize:12}}><strong>Invoice ID:</strong><br/><span style={{wordBreak:"break-all",color:"#4F46E5"}}>{invoiceId}</span><br/><small style={{color:"#666"}}>Share this ID with your client — they can pay using the Pay tab</small></div>)}
</div>
)}
{tab==="Pay"&&(
<div>
<p style={{color:"#888",fontSize:13,marginBottom:14}}>Received an invoice ID? Pay it here</p>
<label style={lbl}>Invoice ID</label>
<input placeholder="0x..." value={invoiceIdInput} onChange={e=>setInvoiceIdInput(e.target.value)} style={inp}/>
<button onClick={payInvoice} disabled={loading} style={{width:"100%",padding:"14px",background:loading?"#ccc":"linear-gradient(135deg,#667eea,#764ba2)",color:"white",border:"none",borderRadius:12,cursor:loading?"not-allowed":"pointer",fontSize:16,fontWeight:"bold"}}>{loading?"Processing...":"Pay Invoice"}</button>
</div>
)}
{tab==="History"&&(
<div>
<h3 style={{color:"#1a1a2e",marginBottom:12}}>Transaction History</h3>
{payments.length===0?(<p style={{color:"#888",textAlign:"center"}}>No transactions yet</p>):payments.map((p,i)=>(<div key={i} style={{background:"#f8f9ff",borderRadius:10,padding:12,marginBottom:8}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{color:"#4F46E5",fontWeight:"bold"}}>{ethers.formatUnits(p.amount,6)} USDC</span><span style={{color:"#888",fontSize:12}}>{p.country}</span></div><div style={{color:"#666",fontSize:11,marginTop:4}}>To: {p.recipient.slice(0,6)}...{p.recipient.slice(-4)}</div><div style={{color:"#aaa",fontSize:11}}>{new Date(Number(p.timestamp)*1000).toLocaleDateString()}</div></div>))}
</div>
)}
{tab==="Fees"&&(
<div>
<h3 style={{color:"#1a1a2e",marginBottom:4}}>Fee Comparison</h3>
<p style={{color:"#888",fontSize:13,marginBottom:12}}>Sending $100 internationally</p>
{FEES.map((f,i)=>(<div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 12px",marginBottom:8,borderRadius:10,background:f.best?"#f0f4ff":"#fafafa",border:f.best?"2px solid #4F46E5":"1px solid #eee"}}><div><div style={{fontWeight:"bold",color:f.best?"#4F46E5":"#333",fontSize:14}}>{f.name} {f.best&&"(Best)"}</div><div style={{color:"#888",fontSize:12}}>{f.time}</div></div><div style={{fontWeight:"bold",color:f.best?"#4F46E5":"#e53e3e",fontSize:15}}>{f.fee}</div></div>))}
<p style={{color:"#4F46E5",fontSize:12,textAlign:"center",marginTop:8}}>Arc saves up to $44.99 per transaction</p>
</div>
)}
{status&&(<div style={{marginTop:14,padding:12,borderRadius:10,background:isOk?"#f0fff4":"#fff0f0",color:isOk?"green":"#c00",fontSize:14}}>{status}</div>)}
</>
)}
<p style={{textAlign:"center",marginTop:16,fontSize:12,color:"#aaa"}}>Powered by Arc Testnet • USDC Native</p>
</div>
</div>
);
}
export default App; 
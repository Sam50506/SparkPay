/* eslint-disable no-undef */
import { ethers } from 'ethers';

export const ARC_CHAIN_ID=5042002, ARC_CHAIN_HEX='0x4CEF52';
export const DEFAULT_MAINTENANCE=true;
export const ADMIN_ADDRESS='0x9e086e6c07d5108ce40d84e9df1ce43caedd2306';
export const ARC_RPC    = process.env.REACT_APP_ARC_RPC||'';
export const ARC_RPC_FALLBACK='https://rpc.testnet.arc.network';
export const ARC_RPC_FALLBACK2='https://arc-testnet.drpc.org';
export const ARC_RPC_FALLBACK3='https://5042002.rpc.thirdweb.com';
export const SCHED_ADDR = '0xD8668A6b776e8b6aAcaAaad16240Bb57DcD89C57';
export const REMIT_ADDR = process.env.REACT_APP_REMIT_ADDR||'0x6338e79f2C218E41A78D75E336867549E2c300ee';
export const USDC_ADDR  = process.env.REACT_APP_USDC_ADDR||'0x3600000000000000000000000000000000000000';
export const WC_ID      = process.env.REACT_APP_WC_ID||'';
export const SB_URL     = process.env.REACT_APP_SUPABASE_URL||'';
export const SB_KEY     = process.env.REACT_APP_SUPABASE_ANON_KEY||'';
export const APP_URL    = 'https://sparkpay-app.vercel.app';

export const COUNTRIES=['Pakistan','Nigeria','India','Philippines','Bangladesh','Mexico','Brazil','Indonesia','Vietnam','Ghana','Kenya','Egypt','Turkey','Argentina','Colombia','Ukraine','Ethiopia','Tanzania','Uganda','Nepal'];
export const ALL_COUNTRIES=['Afghanistan','Albania','Algeria','Argentina','Armenia','Australia','Austria','Azerbaijan','Bahamas','Bahrain','Bangladesh','Belarus','Belgium','Belize','Benin','Bhutan','Bolivia','Bosnia and Herzegovina','Botswana','Brazil','Brunei','Bulgaria','Burkina Faso','Burundi','Cambodia','Cameroon','Canada','Chad','Chile','China','Colombia','Costa Rica','Croatia','Cuba','Cyprus','Czech Republic','Denmark','Dominican Republic','Ecuador','Egypt','El Salvador','Estonia','Ethiopia','Fiji','Finland','France','Gabon','Gambia','Georgia','Germany','Ghana','Greece','Guatemala','Guinea','Haiti','Honduras','Hong Kong','Hungary','Iceland','India','Indonesia','Iran','Iraq','Ireland','Israel','Italy','Ivory Coast','Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Lesotho','Liberia','Libya','Lithuania','Luxembourg','Madagascar','Malawi','Malaysia','Maldives','Mali','Malta','Mauritania','Mauritius','Mexico','Moldova','Mongolia','Montenegro','Morocco','Mozambique','Myanmar','Namibia','Nepal','Netherlands','New Zealand','Nicaragua','Niger','Nigeria','North Macedonia','Norway','Oman','Pakistan','Panama','Papua New Guinea','Paraguay','Peru','Philippines','Poland','Portugal','Qatar','Romania','Russia','Rwanda','Saudi Arabia','Senegal','Serbia','Singapore','Slovakia','Slovenia','Somalia','South Africa','South Korea','South Sudan','Spain','Sri Lanka','Sudan','Sweden','Switzerland','Syria','Taiwan','Tajikistan','Tanzania','Thailand','Togo','Tunisia','Turkey','Turkmenistan','Uganda','Ukraine','United Arab Emirates','United Kingdom','United States','Uruguay','Uzbekistan','Venezuela','Vietnam','Yemen','Zambia','Zimbabwe'];
export const ALL_CURRENCY={'Afghanistan':'AFN','Albania':'ALL','Algeria':'DZD','Argentina':'ARS','Armenia':'AMD','Australia':'AUD','Austria':'EUR','Azerbaijan':'AZN','Bahamas':'BSD','Bahrain':'BHD','Bangladesh':'BDT','Belarus':'BYN','Belgium':'EUR','Belize':'BZD','Benin':'XOF','Bhutan':'BTN','Bolivia':'BOB','Bosnia and Herzegovina':'BAM','Botswana':'BWP','Brazil':'BRL','Brunei':'BND','Bulgaria':'BGN','Burkina Faso':'XOF','Burundi':'BIF','Cambodia':'KHR','Cameroon':'XAF','Canada':'CAD','Chad':'XAF','Chile':'CLP','China':'CNY','Colombia':'COP','Costa Rica':'CRC','Croatia':'EUR','Cuba':'CUP','Cyprus':'EUR','Czech Republic':'CZK','Denmark':'DKK','Dominican Republic':'DOP','Ecuador':'USD','Egypt':'EGP','El Salvador':'USD','Estonia':'EUR','Ethiopia':'ETB','Fiji':'FJD','Finland':'EUR','France':'EUR','Gabon':'XAF','Gambia':'GMD','Georgia':'GEL','Germany':'EUR','Ghana':'GHS','Greece':'EUR','Guatemala':'GTQ','Guinea':'GNF','Haiti':'HTG','Honduras':'HNL','Hong Kong':'HKD','Hungary':'HUF','Iceland':'ISK','India':'INR','Indonesia':'IDR','Iran':'IRR','Iraq':'IQD','Ireland':'EUR','Israel':'ILS','Italy':'EUR','Ivory Coast':'XOF','Jamaica':'JMD','Japan':'JPY','Jordan':'JOD','Kazakhstan':'KZT','Kenya':'KES','Kuwait':'KWD','Kyrgyzstan':'KGS','Laos':'LAK','Latvia':'EUR','Lebanon':'LBP','Lesotho':'LSL','Liberia':'LRD','Libya':'LYD','Lithuania':'EUR','Luxembourg':'EUR','Madagascar':'MGA','Malawi':'MWK','Malaysia':'MYR','Maldives':'MVR','Mali':'XOF','Malta':'EUR','Mauritania':'MRU','Mauritius':'MUR','Mexico':'MXN','Moldova':'MDL','Mongolia':'MNT','Montenegro':'EUR','Morocco':'MAD','Mozambique':'MZN','Myanmar':'MMK','Namibia':'NAD','Nepal':'NPR','Netherlands':'EUR','New Zealand':'NZD','Nicaragua':'NIO','Niger':'XOF','Nigeria':'NGN','North Macedonia':'MKD','Norway':'NOK','Oman':'OMR','Pakistan':'PKR','Panama':'PAB','Papua New Guinea':'PGK','Paraguay':'PYG','Peru':'PEN','Philippines':'PHP','Poland':'PLN','Portugal':'EUR','Qatar':'QAR','Romania':'RON','Russia':'RUB','Rwanda':'RWF','Saudi Arabia':'SAR','Senegal':'XOF','Serbia':'RSD','Singapore':'SGD','Slovakia':'EUR','Slovenia':'EUR','Somalia':'SOS','South Africa':'ZAR','South Korea':'KRW','South Sudan':'SSP','Spain':'EUR','Sri Lanka':'LKR','Sudan':'SDG','Sweden':'SEK','Switzerland':'CHF','Syria':'SYP','Taiwan':'TWD','Tajikistan':'TJS','Tanzania':'TZS','Thailand':'THB','Togo':'XOF','Tunisia':'TND','Turkey':'TRY','Turkmenistan':'TMT','Uganda':'UGX','Ukraine':'UAH','United Arab Emirates':'AED','United Kingdom':'GBP','United States':'USD','Uruguay':'UYU','Uzbekistan':'UZS','Venezuela':'VES','Vietnam':'VND','Yemen':'YER','Zambia':'ZMW','Zimbabwe':'ZWL'};
export const ALL_CC={'Afghanistan':'AF','Albania':'AL','Algeria':'DZ','Argentina':'AR','Armenia':'AM','Australia':'AU','Austria':'AT','Azerbaijan':'AZ','Bahamas':'BS','Bahrain':'BH','Bangladesh':'BD','Belarus':'BY','Belgium':'BE','Belize':'BZ','Benin':'BJ','Bhutan':'BT','Bolivia':'BO','Bosnia and Herzegovina':'BA','Botswana':'BW','Brazil':'BR','Brunei':'BN','Bulgaria':'BG','Burkina Faso':'BF','Burundi':'BI','Cambodia':'KH','Cameroon':'CM','Canada':'CA','Chad':'TD','Chile':'CL','China':'CN','Colombia':'CO','Costa Rica':'CR','Croatia':'HR','Cuba':'CU','Cyprus':'CY','Czech Republic':'CZ','Denmark':'DK','Dominican Republic':'DO','Ecuador':'EC','Egypt':'EG','El Salvador':'SV','Estonia':'EE','Ethiopia':'ET','Fiji':'FJ','Finland':'FI','France':'FR','Gabon':'GA','Gambia':'GM','Georgia':'GE','Germany':'DE','Ghana':'GH','Greece':'GR','Guatemala':'GT','Guinea':'GN','Haiti':'HT','Honduras':'HN','Hong Kong':'HK','Hungary':'HU','Iceland':'IS','India':'IN','Indonesia':'ID','Iran':'IR','Iraq':'IQ','Ireland':'IE','Israel':'IL','Italy':'IT','Ivory Coast':'CI','Jamaica':'JM','Japan':'JP','Jordan':'JO','Kazakhstan':'KZ','Kenya':'KE','Kuwait':'KW','Kyrgyzstan':'KG','Laos':'LA','Latvia':'LV','Lebanon':'LB','Lesotho':'LS','Liberia':'LR','Libya':'LY','Lithuania':'LT','Luxembourg':'LU','Madagascar':'MG','Malawi':'MW','Malaysia':'MY','Maldives':'MV','Mali':'ML','Malta':'MT','Mauritania':'MR','Mauritius':'MU','Mexico':'MX','Moldova':'MD','Mongolia':'MN','Montenegro':'ME','Morocco':'MA','Mozambique':'MZ','Myanmar':'MM','Namibia':'NA','Nepal':'NP','Netherlands':'NL','New Zealand':'NZ','Nicaragua':'NI','Niger':'NE','Nigeria':'NG','North Macedonia':'MK','Norway':'NO','Oman':'OM','Pakistan':'PK','Panama':'PA','Papua New Guinea':'PG','Paraguay':'PY','Peru':'PE','Philippines':'PH','Poland':'PL','Portugal':'PT','Qatar':'QA','Romania':'RO','Russia':'RU','Rwanda':'RW','Saudi Arabia':'SA','Senegal':'SN','Serbia':'RS','Singapore':'SG','Slovakia':'SK','Slovenia':'SI','Somalia':'SO','South Africa':'ZA','South Korea':'KR','South Sudan':'SS','Spain':'ES','Sri Lanka':'LK','Sudan':'SD','Sweden':'SE','Switzerland':'CH','Syria':'SY','Taiwan':'TW','Tajikistan':'TJ','Tanzania':'TZ','Thailand':'TH','Togo':'TG','Tunisia':'TN','Turkey':'TR','Turkmenistan':'TM','Uganda':'UG','Ukraine':'UA','United Arab Emirates':'AE','United Kingdom':'GB','United States':'US','Uruguay':'UY','Uzbekistan':'UZ','Venezuela':'VE','Vietnam':'VN','Yemen':'YE','Zambia':'ZM','Zimbabwe':'ZW'};
export const CC={Pakistan:'PK',Nigeria:'NG',India:'IN',Philippines:'PH',Bangladesh:'BD',Mexico:'MX',Brazil:'BR',Indonesia:'ID',Vietnam:'VN',Ghana:'GH',Kenya:'KE',Egypt:'EG',Turkey:'TR',Argentina:'AR',Colombia:'CO',Ukraine:'UA',Ethiopia:'ET',Tanzania:'TZ',Uganda:'UG',Nepal:'NP',Australia:'AU',Cambodia:'KH',Canada:'CA',Chile:'CL',China:'CN',Japan:'JP',Malaysia:'MY',Morocco:'MA',Peru:'PE',Poland:'PL',Romania:'RO',Russia:'RU','Saudi Arabia':'SA',Singapore:'SG','South Africa':'ZA','South Korea':'KR','Sri Lanka':'LK',Thailand:'TH','United Arab Emirates':'AE','United Kingdom':'GB'};
export const flagEmoji=cc=>cc?String.fromCodePoint(...cc.toUpperCase().split('').map(c=>0x1F1E6+c.charCodeAt(0)-65)):'';
export const CURRENCY={Pakistan:'PKR',Nigeria:'NGN',India:'INR',Philippines:'PHP',Bangladesh:'BDT',Mexico:'MXN',Brazil:'BRL',Indonesia:'IDR',Vietnam:'VND',Ghana:'GHS',Kenya:'KES',Egypt:'EGP',Turkey:'TRY',Argentina:'ARS',Colombia:'COP',Ukraine:'UAH',Ethiopia:'ETB',Tanzania:'TZS',Uganda:'UGX',Nepal:'NPR',Australia:'AUD',Cambodia:'KHR',Canada:'CAD',Chile:'CLP',China:'CNY',Japan:'JPY',Malaysia:'MYR',Morocco:'MAD',Peru:'PEN',Poland:'PLN',Romania:'RON',Russia:'RUB','Saudi Arabia':'SAR',Singapore:'SGD','South Africa':'ZAR','South Korea':'KRW','Sri Lanka':'LKR',Thailand:'THB','United Arab Emirates':'AED','United Kingdom':'GBP'};

export const REMIT_ABI=[
  {inputs:[{name:'payer',type:'address'},{name:'amount',type:'uint256'},{name:'description',type:'string'},{name:'country',type:'string'}],name:'createInvoice',outputs:[{name:'',type:'bytes32'}],stateMutability:'nonpayable',type:'function'},
  {inputs:[{name:'token',type:'address'},{name:'invoiceId',type:'bytes32'}],name:'payInvoice',outputs:[],stateMutability:'nonpayable',type:'function'},
  {inputs:[{name:'token',type:'address'},{name:'recipient',type:'address'},{name:'amount',type:'uint256'},{name:'country',type:'string'}],name:'sendMoney',outputs:[],stateMutability:'nonpayable',type:'function'},
  {inputs:[{name:"recipients",type:"address[]"},{name:"amounts",type:"uint256[]"},{name:"countries",type:"string[]"}],name:"batchSend",outputs:[],stateMutability:"payable",type:"function"},
  {inputs:[{name:'user',type:'address'}],name:'getPayments',outputs:[{components:[{name:'sender',type:'address'},{name:'recipient',type:'address'},{name:'amount',type:'uint256'},{name:'country',type:'string'},{name:'timestamp',type:'uint256'},{name:'invoiceId',type:'bytes32'}],name:'',type:'tuple[]'}],stateMutability:'view',type:'function'},
  {inputs:[{name:'user',type:'address'}],name:'getUserInvoices',outputs:[{name:'',type:'bytes32[]'}],stateMutability:'view',type:'function'},
  {inputs:[{name:'',type:'bytes32'}],name:'invoices',outputs:[{name:'creator',type:'address'},{name:'payer',type:'address'},{name:'amount',type:'uint256'},{name:'description',type:'string'},{name:'country',type:'string'},{name:'paid',type:'bool'},{name:'createdAt',type:'uint256'},{name:'nonce',type:'uint256'}],stateMutability:'view',type:'function'},
  {inputs:[{name:'',type:'address'}],name:'nonces',outputs:[{name:'',type:'uint256'}],stateMutability:'view',type:'function'}
];
export const ERC20_ABI=['function balanceOf(address) view returns (uint256)','function allowance(address,address) view returns (uint256)','function approve(address,uint256) returns (bool)','function transfer(address,uint256) returns (bool)','function decimals() view returns (uint8)'];

export const short  =a=>a?a.slice(0,6)+'...'+a.slice(-4):'';
export const sendNotif=(title,body)=>{if('Notification' in window&&Notification.permission==='granted'){if(navigator.serviceWorker?.controller){navigator.serviceWorker.ready.then(reg=>reg.showNotification(title,{body,icon:'/sparkpay-logo.jpg'}));}else{try{new Notification(title,{body,icon:'/sparkpay-logo.jpg'});}catch(_){}}}};
export const requestNotifPermission=async()=>{if('Notification' in window&&Notification.permission==='default'){await Notification.requestPermission();}};
export const fmtUsdc=v=>v!=null?parseFloat(ethers.formatUnits(BigInt(v.toString()),18)).toFixed(2):'0.00';
export const fmtDate=ts=>{if(!ts)return'';const d=new Date(Number(ts)*1000);return d.toLocaleDateString('en',{month:'short',day:'numeric',timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone});};
export const fmtTime=ts=>{if(!ts)return'';const d=new Date(Number(ts)*1000);return d.toLocaleTimeString('en',{hour:'2-digit',minute:'2-digit',timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone});};
export const ls     =(k,fb)=>{try{const v=localStorage.getItem(k);return v?JSON.parse(v):fb;}catch{return fb;}};
export const lsSave =(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v));}catch{}};

export async function awaitReceipt(provider,hash,ms=120000){
  const end=Date.now()+ms;
  let rpcProvider=null;
  try{rpcProvider=new ethers.JsonRpcProvider(ARC_RPC_FALLBACK,{name:'Arc Testnet',chainId:ARC_CHAIN_ID});}catch(_){}
  while(Date.now()<end){
    try{
      if(rpcProvider){const r=await rpcProvider.getTransactionReceipt(hash);if(r&&r.blockNumber)return r;}
      const r2=await provider.getTransactionReceipt(hash);if(r2&&r2.blockNumber)return r2;
    }catch(_){}
    await new Promise(res=>setTimeout(res,3000));
  }
  return null;
}

export function buildChart(txns){
  const days=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));return{label:d.toLocaleDateString('en',{weekday:'short'}),date:d,sent:0};});
  txns.filter(tx=>!tx.received&&tx.type!=='refund'&&tx.status!=='cancelled'&&tx.status!=='scheduled').forEach(tx=>{const txDate=new Date(Number(tx.timestamp)*1000);const label=txDate.toLocaleDateString('en',{weekday:'short'});const slot=days.find(d=>d.label===label&&d.date.toDateString()===txDate.toDateString());if(slot){let n;if(typeof tx.amount==='bigint'||typeof tx.amount==='object'){try{n=parseFloat(ethers.formatUnits(BigInt(tx.amount.toString()),18));}catch{n=0;}}else{n=parseFloat(tx.amount);}slot.sent+=isNaN(n)?0:n;}});
  return days;
}

export function addrColor(addr){const colors=['#3B82F6','#8B5CF6','#EC4899','#F59E0B','#10B981','#EF4444','#06B6D4','#F97316'];return colors[parseInt(addr.slice(2,4),16)%colors.length];}
export function isValidAddr(a){return a.trim().length===42&&a.trim().slice(0,2).toLowerCase()==='0x';}

export function getProvider() {
  return new Promise((resolve) => {
    const tryResolve = () => {
      if(window.mises?.ethereum) return window.mises.ethereum;
      const {ethereum}=window; if(!ethereum) return null;
      if(ethereum.providers?.length>0){
        const mises=ethereum.providers.find(p=>p.isMises);if(mises)return mises;
        const mm=ethereum.providers.find(p=>p.isMetaMask&&!p.isBraveWallet);if(mm)return mm;
        return ethereum.providers[0];
      }
      if(ethereum.isMises) return ethereum;
      if(ethereum.isMetaMask||ethereum._metamask) return ethereum;
      return ethereum;
    };
    const result=tryResolve(); if(result) return resolve(result);
    let attempts=0; const timer=setInterval(()=>{attempts++;const r=tryResolve();if(r){clearInterval(timer);return resolve(r);}if(attempts>30){clearInterval(timer);resolve(null);}},100);
  });
}


export const sbFetch=(path,opts={})=>fetch(SB_URL+path,{...opts,headers:{'apikey':SB_KEY,'Authorization':'Bearer '+SB_KEY,'Content-Type':'application/json','Prefer':'return=representation',...(opts.headers||{})}}).then(async r=>{if(!r.ok)throw new Error(await r.text());return r.json();});
export const sbInsert=(table,data)=>sbFetch('/rest/v1/'+table,{method:'POST',body:JSON.stringify(data)});
export const sbSelect=(table,query)=>sbFetch('/rest/v1/'+table+'?'+query);
export const sbUpdate=(table,query,data)=>sbFetch('/rest/v1/'+table+'?'+query,{method:'PATCH',body:JSON.stringify(data)});

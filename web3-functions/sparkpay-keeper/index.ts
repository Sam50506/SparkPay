import { Web3Function, Web3FunctionContext } from "@gelatonetwork/web3-functions-sdk";
import { Contract, ethers } from "ethers";

const SCHED_ADDR = "0xD8668A6b776e8b6aAcaAaad16240Bb57DcD89C57";

const SCHED_ABI = [
  "function paymentCount() external view returns (uint256)",
  "function getPayment(uint256 id) external view returns (tuple(address sender,address recipient,uint256 amount,uint256 releaseTime,bool executed,bool cancelled,string country))",
  "function execute(uint256 id) external",
];

Web3Function.onRun(async (context: Web3FunctionContext) => {
  const { multiChainProvider, secrets } = context;
  const provider = multiChainProvider.default();

  const supabaseUrl = await secrets.get("SUPABASE_URL");
  const supabaseKey = await secrets.get("SUPABASE_SERVICE_KEY");

  const contract = new Contract(SCHED_ADDR, SCHED_ABI, provider);
  const count = Number(await contract.paymentCount());
  const now = Math.floor(Date.now() / 1000);

  for (let i = 0; i < count; i++) {
    const p = await contract.getPayment(i);
    if (p.executed || p.cancelled || Number(p.releaseTime) > now) continue;

    const execData = contract.interface.encodeFunctionData("execute", [i]);

    const sendAmount = parseFloat(ethers.formatUnits(p.amount, 18));
    if (sendAmount >= 5 && supabaseUrl && supabaseKey) {
      try {
        await updateCashback(supabaseUrl, supabaseKey, p.sender, sendAmount);
      } catch (e: any) {
        console.error("Cashback update failed:", e.message);
      }
    }

    return { canExec: true, callData: [{ to: SCHED_ADDR, data: execData }] };
  }

  return { canExec: false, message: `No payments due (checked ${count}, now=${now})` };
});

async function updateCashback(sbUrl: string, sbKey: string, sender: string, sendAmount: number) {
  const cashbackAmt = parseFloat((sendAmount * 0.01).toFixed(3));
  const headers = { apikey: sbKey, Authorization: `Bearer ${sbKey}`, "Content-Type": "application/json" };

  const getRes = await fetch(`${sbUrl}/rest/v1/cashback_balances?wallet_address=eq.${sender}&select=*`, { headers });
  const rows: any[] = await getRes.json();
  const current = rows[0]?.pending_amount || 0;
  const newBalance = parseFloat((parseFloat(current) + cashbackAmt).toFixed(3));

  await fetch(`${sbUrl}/rest/v1/cashback_balances`, {
    method: "POST",
    headers: { ...headers, Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({ wallet_address: sender, pending_amount: newBalance, updated_at: new Date().toISOString() }),
  });
  console.log(`Cashback: +${cashbackAmt} for ${sender} → total ${newBalance}`);
}

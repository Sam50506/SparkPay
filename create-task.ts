import { AutomateSDK, TriggerType, Web3Function } from "@gelatonetwork/automate-sdk";
import { ethers } from "ethers";

const CHAIN_ID     = 5042002;
const RPC          = "https://rpc.testnet.arc.network";
const SCHED_ADDR   = "0xD8668A6b776e8b6aAcaAaad16240Bb57DcD89C57";
const W3F_IPFS_CID = process.env.W3F_CID!;
const PRIVATE_KEY  = process.env.KEEPER_PRIVATE_KEY!;

async function main() {
  if (!W3F_IPFS_CID) throw new Error("Set W3F_CID env var first");
  if (!PRIVATE_KEY)  throw new Error("Set KEEPER_PRIVATE_KEY env var");

  const provider = new ethers.JsonRpcProvider(RPC, CHAIN_ID);
  const wallet   = new ethers.Wallet(PRIVATE_KEY.startsWith("0x") ? PRIVATE_KEY : "0x" + PRIVATE_KEY, provider);

  const automate     = new AutomateSDK(CHAIN_ID, wallet);
  const web3Function = new Web3Function(CHAIN_ID, wallet);

  const { taskId, tx } = await automate.createBatchExecTask({
    name: "SparkPay — ScheduledPayment Keeper",
    execAddress: SCHED_ADDR,
    web3FunctionHash: W3F_IPFS_CID,
    web3FunctionArgs: {},
    trigger: { type: TriggerType.TIME, interval: 60 * 1000 },
  });
  await tx.wait();
  console.log("Task created! taskId:", taskId);
  console.log("Dashboard: https://app.gelato.network/task/" + taskId + "?chainId=" + CHAIN_ID);

  const secrets: Record<string, string> = {};
  if (process.env.REACT_APP_SUPABASE_URL) secrets["SUPABASE_URL"]         = process.env.REACT_APP_SUPABASE_URL;
  if (process.env.SUPABASE_SERVICE_KEY)   secrets["SUPABASE_SERVICE_KEY"] = process.env.SUPABASE_SERVICE_KEY;
  if (Object.keys(secrets).length) {
    await web3Function.secrets.set(secrets, taskId);
    console.log("Secrets uploaded ✓");
  }
}

main().catch((e) => { console.error(e.message); process.exit(1); });

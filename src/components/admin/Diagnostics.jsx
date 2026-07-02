import React from 'react';
import { ethers } from 'ethers';
import { SB_URL, SB_KEY, SCHED_ADDR, REMIT_ADDR, USDC_ADDR, ADMIN_ADDRESS } from '../../config';

const RPC = 'https://rpc.testnet.arc.network';
const SCHED_ABI = [
  'function paymentCount() external view returns (uint256)',
  'function getPayment(uint256 id) external view returns (tuple(address sender,address recipient,uint256 amount,uint256 releaseTime,bool executed,bool cancelled,string country))'
];
const ERC20_ABI = ['function balanceOf(address) view returns (uint256)'];

const STATUS = { pass: 'pass', fail: 'fail', warn: 'warn', loading: 'loading' };

function Badge({ status }) {
  const cfg = {
    pass:    { bg: 'rgba(23,229,176,.1)',  color: 'var(--cy)',  text: 'Pass'    },
    fail:    { bg: 'rgba(255,79,97,.1)',   color: 'var(--re)',  text: 'Fail'    },
    warn:    { bg: 'rgba(240,196,63,.1)',  color: '#f59e0b',    text: 'Warning' },
    loading: { bg: 'rgba(100,100,100,.1)', color: 'var(--tx3)', text: 'Checking...' },
  }[status] || {};
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: cfg.bg, color: cfg.color }}>
      {cfg.text}
    </span>
  );
}

function CheckRow({ label, status, detail }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--b0)', gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx1)', marginBottom: detail ? 3 : 0 }}>{label}</div>
        {detail && <div style={{ fontSize: 11, color: 'var(--tx3)', lineHeight: 1.5 }}>{detail}</div>}
      </div>
      <Badge status={status} />
    </div>
  );
}

export function Diagnostics() {
  const [checks, setChecks] = React.useState({});
  const [running, setRunning] = React.useState(false);
  const [lastRun, setLastRun] = React.useState(null);

  const setCheck = (key, status, detail) =>
    setChecks(prev => ({ ...prev, [key]: { status, detail } }));

  const run = async () => {
    setRunning(true);
    setChecks({});

    // 1. RPC
    setCheck('rpc', STATUS.loading);
    try {
      const start = Date.now();
      const provider = new ethers.JsonRpcProvider(RPC, { name: 'Arc Testnet', chainId: 5042002 });
      const block = await provider.getBlockNumber();
      const ms = Date.now() - start;
      setCheck('rpc', STATUS.pass, `Responding in ${ms}ms — latest block #${block}`);

      // 2. Schedule Contract
      setCheck('sched', STATUS.loading);
      try {
        const sched = new ethers.Contract(SCHED_ADDR, SCHED_ABI, provider);
        const count = Number(await sched.paymentCount());
        setCheck('sched', STATUS.pass, `${count} total payments on contract`);

        // 3. Overdue payments
        setCheck('overdue', STATUS.loading);
        try {
          const now = Math.floor(Date.now() / 1000);
          const overdue = [];
          for (let i = count - 1; i >= Math.max(0, count - 30); i--) {
            const p = await sched.getPayment(i);
            if (!p.executed && !p.cancelled && Number(p.releaseTime) <= now) {
              overdue.push(i);
            }
          }
          if (overdue.length === 0) {
            setCheck('overdue', STATUS.pass, 'No overdue payments found');
          } else {
            setCheck('overdue', STATUS.fail, `${overdue.length} payment(s) overdue — IDs: ${overdue.join(', ')}`);
          }
        } catch (e) {
          setCheck('overdue', STATUS.fail, e.message);
        }

      } catch (e) {
        setCheck('sched', STATUS.fail, e.message);
        setCheck('overdue', STATUS.fail, 'Could not check — schedule contract failed');
      }

      // 4. USDC Contract
      setCheck('usdc', STATUS.loading);
      try {
        const usdc = new ethers.Contract(USDC_ADDR, ERC20_ABI, provider);
        await usdc.balanceOf('0x0000000000000000000000000000000000000001');
        setCheck('usdc', STATUS.pass, `Contract at ${USDC_ADDR.slice(0,10)}... is responding`);
      } catch (e) {
        setCheck('usdc', STATUS.fail, e.message);
      }

      // 5. Admin wallet balance
      setCheck('gas', STATUS.loading);
      try {
        const bal = await provider.getBalance(ADMIN_ADDRESS);
        const arc = parseFloat(ethers.formatUnits(bal, 18));
        if (arc < 0.1) {
          setCheck('gas', STATUS.warn, `Low balance — ${arc.toFixed(4)} ARC. May not have enough gas.`);
        } else {
          setCheck('gas', STATUS.pass, `Admin wallet has ${arc.toFixed(4)} ARC`);
        }
      } catch (e) {
        setCheck('gas', STATUS.fail, e.message);
      }

    } catch (e) {
      setCheck('rpc', STATUS.fail, `RPC unreachable — ${e.message}`);
      setCheck('sched', STATUS.fail, 'Could not check — RPC failed');
      setCheck('overdue', STATUS.fail, 'Could not check — RPC failed');
      setCheck('usdc', STATUS.fail, 'Could not check — RPC failed');
      setCheck('gas', STATUS.fail, 'Could not check — RPC failed');
    }

    // 6. Supabase
    setCheck('supabase', STATUS.loading);
    try {
      const r = await fetch(`${SB_URL}/rest/v1/scheduled_payment_requests?limit=1`, {
        headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setCheck('supabase', STATUS.pass, 'Database connected and responding');
    } catch (e) {
      setCheck('supabase', STATUS.fail, e.message);
    }

    // 7. Keeper last run
    setCheck('keeper', STATUS.loading);
    try {
      const r = await fetch(`${SB_URL}/rest/v1/keeper_status?id=eq.1&select=last_run`, {
        headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
      });
      const d = await r.json();
      if (d && d[0]?.last_run) {
        const lastRun = new Date(d[0].last_run);
        const minsAgo = Math.floor((Date.now() - lastRun.getTime()) / 60000);
        if (minsAgo > 20) {
          setCheck('keeper', STATUS.warn, `Last run ${minsAgo} minutes ago — expected every 15 mins`);
        } else {
          setCheck('keeper', STATUS.pass, `Last run ${minsAgo} minutes ago at ${lastRun.toLocaleTimeString()}`);
        }
      } else {
        setCheck('keeper', STATUS.warn, 'No keeper run recorded in database');
      }
    } catch (e) {
      setCheck('keeper', STATUS.fail, e.message);
    }

    // 8. Pending requests
    setCheck('pending', STATUS.loading);
    try {
      const r = await fetch(`${SB_URL}/rest/v1/scheduled_payment_requests?status=eq.pending&select=id`, {
        headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${SB_KEY}` }
      });
      const d = await r.json();
      const count = d?.length || 0;
      if (count > 0) {
        setCheck('pending', STATUS.warn, `${count} request(s) waiting for your review`);
      } else {
        setCheck('pending', STATUS.pass, 'No pending requests');
      }
    } catch (e) {
      setCheck('pending', STATUS.fail, e.message);
    }

    setLastRun(new Date());
    setRunning(false);
  };

  const allDone = !running && Object.keys(checks).length > 0;
  const failCount = Object.values(checks).filter(c => c.status === STATUS.fail).length;
  const warnCount = Object.values(checks).filter(c => c.status === STATUS.warn).length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          {lastRun && <div style={{ fontSize: 11, color: 'var(--tx3)' }}>Last run: {lastRun.toLocaleTimeString()}</div>}
        </div>
        <button
          className="ap-btn ap-btn-primary"
          style={{ marginTop: 0, fontSize: 12, padding: '8px 18px' }}
          onClick={run}
          disabled={running}
        >
          {running ? 'Running...' : 'Run Diagnostics'}
        </button>
      </div>

      {allDone && (
        <div style={{ padding: '10px 14px', borderRadius: 10, marginBottom: 14, background: failCount > 0 ? 'rgba(255,79,97,.08)' : warnCount > 0 ? 'rgba(240,196,63,.08)' : 'rgba(23,229,176,.08)', border: `1px solid ${failCount > 0 ? 'rgba(255,79,97,.2)' : warnCount > 0 ? 'rgba(240,196,63,.2)' : 'rgba(23,229,176,.2)'}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: failCount > 0 ? 'var(--re)' : warnCount > 0 ? '#f59e0b' : 'var(--cy)' }}>
            {failCount > 0 ? `${failCount} issue(s) found` : warnCount > 0 ? `${warnCount} warning(s)` : 'All systems operational'}
          </div>
        </div>
      )}

      {[
        ['rpc',      'RPC Connection'],
        ['sched',    'Schedule Contract'],
        ['overdue',  'Overdue Payments'],
        ['usdc',     'USDC Contract'],
        ['gas',      'Admin Wallet Gas'],
        ['supabase', 'Supabase Database'],
        ['keeper',   'Keeper Last Run'],
        ['pending',  'Pending Requests'],
      ].map(([key, label]) => checks[key] ? (
        <CheckRow key={key} label={label} status={checks[key].status} detail={checks[key].detail} />
      ) : null)}
    </div>
  );
}

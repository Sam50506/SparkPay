import re

path = "src/hooks/useSchedule.js"
with open(path) as f:
    content = f.read()

old = "  'function paymentCount() external view returns (uint256)'\n];"
new = "  'function paymentCount() external view returns (uint256)',\n  'function getUserPayments(address user) external view returns (uint256[])'\n];"

if old not in content:
    print("PATCH FAILED: could not find the exact text to replace. No changes made.")
else:
    content = content.replace(old, new, 1)
    with open(path, "w") as f:
        f.write(content)
    print("PATCH OK: getUserPayments added to SCHED_ABI")

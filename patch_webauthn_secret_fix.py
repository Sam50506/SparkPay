path = "api/webauthn.js"
with open(path) as f:
    content = f.read()

old = "const JWT_SECRET = process.env.PAYOUT_JWT_SECRET;"
new = "const JWT_SECRET = process.env.PAYOUT_ADMIN_KEY;"

if old not in content:
    print("PATCH FAILED: line not matched.")
else:
    content = content.replace(old, new, 1)
    with open(path, "w") as f:
        f.write(content)
    print("PATCH OK: webauthn.js now signs with PAYOUT_ADMIN_KEY, matching every verifying endpoint (reject-claim, manual-execute, payout, schedule-request)")

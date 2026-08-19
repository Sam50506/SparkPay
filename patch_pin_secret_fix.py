path = "api/pin.js"
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
    print("PATCH OK: pin.js now signs and verifies with PAYOUT_ADMIN_KEY, matching every other endpoint")

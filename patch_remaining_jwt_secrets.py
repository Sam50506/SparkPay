paths = ["api/payout.js", "api/schedule-request.js"]
old = "const JWT_SECRET = process.env.PAYOUT_JWT_SECRET;"
new = "const JWT_SECRET = process.env.PAYOUT_ADMIN_KEY;"

for path in paths:
    with open(path) as f:
        content = f.read()
    if old not in content:
        print(f"{path}: FAILED - line not matched.")
        continue
    content = content.replace(old, new, 1)
    with open(path, "w") as f:
        f.write(content)
    print(f"{path}: PATCH OK")

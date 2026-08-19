path = "src/components/AdminPanel.jsx"
with open(path) as f:
    content = f.read()

old_import = "import { ManualExecute } from './admin/ManualExecute';"
new_import = "import { ManualExecute } from './admin/ManualExecute';\nimport { PendingScheduledList } from './admin/PendingScheduledList';"

old_section = """          <Section icon={<IC.Execute/>} title="Manual Execute">
            <Card title="Force Execute Payment" subtitle="Manually trigger a scheduled payment if the keeper bot fails.">
              <ManualExecute/>
            </Card>
          </Section>"""

new_section = """          <Section icon={<IC.Execute/>} title="Manual Execute">
            <Card title="Currently Scheduled Payments" subtitle="Active payments on-chain. Execute directly if the keeper bot fails.">
              <PendingScheduledList/>
            </Card>
            <Card title="Force Execute Payment" subtitle="Or enter a payment ID directly.">
              <ManualExecute/>
            </Card>
          </Section>"""

ok=True
if old_import not in content:
    print("STEP 1 FAILED: import line not matched."); ok=False
else:
    content=content.replace(old_import,new_import,1)
if old_section not in content:
    print("STEP 2 FAILED: section block not matched."); ok=False
else:
    content=content.replace(old_section,new_section,1)

with open(path,"w") as f:
    f.write(content)

print("PATCH OK: PendingScheduledList wired into AdminPanel above ManualExecute" if ok else "Partial failure - check above")

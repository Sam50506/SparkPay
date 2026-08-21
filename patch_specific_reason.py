path = "src/components/admin/PendingScheduledList.jsx"
with open(path) as f:
    content = f.read()

old = """              }else{
                status='stuck';
                failReason=chk.reason||'Unknown';
              }
            }catch(e){
              status='keeper_delayed';
            }
          }"""

new = """              }else{
                status='stuck';
                failReason=chk.reason||'Unknown';
                if(failReason==='Transfer failed'){
                  try{
                    const code=await provider.getCode(p.recipient);
                    if(code&&code!=='0x'){
                      failReason='Transfer failed - recipient is a contract with no payable receive/fallback function, so it cannot accept a plain USDC transfer';
                    }
                  }catch(_){}
                }
              }
            }catch(e){
              status='keeper_delayed';
            }
          }"""

if old not in content:
    print("PATCH FAILED: block not matched.")
else:
    content = content.replace(old, new, 1)
    with open(path, "w") as f:
        f.write(content)
    print("PATCH OK: contract-recipient detection added to explain Transfer failed cases")

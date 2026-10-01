import subprocess,os,re,json,datetime
from pathlib import Path
start=datetime.datetime.now(datetime.timezone.utc).isoformat()
env=os.environ.copy();env['CONFIRM_DEPLOY']='1'
p=subprocess.run(['/Users/ls/Claude-Workspace/personal/sigouin-net/deploy/deploy.sh',str(Path(__file__).resolve().parent/'site')],env=env,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True)
s=re.sub(r'\x1b\[[0-9;]*[A-Za-z]','',p.stdout)
s=re.sub(r'(?i)((?:api[_ -]?token|authorization|api[_ -]?key|secret|password)\s*[:=]\s*)(\S+)',r'\1[REDACTED]',s)
s=re.sub(r'\b[A-Za-z0-9_+/=-]{40,}\b','[REDACTED LONG VALUE]',s)
Path('deploy-output.txt').write_text(s)
Path('deployment.json').write_text(json.dumps({'exit_code':p.returncode,'started':start,'finished':datetime.datetime.now(datetime.timezone.utc).isoformat()},indent=2)+'\n')
print(s);raise SystemExit(p.returncode)

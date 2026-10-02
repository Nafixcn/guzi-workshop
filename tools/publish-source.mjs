// Fallback for unavailable Sites package helpers. Credentials are stdin-only.
import {spawn} from 'node:child_process';
import {readFile,access} from 'node:fs/promises';
import {resolve} from 'node:path';
import readline from 'node:readline';
process.stdout.write('Ready for private source credential on stdin (hidden).\n');
const input=await new Promise(r=>{const rl=readline.createInterface({input:process.stdin,terminal:false});rl.once('line',s=>{rl.close();r(JSON.parse(s));});});
const {credential:c,archive}=input,manifest=JSON.parse(await readFile('.openai/hosting.json','utf8'));
if(!c?.token||c.auth_mode!=='http_extra_header'||!c.remote_url?.startsWith('https://')||!manifest.project_id||!c.remote_url.includes(manifest.project_id)||!archive?.startsWith('/private/tmp/'))throw Error('Invalid publishing inputs');
const env={...process.env,GIT_TERMINAL_PROMPT:'0',GIT_CONFIG_COUNT:'1',GIT_CONFIG_KEY_0:'http.extraHeader',GIT_CONFIG_VALUE_0:`Authorization: Bearer ${c.token}`};
function run(args,auth=false){return new Promise((res,rej)=>{const p=spawn('/usr/bin/git',args,{env:auth?env:process.env,stdio:['ignore','pipe','pipe']});let out='',err='';p.stdout.on('data',b=>out+=b);p.stderr.on('data',b=>err+=b);p.on('close',code=>code===0?res(out.trim()):rej(Error(`Git operation failed (${code}): ${err.replaceAll(c.token,'[redacted]').slice(0,1200)}`)));p.on('error',rej);});}
try{let hasGit=true;try{await access('.git');}catch{hasGit=false;}
if(!hasGit){const remote=await run(['ls-remote','--heads',c.remote_url,`refs/heads/${c.branch}`],true);if(remote)throw Error('Remote already contains source; preserve files and reconcile before publishing');await run(['init','--initial-branch',c.branch,'.']);}
const root=await run(['rev-parse','--show-toplevel']);if(resolve(root)!==resolve('.'))throw Error('Project checkout root mismatch');
await run(['add','--all','--','.']);const diff=await run(['diff','--cached','--name-only']);if(diff)await run(['-c','user.name=Sites','-c','user.email=sites@users.noreply.openai.com','commit','-m','Build Guzi Workshop local editor']);
const sha=await run(['rev-parse','HEAD']);await run(['push',c.remote_url,`HEAD:refs/heads/${c.branch}`],true);const remote=await run(['ls-remote','--heads',c.remote_url,`refs/heads/${c.branch}`],true);if(!remote.startsWith(sha+'\t'))throw Error('Pushed commit verification failed');
await run(['archive','--format=tar.gz','-o',archive,sha,'dist','.openai/hosting.json']);console.log(JSON.stringify({project_id:manifest.project_id,commit_sha:sha,archive}));
}catch(e){console.error(e.message);process.exitCode=1;}

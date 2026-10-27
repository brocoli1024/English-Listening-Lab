const {execFileSync}=require('node:child_process');
const path=require('node:path');
const {resolveTools}=require('../desktop/tools.cjs');
const tools=resolveTools(path.resolve('desktop/vendor'));
for(const [name,exe] of Object.entries(tools)) {
  const args=name==='ytDlp'?['--ignore-config','--no-plugin-dirs','--no-remote-components','--version']:name==='node'?['--version']:['-version'];
  const output=execFileSync(exe,args,{windowsHide:true,encoding:'utf8',env:{...process.env,PATH:''},timeout:30000});
  console.log(`${name}: ${output.split(/\r?\n/)[0]}`);
}
const help=execFileSync(tools.ytDlp,['--ignore-config','--help'],{windowsHide:true,encoding:'utf8'});
for(const flag of ['--no-plugin-dirs','--no-remote-components','--js-runtimes','--no-js-runtimes']) if(!help.includes(flag)) throw Error(`Unsupported downloader option: ${flag}`);
console.log('PASS: bundled absolute tools work without PATH; downloader isolation options available');

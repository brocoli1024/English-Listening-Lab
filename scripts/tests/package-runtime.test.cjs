const test=require('node:test');
const a=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const os=require('node:os');
const {checkPackage}=require('../check-desktop-package.cjs');

test('package validation rejects Deno even when hidden below a legacy resource directory',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'package-runtime-'));
 try{
  fs.mkdirSync(path.join(root,'resources/tools/legacy'),{recursive:true});
  fs.writeFileSync(path.join(root,'resources/tools/legacy/DENO.EXE'),'legacy');
  a.throws(()=>checkPackage(root),/Deno/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});

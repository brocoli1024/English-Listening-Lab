const fs=require('fs'),zlib=require('zlib'),crypto=require('crypto');
const b=fs.readFileSync('desktop/vendor/yt-dlp.exe');const pos=b.lastIndexOf(Buffer.from([77,69,73,12,11,10,11,14]));if(pos<0)throw Error('No PyInstaller cookie');
const length=b.readUInt32BE(pos+8),offset=b.readUInt32BE(pos+12),size=b.readUInt32BE(pos+16),base=pos+88-length;
const entries=[];for(let p=base+offset;p<base+offset+size;){const n=b.readUInt32BE(p);if(n<18||p+n>base+offset+size)throw Error('Bad TOC');const name=b.subarray(p+18,p+n).toString().replace(/\0.*$/s,'');const entry={name,compressedSize:b.readUInt32BE(p+8),size:b.readUInt32BE(p+12),type:String.fromCharCode(b[p+17])};entries.push(entry);if(/(?:METADATA|WHEEL)$/.test(name)){const raw=b.subarray(base+b.readUInt32BE(p+4),base+b.readUInt32BE(p+4)+entry.compressedSize);const data=b[p+16]?zlib.inflateSync(raw):raw;entry.metadata=data.toString();}p+=n;}
fs.writeFileSync('docs/release/yt-dlp-executable-inventory.json',JSON.stringify({sha256:crypto.createHash('sha256').update(b).digest('hex'),pythonVersion:b.readUInt32BE(pos+20),entries},null,2)+'\n');
console.log(entries.filter(e=>/\.dll$|\.pyd$|dist-info/i.test(e.name)).map(e=>e.name).join('\n'));

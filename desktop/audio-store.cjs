const fs = require('node:fs/promises');
const path = require('node:path');
const {randomUUID} = require('node:crypto');
const MAX_AUDIO = 50*1024*1024;
function validateId(id) {
  if (typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,120}$/.test(id)) throw new Error('歌曲識別碼無效。');
}
async function validFile(file) {
  const stat = await fs.lstat(file);
  if (!stat.isFile() || stat.isSymbolicLink() || stat.size < 1 || stat.size > MAX_AUDIO) throw new Error('音檔需介於 1 byte 與 50 MB 之間。');
  return stat;
}
function createAudioStore(root, sourceForToken) {
  root = path.resolve(root);
  async function file(id) {
    validateId(id);
    const names = await fs.readdir(root);
    const name = names.find(name => name.startsWith(id+'.') && /\.(mp3|m4a|wav|ogg|aac)$/.test(name));
    if (!name) { const error = new Error('找不到已匯入音檔，請重新匯入。'); error.code = 'ENOENT'; throw error; }
    const target = path.join(root,name);
    await validFile(target);
    return target;
  }
  return {
    file,
    async save(id,input,owner) {
      validateId(id);
      let bytes, source, extension;
      if (input?.kind === 'bytes') {
        bytes = input.bytes;
        if (!(bytes instanceof Uint8Array) || !bytes.byteLength || bytes.byteLength > MAX_AUDIO) throw new Error('音檔需介於 1 byte 與 50 MB 之間。');
        extension = typeof input.name === 'string' ? path.extname(input.name).toLowerCase() : '';
        if (!/^\.(mp3|m4a|wav|ogg|aac)$/.test(extension)) throw new Error('不支援這種音檔格式。');
      } else if (input?.kind === 'download' && sourceForToken) {
        source = await sourceForToken(input.token,owner);
        await validFile(source);
        extension = '.mp3';
      } else throw new Error('音檔來源無效。');
      await fs.mkdir(root,{recursive:true});
      if ((await fs.readdir(root)).some(name => name.startsWith(id+'.'))) throw new Error('歌曲音檔已存在。');
      const temporary = path.join(root,`${id}.${randomUUID()}.tmp`);
      const target = path.join(root,id+extension);
      try {
        if (source) await fs.copyFile(source,temporary); else await fs.writeFile(temporary,bytes,{flag:'wx'});
        await validFile(temporary);
        await fs.rename(temporary,target);
      } finally { await fs.rm(temporary,{force:true}); }
      return `app://studio/audio/${id}`;
    },
    async resolve(id) { await file(id); return `app://studio/audio/${id}`; },
    async remove(id) {
      validateId(id);
      try { await fs.unlink(await file(id)); }
      catch (error) { if (error.code !== 'ENOENT') throw error; }
    },
  };
}
module.exports = {createAudioStore,validateId,validFile,MAX_AUDIO};

const pages = require('./project-links.json');
async function openProjectPage(key, launch) {
  if (typeof key !== 'string' || !Object.hasOwn(pages, key)) throw new Error('專案頁面無效。');
  try {
    const open = launch || require('electron').shell.openExternal;
    await open(pages[key]);
  } catch { throw new Error('無法開啟瀏覽器，請稍後再試，或手動前往專案 GitHub 頁面。'); }
}
module.exports = {openProjectPage};

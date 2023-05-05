const fs = require('fs/promises');
const path = require('path');

const getStats = async (filepath) => {
  const filestat = await fs.stat(filepath);
  const filepart = path.parse(filepath);
  return [filepart.name, filepart.ext.slice(1), filestat.size / 1024 + 'KiB']
    .filter(Boolean)
    .join(' - ');
};

// const getFilesDeep = async (directory = __dirname) => {
//   const entries = await fs.readdir(directory, { withFileTypes: true });
//   const files = [];
//   for (const entry of entries) {
//     const entrypath = path.join(directory, entry.name);
//     if (entry.isDirectory()) {
//       files.push(...(await getFilesDeep(entrypath)));
//     } else {
//       files.push(entrypath);
//     }
//   }
//   return files;
// };

const getFilesShallow = async (directory = __dirname) => {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  return entries.reduce((files, entry) => {
    const entrypath = path.join(directory, entry.name);
    return entry.isFile() ? [...files, entrypath] : files;
  }, []);
};

(async () => {
  const filenames = await getFilesShallow(path.join(__dirname, 'secret-folder'));
  const stats = await Promise.all(filenames.map(getStats));
  stats.forEach((s) => console.log(s));
})();

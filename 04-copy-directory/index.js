const fs = require('fs/promises');
const path = require('path');

const copyDirDeep = async ({ from, into }) => {
  const toCopy = await fs.readdir(from, { withFileTypes: true });
  for (const entry of toCopy) {
    const srcpath = path.join(from, entry.name);
    const destpath = path.join(into, entry.name);
    const destfold = path.dirname(destpath);
    if (entry.isDirectory()) {
      await fs.mkdir(destpath, { recursive: true });
      await copyDirDeep({ from: srcpath, into: destpath });
    }
    if (entry.isFile()) {
      await fs.mkdir(destfold, { recursive: true });
      await fs.copyFile(srcpath, destpath);
    }
  }
};

const deleteIfExists = async (path, rmParams) => {
  const doesExist = Boolean(await fs.stat(path).catch(() => false));
  if (doesExist) {
    await fs.rm(path, rmParams);
  }
};

const COPY_FROM = path.join(__dirname, 'files');
const COPY_INTO = path.join(__dirname, 'files-copy');

(async () => {
  await deleteIfExists(COPY_INTO, { recursive: true });
  copyDirDeep({
    from: COPY_FROM,
    into: COPY_INTO,
  });
})();

const fs = require('fs/promises');
const path = require('path');

const writeManyToOne = async ({ from = [], into, mkdir = false }) => {
  if (mkdir) {
    await fs.mkdir(path.dirname(into), { recursive: true });
  }
  await fs.writeFile(into, '');
  for (const combineEntry of from) {
    const content = await fs.readFile(combineEntry);
    await fs.appendFile(into, content + '\n');
  }
};

const getFilesDeep = async (directory = __dirname) => {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const entrypath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await getFilesDeep(entrypath)));
    } else {
      files.push(entrypath);
    }
  }
  return files;
};

(async () => {
  const filesInsideStylesFolder = await getFilesDeep(
    path.join(__dirname, 'styles')
  );
  const cssFiles = filesInsideStylesFolder.filter(
    (filename) => path.extname(filename) === '.css'
  );
  writeManyToOne({
    from: cssFiles,
    into: path.join(__dirname, 'project-dist/bundle.css'),
    mkdir: true,
  });
})();

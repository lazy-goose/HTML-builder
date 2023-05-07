const fs = require('fs/promises');
const path = require('path');

async function* getFilesRecursiveGenerator(directory) {
  const directEntries = await fs.readdir(directory, { withFileTypes: true });
  for (const entry of directEntries) {
    const entryPath = path.resolve(directory, entry.name);
    if (entry.isDirectory()) {
      yield* getFilesRecursive(entryPath);
    } else {
      yield entryPath;
    }
  }
}

const getFilesRecursive = async (directory) => {
  const files = [];
  for await (const f of getFilesRecursiveGenerator(directory)) {
    files.push(f);
  }
  return files;
};

const combineHTML = async ({
  startFile,
  outputFile,
  components = [],
  checkExtension,
}) => {
  if (!Array.isArray(components)) {
    components = String(components);
    const stats = await fs.lstat(components);
    if (stats.isDirectory()) {
      components = [components, ...(await getFilesRecursive(components))];
    }
    if (stats.isFile()) {
      components = [components];
    }
  }

  if (checkExtension) {
    const EXT = '.html';
    components = components.filter((c) => path.extname(c) === EXT);
    if (path.extname(startFile) !== EXT) {
      throw new Error(`Wrong extension of startFile:${startFile}`);
    }
    if (path.extname(outputFile) !== EXT) {
      throw new Error(`Wrong extension of outputFile:${outputFile}}`);
    }
  }

  let content;

  try {
    const buffer = await fs.readFile(startFile);
    content = buffer.toString();
  } catch (e) {
    throw new Error(`Cannot read file ${startFile}`);
  }

  const marker = { open: '{{', close: '}}' };
  const chars = '[a-z0-9.]';
  const matches = content.matchAll(
    new RegExp(`${marker.open}${chars}*${marker.close}`, 'gi')
  );

  const cache = {};

  const prettify = (replaceWith, match) => {
    let paddingLeft = 0;
    for (let i = match.index - 1; i >= 0; i--) {
      if (!match.input[i]) break;
      if (match.input[i] === '\n') break;
      if (match.input[i] !== ' ') break;
      paddingLeft += 1;
    }
    replaceWith = replaceWith.replace(/^(.)/gm, `${' '.repeat(paddingLeft)}$1`);
    replaceWith = replaceWith.trimStart();
    return replaceWith;
  };

  for (const m of matches) {
    const occurance = m[0];
    const name = occurance.slice(marker.open.length, -marker.close.length);
    const componentPath = components.find((e) => path.parse(e).name === name);
    if (!componentPath) {
      throw new Error(`No such component: ${occurance}`);
    }
    let replaceWith;
    if (componentPath in cache) {
      replaceWith = cache[componentPath];
    } else {
      const content = await fs.readFile(componentPath);
      cache[componentPath] = replaceWith = content.toString();
    }
    const pretty = prettify(replaceWith, m);
    content = content.replace(occurance, pretty);
  }

  await fs.mkdir(path.dirname(outputFile), { recursive: true });
  await fs.writeFile(outputFile, content);
};

const combineCSS = async ({ outputFile, components = [], checkExtension }) => {
  if (!Array.isArray(components)) {
    components = String(components);
    const stats = await fs.lstat(components);
    if (stats.isDirectory()) {
      components = [components, ...(await getFilesRecursive(components))];
    }
    if (stats.isFile()) {
      components = [components];
    }
  }

  if (checkExtension) {
    const EXT = '.css';
    components = components.filter((c) => path.extname(c) === EXT);
    if (path.extname(outputFile) !== EXT) {
      throw new Error(`Wrong extension of outputFile:${outputFile}}`);
    }
  }

  let content = [];

  for (const component of components) {
    const innerText = await fs.readFile(component, { encoding: 'utf-8' });
    content = [...content, innerText];
  }

  content = content.join('\n');

  await fs.mkdir(path.dirname(outputFile), { recursive: true });
  await fs.writeFile(outputFile, content);
};

const deepDirCopy = async ({ from, to }) => {
  const toCopy = await fs.readdir(from, { withFileTypes: true });
  for (const entry of toCopy) {
    const srcpath = path.join(from, entry.name);
    const destpath = path.join(to, entry.name);
    const destfold = path.dirname(destpath);
    if (entry.isDirectory()) {
      await fs.mkdir(destpath, { recursive: true });
      await deepDirCopy({ from: srcpath, to: destpath });
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

(async () => {
  const DIST = 'project-dist';

  await deleteIfExists(path.join(__dirname, DIST), { recursive: true });

  combineCSS({
    outputFile: path.join(__dirname, `${DIST}/style.css`),
    components: path.join(__dirname, 'styles'),
    checkExtension: true,
  });

  combineHTML({
    startFile: path.join(__dirname, 'template.html'),
    outputFile: path.join(__dirname, `${DIST}/index.html`),
    components: path.join(__dirname, 'components'),
    checkExtension: true,
  });

  deepDirCopy({
    from: path.join(__dirname, 'assets'),
    to: path.join(__dirname, `${DIST}/assets`),
  });
})();

import * as dot from "dot";
import { promises as fs } from "fs";
import * as glob from "glob";
import * as mkdirp from "mkdirp";
import * as path from "path";

const tplDirectory = path.resolve(__dirname + "/../../tpl");

const templateSettings: dot.TemplateSettings = {
  evaluate: /\{\{([\s\S]+?(\}?)+)\}\}/g,
  interpolate: /\{\{=([\s\S]+?)\}\}/g,
  encode: /\{\{!([\s\S]+?)\}\}/g,
  use: /\{\{#([\s\S]+?)\}\}/g,
  useParams: /(^|[^\w$])def(?:\.|\[[\'\"])([\w$\.]+)(?:[\'\"]\])?\s*\:\s*([\w$\.]+|\"[^\"]+\"|\'[^\']+\'|\{[^\}]+\})/g,
  define: /\{\{##\s*([\w\.$]+)\s*(\:|=)([\s\S]+?)#\}\}/g,
  defineParams: /^\s*([\w$]+):([\s\S]+)/,
  conditional: /\{\{\?(\?)?\s*([\s\S]*?)\s*\}\}/g,
  iterate: /\{\{~\s*(?:\}\}|([\s\S]+?)\s*\:\s*([\w$]+)\s*(?:\:\s*([\w$]+))?\s*\}\})/g,
  varname: "it",
  strip: false,
  append: true,
  selfcontained: false,
};

export interface TemplateFile {
  type: "tpl" | "file";
  path: string;
}

export const directoryExists = (filePath: string) => new Promise<boolean>((resolve) => {
  fs.stat(filePath)
    .then((stat) => resolve(stat.isDirectory()))
    .catch(() => resolve(false));
});

export const dumpFile = (filePath: string, content: Buffer) => new Promise<void>((resolve, reject) => {
  const chunks = filePath.split("/");
  const fileName = chunks[chunks.length - 1];
  const directory = filePath.replace(new RegExp(`${fileName}$`), "");

  mkdirp(directory, (error) => {
    if (error) {
      return reject(error);
    }
    fs.writeFile(filePath, content)
      .then(() => resolve())
      .catch(reject);
  });
});

export const createDirectory = (filePath: string) => fs.mkdir(filePath);
export const fileContent = (filePath: string) => fs.readFile(filePath, "utf8");
export const availableTemplates = () => fs.readdir(tplDirectory);

export const computeTargetFileRelativePath = (filePath: string, selectedTemplate: string) => {
  const fullPath = filePath.replace(new RegExp(`^(${tplDirectory}/${selectedTemplate}\.)`), "");

  return fullPath;
};

export const scanTemplateFiles = async (selectedTemplate: string) => new Promise<string[]>((resolve, reject) => {
  glob(`${tplDirectory}/${selectedTemplate}/**/*`, { dot: true }, (error, matches) => {
    if (error) {
      return reject(error);
    }
    resolve(matches);
  });
});

export const prepareTemplateCopy = (files: string[]): TemplateFile[] =>
  files.map<TemplateFile>((filePath) =>
    filePath.endsWith(".dot.jst")
      ? { type: "tpl", path: filePath }
      : { type: "file", path: filePath },
  );

export const generateTarget = async (projectName: string, selectedTemplate: string) => {
  const targetDirectory = `${process.cwd()}/${projectName}`;

  if (await directoryExists(targetDirectory)) {
    console.warn("Directory already exists");
    return;
  }

  await createDirectory(targetDirectory);

  const tplFiles = await scanTemplateFiles(selectedTemplate);
  const filesMeta = prepareTemplateCopy(tplFiles);
  const operations = filesMeta.map(async (fileMeta) => {
    try {
      const stat = await fs.stat(fileMeta.path);
      if (stat.isDirectory()) {
        return;
      }
      const content = await fileContent(fileMeta.path);
      const targetFilePath = computeTargetFileRelativePath(fileMeta.path, selectedTemplate)
        .replace(/\.dot\.jst$/, "");
      let text = content;

      if (fileMeta.type === "tpl") {
        const templateFn = dot.template(content, templateSettings);
        text = templateFn({ templateName: projectName });
      }
      return await dumpFile(`${targetDirectory}/${targetFilePath}`, Buffer.from(text));
    } catch (e) {
      console.error("Single error on " + JSON.stringify(fileMeta));
      console.error(e);
    }
  });

  await Promise.all(operations);
};

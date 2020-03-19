import { injectable } from "@msiviero/knit";
import * as fs from "fs";
import { JSZipObject, loadAsync } from "jszip";
import * as mkdirp from "mkdirp";
import { TemplateService } from "./tpl-service";

@injectable()
export class FilesystemService {

  constructor(
    private readonly templateService: TemplateService,
  ) { }

  public async uncompress(targetDir: string, name: string, bytes: Buffer) {
    const zipfile = await loadAsync(bytes);
    const archiveFiles = Object.entries(zipfile.files);

    const directoriesCreation = archiveFiles
      .map(this.normalizeFilePath(targetDir))
      .filter(([_, zipInfo]) => zipInfo.dir)
      .map(([file]) => this.makeDir(file));

    try {
      await Promise.all(directoriesCreation);
      console.log("Finished with directories");
    } catch (e) {
      console.error("Error while creating directories", e);
    }

    const dirFiles = archiveFiles
      .map(this.normalizeFilePath(targetDir))
      .filter(([_, zipInfo]) => !zipInfo.dir)
      .map(([file, zipInfo]): [string, Promise<Buffer>] => [file, zipInfo.async("nodebuffer")])
      .map(async ([file, buffer]) => file.endsWith(".jst")
        ? {
          path: file.replace(/\.jst$/, ""),
          content: this.templateService.compile(await buffer, {
            templateName: name,
          }),
        }
        : {
          path: file,
          content: await buffer,
        })
      .map(async (compiled) => {
        const file = await compiled;
        return fs.promises.writeFile(file.path, file.content);
      });

    try {
      await Promise.all(dirFiles);
      console.log("Finished with files");
    } catch (e) {
      console.error("Error while creating files", e);
    }
    return archiveFiles.length;
  }

  public formatBytes(size: number) {
    let i = -1;
    do {
      size = size / 1024;
      i++;
    } while (size > 1024);
    return Math.max(size, 0.1).toFixed(1) + [" kB", " MB", " GB"][i];
  }

  public directoryExists(filePath: string) {
    return new Promise<boolean>((resolve) => fs.stat(filePath, (err, stat) => {
      if (err) {
        return resolve(false);
      }
      resolve(stat.isDirectory());
    }));
  }

  private async makeDir(path: string) {
    try {
      await mkdirp(path);
    } catch (e) {
      console.error(`Error while creating dir [dir=${path}]`, e);
    }
  }

  private normalizeFilePath = (path: string) =>
    (value: [string, JSZipObject]): [string, JSZipObject] => {
      const [name, zipInfo] = value;
      const chunks = name.split("/").filter((chunk) => chunk.length > 0);
      return [`${path}/${chunks.slice(1, chunks.length).join("/")}`, zipInfo];
    }
}

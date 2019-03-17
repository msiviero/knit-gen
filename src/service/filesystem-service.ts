import { injectable } from "@msiviero/knit";
import * as fs from "fs";
import * as Jszip from "jszip";
import { JSZipObject } from "jszip";
import * as mkdirp from "mkdirp";
import { TemplateService } from "./tpl-service";

interface CompiledFile {
  path: string;
  content: Buffer;
}

@injectable()
export class FilesystemService {

  constructor(
    private readonly templateService: TemplateService,
  ) { }

  public async uncompress(targetDir: string, name: string, bytes: Buffer) {
    const zipfile = await Jszip.loadAsync(bytes);
    const archiveFiles = Object.entries(zipfile.files);
    archiveFiles
      .map(this.normalizeFilePath(targetDir))
      .forEach(async ([file, zipInfo]) => {
        if (zipInfo.dir) {
          return await this.makeDir(file);
        }

        const compiled: CompiledFile = file.endsWith(".dot.jst")
          ? {
            path: file.replace(/\.dot\.jst$/, ""),
            content: this.templateService.compile(await zipInfo.async("nodebuffer"), {
              templateName: name,
            }),
          }
          : {
            path: file,
            content: await zipInfo.async("nodebuffer"),
          };

        await new Promise((resolve, reject) => {
          fs.writeFile(compiled.path, compiled.content, (err) => {
            if (err) {
              return reject(err);
            }
            resolve();
          });
        });
      });

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

  private makeDir(path: string): Promise<void> {
    return new Promise((resolve, reject) => {
      mkdirp(path, (error) => {
        if (error) {
          return reject(error);
        }
        resolve();
      });
    });
  }

  private normalizeFilePath = (path: string) =>
    (value: [string, JSZipObject]): [string, JSZipObject] => {
      const [name, zipInfo] = value;
      const chunks = name.split("/").filter((chunk) => chunk.length > 0);
      return [`${path}/${chunks.slice(1, chunks.length).join("/")}`, zipInfo];
    }
}

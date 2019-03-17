import { injectable } from "@msiviero/knit";
import { h, Logger } from "../logger";
import { FilesystemService } from "./filesystem-service";
import { GitClient } from "./git-client";

export interface ProjectOptions {
  template: string;
  name: string;
}

@injectable()
export class ProjectService {

  constructor(
    private readonly log: Logger,
    private readonly git: GitClient,
    private readonly filesystem: FilesystemService,
  ) { }

  public async generate(opts: ProjectOptions) {
    if (await this.filesystem.directoryExists(opts.name)) {
      return this.log.warn(`Directory ${opts.name} already exist. I refuse to overwrite it`);
    }

    this.log.info("Fetching remote template");
    const bytes: Buffer = await this.git.fetchRemoteTemplate(opts.template);
    this.log.info(`${h(this.filesystem.formatBytes(bytes.length))} downloaded`);

    this.log.info("Extracting template");
    try {
      const howMany = await this.filesystem.uncompress(opts.name, opts.name, bytes);
      this.log.info(`Extracted ${h(howMany.toString())} files`);
      this.log.info(`Done! Project created successfully`);
    } catch (error) {
      this.log.error(`Error while extracting archive: ${h(error)}`);
    }
  }
}

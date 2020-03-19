import { env, injectable } from "@msiviero/knit";
import * as https from "https";
import { RequestOptions } from "https";
import * as url from "url";
import { h, Logger } from "../logger";

interface HasName { name: string }

@injectable()
export class GitClient {

  private defaultHttpOpts: RequestOptions = {
    hostname: "api.github.com",
    headers: { "User-Agent": this.gitHttpUserAgent },
  };

  constructor(
    private readonly log: Logger,
    @env("GIT_USER", "msiviero") private readonly gitUser: string,
    @env("GIT_TPL_PREFIX", "knit-tpl") private readonly gitTplPrefix: string,
    @env("GIT_HTTP_USER_AGENT", "knit-tpl") private readonly gitHttpUserAgent: string,
  ) { }

  public fetchAvailableTemplates = (): Promise<string[]> => new Promise((resolve, reject) => {
    https.get({
      ...this.defaultHttpOpts,
      path: `/users/${this.gitUser}/repos`,
    }, (response) => {
      const chunks: Buffer[] = [];
      response
        .on("data", (chunk: Buffer) => chunks.push(chunk))
        .on("end", () => resolve(
          JSON.parse(Buffer.concat(chunks).toString())
            .filter((repo: HasName) => repo.name.startsWith(this.gitTplPrefix))
            .map((repo: HasName) => repo.name.replace(`${this.gitTplPrefix}-`, ""))))
        .on("error", reject);
    });
  })

  public async fetchRemoteTemplate(tpl: string): Promise<Buffer> {
    const link = await this.fetchZipballDownloadLink(tpl);
    this.log.info(`Download link is ${h(link)}`);

    return new Promise<Buffer>((resolve, reject) => {
      this.log.info("Starting project template download");
      const chunks: Buffer[] = [];

      const httpOpts = {
        ...this.defaultHttpOpts,
        ...url.parse(link),
      };

      https
        .get(httpOpts, (response) => {
          response
            .on("data", (chunk: Buffer) => chunks.push(chunk))
            .on("end", () => resolve(Buffer.concat(chunks)))
            .on("error", reject);
        });
    });
  }

  private fetchZipballDownloadLink = (template: string) => new Promise<string>((resolve, reject) => https.get({
    hostname: "api.github.com",
    path: `/repos/${this.gitUser}/knit-tpl-${template}/zipball`,
    headers: { "User-Agent": "nodejs-client" },
  }, (response) => {
    if (response.statusCode === 302) {
      resolve(response.headers.location);
    }
    reject(`Wrong status code received [statusCode=${response.statusCode}]`);
  }))
}

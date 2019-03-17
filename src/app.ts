
import { Container, injectable } from "@msiviero/knit";
import * as inquirer from "inquirer";
import { h, Logger } from "./logger";
import { GitClient } from "./service/git-client";
import { ProjectOptions, ProjectService } from "./service/project-service";

@injectable()
class Application {

  constructor(
    private readonly log: Logger,
    private readonly git: GitClient,
    private readonly project: ProjectService,
  ) { }

  public async run() {

    const templates = await this.git.fetchAvailableTemplates();

    const answers = await inquirer
      .prompt<ProjectOptions>([{
        name: "template",
        type: "list",
        message: "What type of project would you like to generate?",
        choices: templates,
      }, {
        name: "name",
        type: "input",
        message: "Project name:",
        validate: (input: string) => /^([A-Za-z\-\_\d])+$/.test(input)
          ? true
          : "Project name may only include letters, numbers, underscores and hashes.",
      }]);

    this.log.info(`Starting ${h("knit-gen")} project configurer`);
    await this.project.generate(answers);
  }
}

export const runner = () => Container.getInstance().resolve(Application);

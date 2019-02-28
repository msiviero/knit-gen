#!/usr/bin/env node
import * as inquirer from "inquirer";
import { availableTemplates, generateTarget } from "./template";

interface ProjectAnswers {
  template: string;
  name: string;
}

export const runner = async () => {
  console.log();
  const answers = await inquirer
    .prompt<ProjectAnswers>([{
      name: "template",
      type: "list",
      message: "What type of app would you like to generate?",
      choices: await availableTemplates(),
    }, {
      name: "name",
      type: "input",
      message: "Project name:",
      validate: (input: string) => /^([A-Za-z\-\_\d])+$/.test(input)
        ? true
        : "Project name may only include letters, numbers, underscores and hashes.",
    }]);
  console.log();
  await generateTarget(answers.name, answers.template);
  console.log();
};

runner();

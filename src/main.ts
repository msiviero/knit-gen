#!/usr/bin/env node
import { promises as fs } from "fs";
import * as inquirer from "inquirer";
import { tplDirectory } from "./constants";

interface ProjectAnswers {
    template: string;
    name: string;
}

const validateProjectName = (input: string) => /^([A-Za-z\-\_\d])+$/.test(input)
    ? true
    : "Project name may only include letters, numbers, underscores and hashes.";

export const runner = async () => {

    const templates = await fs.readdir(tplDirectory);

    inquirer
        .prompt<ProjectAnswers>([{
            name: "template",
            type: "list",
            message: "What type of would you like to generate?",
            choices: templates,
        }, {
            name: "name",
            type: "input",
            message: "Project name:",
            validate: validateProjectName,
        }])
        .then((answers) => {
            console.log(answers);
        });
};

runner();

import { injectable } from "@msiviero/knit";
import chalk, { Chalk } from "chalk";

export type LogLevel = "INFO" | "WARN" | "ERROR";

export const h = chalk.greenBright;

@injectable()
export class Logger {

  public info = (msg: string) => this.log(msg, chalk.blueBright, "INFO");
  public warn = (msg: string) => this.log(msg, chalk.yellow, "WARN");
  public error = (msg: string) => this.log(msg, chalk.red, "ERROR");

  private log = (msg: string, color: Chalk, level: LogLevel) => console.log(`${color(level)} - ${msg}`);
}

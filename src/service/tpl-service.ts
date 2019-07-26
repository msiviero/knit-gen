import { injectable } from "@msiviero/knit";
import { template } from "lodash";

@injectable()
export class TemplateService {

  public compile(content: Buffer, data: object): Buffer {
    const templateFn = template(content.toString("utf-8"));
    const text = templateFn(data);
    return Buffer.from(text);
  }
}

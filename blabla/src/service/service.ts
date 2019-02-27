import { injectable } from "@msiviero/knit";

@injectable()
export class Service {

  public name(who: string = "world") {
    return who;
  }
}

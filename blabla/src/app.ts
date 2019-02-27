
import { Container, injectable } from "@msiviero/knit";
import { Service } from "./service/service";

@injectable()
class Application {

  constructor(private readonly service: Service) { }

  public run() {
    console.log(`hello ${this.service.name()}`);
  }
}

export const runner = () => {
  Container.getInstance().resolve(Application).run();
};


import { Container, HttpServer, injectable } from "@msiviero/knit";
import { Hello } from "./api/hello";

@injectable()
class Application {

  public run() {
    HttpServer
      .getInstance()
      .api(Hello)
      .start({ port: this.getPort() });
  }

  private getPort() {
    return parseInt(process.env.PORT || "8080", 10);
  }
}

export const runner = () => {
  Container.getInstance().resolve(Application).run();
};

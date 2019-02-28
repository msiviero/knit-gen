import { api, Exchange, HttpMethod, route } from "@msiviero/knit";
import { Service } from "../service/service";

@api()
export class Hello {

  constructor(
    private readonly service: Service,
  ) { }

  @route(HttpMethod.GET, "/hello")
  public async getEndpoint(exchange: Exchange) {
    exchange.response.send({ hello: this.service.name() });
  }
}

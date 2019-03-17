import { runner } from "../src/app";

describe("Main application", () => {

  it("should be able to be instantiated", () => {
    expect(runner).toBeDefined();
  });
});

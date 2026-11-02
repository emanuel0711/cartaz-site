import { describe, expect, it } from "vitest";
import { createBackup, parseBackup } from "./backup";
describe("local backup", () => {
  it("round trips valid local data", () => {
    const data = {
      designs: [],
      products: [],
      batches: [],
      brandName: "Economix",
      brandColor: "#248a4b",
    };
    expect(parseBackup(createBackup(data))).toEqual(data);
  });
  it("rejects unsupported versions", () =>
    expect(() =>
      parseBackup('{"schemaVersion":99,"exportedAt":"x","data":{}}'),
    ).toThrow());
});

import { describe, expect, it } from "vitest";
import { importTltHar } from "./tlt";

const response = (url: string, id: string | null, data: unknown[]) => ({
  request: {
    url,
    postData: { text: id ? JSON.stringify({ ID: id, TIPO: "CARTAZ" }) : "{}" },
  },
  response: { content: { text: JSON.stringify({ d: JSON.stringify(data) }) } },
});

describe("TLT HAR importer", () => {
  it("converts observed ASMX text and background responses", () => {
    const har = {
      log: {
        entries: [
          response("https://tlt/ws/GetCartazes", null, [
            { ID_DOCUMENTO: 7, NOME_DOC: "Offer", TAMANHO: "A3" },
          ]),
          response("https://tlt/ws/LerDesignText", "7", [
            {
              type: 1,
              name: "p1",
              plug_rect: {
                left: 37.795,
                top: 75.59,
                width: 377.95,
                height: 151.18,
              },
              html: '<p style="text-align:center"><span style="font-size:120px;font-family:Impact;color:#ff0000">MC_DESCRICAO</span></p>',
            },
          ]),
          response("https://tlt/ws/LerDesignBack", "7", [
            { type: 3, img_data: "data:image/png;base64,AAAA" },
          ]),
        ],
      },
    };
    const result = importTltHar(har);
    expect(result.designs).toHaveLength(1);
    expect(result.designs[0].elements[0]).toMatchObject({
      kind: "dynamic",
      token: "MC_DESCRICAO",
      field: "description",
      fontFamily: "Impact",
    });
    expect(result.designs[0].elements[0].x).toBeCloseTo(10, 1);
  });
  it("rejects malformed captures", () =>
    expect(() => importTltHar({})).toThrow(/valid HAR/));
});

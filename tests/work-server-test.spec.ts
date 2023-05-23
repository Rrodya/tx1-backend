import request from "supertest";
import {app} from "../src/app";

describe("test server", () => {
    it("should sever work on /api endpont", () => {
        expect(true).toBe(true);
    })
})

describe("/api", () => {
    it("should return status 200", async () => {
        await request(app)
            .get("/api")
            .expect(200, { message: "OK" });
    })
})
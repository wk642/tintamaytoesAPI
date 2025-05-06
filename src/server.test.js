import { describe, test, afterAll} from '@jest/globals';
import request from "supertest";
import app from "./server.js"
import "dotenv/config";

describe("GET /previous-threads", () => {
  test("should return all threads", async () => {
      return request(app)
          .get("/previous-threads")
          .expect('Content-Type', /json/)
          .expect(200)
  });
});

describe("POST /threads", () => {
  test("adds a new thread with player_name added", async () => {
      return request(app)
          .post("/threads")
          .send({player_name: "name"})
          .expect('Content-Type', /json/)
          .expect(201)
  });
});

describe("PUT /thread/:id/choice", () => {
  test("inserts the new questions and user choices to existing thread", async () => {
    const response = await request(app)
      .put("/thread/2/choice")
      .send({ 
        choice_id: 5,
        question_id: 6,
      })
      .expect('Content-Type', /json/);
    expect(response.status).toBe(200); 
  });
});

afterAll(()=> {app.server.close()});
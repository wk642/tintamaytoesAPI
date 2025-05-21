import { describe, test, afterAll, beforeEach, expect } from '@jest/globals'; // Added expect
import request from "supertest";
import app from "./server.js";
import "dotenv/config";

// Remove dbconnectionURL import as it's not used here and was incorrectly importing from server.js
// Remove the direct import of db, as it's being mocked.

// The mock for './database/db' needs to be before any code that might implicitly try to import it,
// and it should fully replace the module.
jest.mock("./database/db", () => ({
  oneOrNone: jest.fn(),
  many: jest.fn(),
  none: jest.fn(),
}));

// Now, after the mock, you can import the mocked db object.
// We need to import it here so that the tests can interact with the mocked functions.
import db from "./database/db";

describe("GET /previous-threads", () => {
  test("should return all threads", async () => {
      await request(app) // Added await
          .get("/previous-threads")
          .expect('Content-Type', /json/)
          .expect(200); // Removed return, added await
  });
});

describe("POST /threads", () => {
  test("adds a new thread with player_name added", async () => {
      await request(app) // Added await
          .post("/threads")
          .send({player_name: "test"})
          .expect('Content-Type', /json/)
          .expect(201); // Removed return, added await
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

describe("GET /threads/:id", () => {
  // It's good that you're resetting the mock before each test.
  beforeEach(() => {
    db.oneOrNone.mockReset();
  });

  test("should return the thread for a valid ID", async () => {
    const validThreadId = 1;
    const mockThread = { id: validThreadId, player_name: "Test Player", created_at: "2025-05-20T00:00:00Z" };

    db.oneOrNone.mockResolvedValue(mockThread);

    const response = await request(app)
      .get(`/threads/${validThreadId}`)
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response.body).toEqual(mockThread);
    // You might also want to assert that db.oneOrNone was called with the correct arguments.
    expect(db.oneOrNone).toHaveBeenCalledWith(expect.any(String), [validThreadId]);
  });

  test("should return 404 for a non-existent thread ID", async () => {
    const nonExistentThreadId = 999;
    db.oneOrNone.mockResolvedValue(null); // Simulate no thread found

    await request(app)
      .get(`/threads/${nonExistentThreadId}`)
      .expect(404); // Expect a 404 Not Found status
    expect(db.oneOrNone).toHaveBeenCalledWith(expect.any(String), [nonExistentThreadId]);
  });
});

afterAll(()=> {
  // Ensure the server instance has a close method. If `app` is an Express app,
  // the server object is usually returned by `app.listen()`.
  // If your `app` is just the Express app instance, and you start the server elsewhere for testing,
  // you might need to adjust how you get the server instance to close it.
  // Assuming `app.server` is indeed the http.Server instance.
  if (app.server && typeof app.server.close === 'function') {
    app.server.close();
  }
});
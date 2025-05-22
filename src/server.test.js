import { describe, test, afterAll, beforeEach, expect } from '@jest/globals'; // Added expect
import request from "supertest";
import app from "./server.js";
import "dotenv/config";

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
  beforeEach(() => {
    dbconnectionURL.oneOrNone.mockReset(); // Reset the mock before each test
  });

  test("should return the thread for a valid ID", async () => {
    const validThreadId = 1;
    const mockThread = { id: validThreadId, player_name: "Test Player", created_at: "2025-05-20T00:00:00Z" };

    // Mock the database response for a valid thread ID
    dbconnectionURL.oneOrNone.mockResolvedValue(mockThread);

    const response = await request(app)
      .get(`/threads/${validThreadId}`)
      .expect("Content-Type", /json/)
      .expect(200);

    // Assert the response matches the mock thread
    expect(response.body).toEqual(mockThread);

    // Assert the database query was called with the correct SQL and parameters
    expect(dbconnectionURL.oneOrNone).toHaveBeenCalledWith("SELECT * FROM threads WHERE id = $1", [validThreadId]);
  });

  test("should return 404 for a non-existent thread ID", async () => {
    const nonExistentThreadId = 999;

    // Mock the database response to simulate no thread found
    dbconnectionURL.oneOrNone.mockResolvedValue(null);

    const response = await request(app)
      .get(`/threads/${nonExistentThreadId}`)
      .expect("Content-Type", /json/)
      .expect(404);

    // Assert the response contains the correct error message
    expect(response.body).toHaveProperty("error", "Thread not found");

    // Assert the database query was called with the correct SQL and parameters
    expect(dbconnectionURL.oneOrNone).toHaveBeenCalledWith("SELECT * FROM threads WHERE id = $1", [nonExistentThreadId]);
  });

  test("should return 400 for an invalid thread ID (non-integer)", async () => {
    const invalidThreadId = "abc";

    const response = await request(app)
      .get(`/threads/${invalidThreadId}`)
      .expect("Content-Type", /json/)
      .expect(400);

    // Assert the response contains the correct error message
    expect(response.body).toHaveProperty("error", "Invalid thread ID");

    // Assert the database query was not called
    expect(dbconnectionURL.oneOrNone).not.toHaveBeenCalled();
  });
});
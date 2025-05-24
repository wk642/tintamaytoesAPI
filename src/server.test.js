import { describe, test, afterAll, beforeEach, expect } from '@jest/globals';
import request from "supertest";
import app from "./server.js";
import "dotenv/config";

// Mock the database module
const mockDb = {
  oneOrNone: jest.fn(),
  many: jest.fn(),
  none: jest.fn(),
  one: jest.fn(),
};

app.db = mockDb;

describe("GET /previous-threads", () => {
  test("should return all threads", async () => {
    const mockThreads = [
      {
        id: 2,
        player_name: "Winnie Wins",
        created_at: "2025-04-16T12:02:08.3076-05:00",
        completed_at: null,
        favorites: false
      },
      {
        id: 4,
        player_name: "Winnie Looses",
        created_at: "2025-04-16T12:02:40.857736-05:00",
        completed_at: null,
        favorites: false
      }
    ];
    
    mockDb.many.mockResolvedValue(mockThreads);

    const response = await request(app)
      .get("/previous-threads")
      .expect('Content-Type', /json/)
      .expect(200);
    
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(Number),
          player_name: expect.any(String),
          created_at: expect.any(String),
          completed_at: null,
          favorites: expect.any(Boolean)
        })
      ])
    );
  });
});

describe("POST /threads", () => {
  test("adds a new thread with player_name added", async () => {
    const newThread = {
      id: 2,
      player_name: "Winnie Wins",
      created_at: "2025-04-16T12:02:08.3076-05:00",
      completed_at: null,
      favorites: false
    };
    mockDb.one.mockResolvedValue(newThread);

    const response = await request(app)
      .post("/threads")
      .send({player_name: "Winnie Wins"})
      .expect('Content-Type', /json/)
      .expect(201);
    
    expect(response.body).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        player_name: "Winnie Wins",
        created_at: expect.any(String),
        completed_at: null,
        favorites: expect.any(Boolean)
      })
    );
  });
});

describe("PUT /thread/:id/choice", () => {
  test("inserts the new questions and user choices to existing thread", async () => {
    const mockUpdatedThread = {
      thread_id: 2,
      question_id: 4,
      choice_id: 5,
      created_at: "2025-04-16T12:18:14.107798-05:00",
      answered_at: null
    };
    mockDb.oneOrNone.mockResolvedValue(mockUpdatedThread);

    const response = await request(app)
      .put("/thread/2/choice")
      .send({
        choice_id: 5,
        question_id: 4,
      })
      .expect('Content-Type', /json/)
      .expect(200);
  });
});

describe("GET /threads/:id", () => {
  beforeEach(() => {
    mockDb.oneOrNone.mockReset();
  });

  test("should return the thread for a valid ID", async () => {
    const validThreadId = 2;
    const mockThread = { 
      id: validThreadId,
      player_name: "Winnie Wins",
      created_at: "2025-04-16T12:02:08.3076-05:00",
      completed_at: null,
      favorites: false
    };

    mockDb.oneOrNone.mockResolvedValue(mockThread);

    const response = await request(app)
      .get(`/threads/${validThreadId}`)
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response.body).toEqual(
      expect.objectContaining({
        id: validThreadId,
        player_name: expect.any(String),
        created_at: expect.any(String),
        completed_at: null,
        favorites: expect.any(Boolean)
      })
    );
    expect(mockDb.oneOrNone).toHaveBeenCalledWith(
      "SELECT * FROM threads WHERE id = $1",
      [validThreadId]
    );
  });

  test("should return 404 for a non-existent thread ID", async () => {
    const nonExistentThreadId = 999;
    mockDb.oneOrNone.mockResolvedValue(null);

    const response = await request(app)
      .get(`/threads/${nonExistentThreadId}`)
      .expect("Content-Type", /json/)
      .expect(404);

    expect(response.body).toHaveProperty("error", "Thread not found");
    expect(mockDb.oneOrNone).toHaveBeenCalledWith(
      "SELECT * FROM threads WHERE id = $1",
      [nonExistentThreadId]
    );
  });

  test("should return 400 for an invalid thread ID (non-integer)", async () => {
    const invalidThreadId = "abc";

    const response = await request(app)
      .get(`/threads/${invalidThreadId}`)
      .expect("Content-Type", /json/)
      .expect(400);

    expect(response.body).toHaveProperty("error", "Invalid thread ID");
    expect(mockDb.oneOrNone).not.toHaveBeenCalled();
  });
});

afterAll(() => {
  if (app.server && typeof app.server.close === 'function') {
    app.server.close();
  }
});
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request = require("supertest");
import { AppModule } from "@/app.module";
import { closeBetterAuthInstance } from "@/auth/auth";

/**
 * Smoke tests for the running application.
 *
 * These tests boot the real AppModule (and therefore the real database
 * connection), so they need a reachable DATABASE_URL. They do not write data.
 *
 * Set TEST_TOKEN to a valid Better Auth bearer token to enable the optional
 * authenticated smoke tests below.
 */
describe("Money Minder API (e2e)", () => {
  let app: INestApplication;
  const token = process.env.TEST_TOKEN;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix("api/v1", {
      exclude: ["hello", "ping", "health"],
    });
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await closeBetterAuthInstance();
  });

  describe("public endpoints", () => {
    it("GET /hello", () =>
      request(app.getHttpServer())
        .get("/hello")
        .expect(200)
        .expect("Hi there you fantastic person!"));

    it("GET /ping", () => request(app.getHttpServer()).get("/ping").expect(200).expect("pong 🎾"));

    it("GET /health", async () => {
      const response = await request(app.getHttpServer()).get("/health").expect(200);
      expect(response.body).toEqual({ status: "ok" });
    });

    it("GET /api/v1/phrases/daily-phrase", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/phrases/daily-phrase")
        .expect(200);
      // The endpoint may legitimately return null when no phrases are loaded.
      if (response.body) {
        expect(response.body).toHaveProperty("phrase");
        expect(response.body).toHaveProperty("movie");
        expect(response.body).toHaveProperty("character");
      }
    });
  });

  describe("authentication", () => {
    it("rejects unauthenticated ledger access with 401", () =>
      request(app.getHttpServer()).get("/api/v1/accounts").expect(401));

    it("rejects malformed bearer tokens with 401", () =>
      request(app.getHttpServer())
        .get("/api/v1/accounts")
        .set("Authorization", "Bearer not-a-real-token")
        .expect(401));

    (token ? it : it.skip)("GET /api/v1/auth/me with TEST_TOKEN", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("email");
    });

    (token ? it : it.skip)("GET /api/v1/accounts with TEST_TOKEN", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/v1/accounts")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});

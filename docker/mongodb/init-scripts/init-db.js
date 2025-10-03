// This script runs automatically when the MongoDB container is first created.
db = db.getSiblingDB("ai_quiz_platform");

db.createCollection("users");
db.createCollection("quizzes");
db.createCollection("attempts");

db.users.insertOne({
  email: "admin@example.com",
  passwordHash: "dummyhash", // Replace with real bcrypt hash in prod
  role: "admin",
  createdAt: new Date(),
});

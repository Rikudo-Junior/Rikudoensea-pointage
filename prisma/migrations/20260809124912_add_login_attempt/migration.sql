-- Tracks failed login attempts (stagiaire login and directeur dashboard login) to
-- enforce a temporary lockout after repeated failures.
CREATE TABLE "LoginAttempt" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),

    CONSTRAINT "LoginAttempt_pkey" PRIMARY KEY ("key")
);

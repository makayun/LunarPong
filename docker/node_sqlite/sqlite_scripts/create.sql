CREATE TABLE users (
    id       INTEGER PRIMARY KEY AUTOINCREMENT
                     UNIQUE,
    name     TEXT    UNIQUE
                     NOT NULL,
    password TEXT
);
CREATE UNIQUE INDEX users_id ON users (
    id
);

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

-- // *Наташа: Таблица логов игр
CREATE TABLE IF NOT EXISTS game_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player1_id INTEGER NOT NULL,
    player2_id INTEGER NOT NULL,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME,
    score1 INTEGER,
    score2 INTEGER,
    status TEXT,
    FOREIGN KEY (player1_id) REFERENCES users(id),
    FOREIGN KEY (player2_id) REFERENCES users(id)
);
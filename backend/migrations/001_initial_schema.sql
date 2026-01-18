-- Initial database schema for character-picker

-- Table: main_games (stores game configurations)
CREATE TABLE main_games (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(500),
    characters JSONB DEFAULT '[]',
    background JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: users (stores user accounts)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(320) UNIQUE NOT NULL,
    user_key VARCHAR(255) NOT NULL,
    token UUID,
    token_time BIGINT,
    new_user_data JSONB DEFAULT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: user_games (stores user game saves)
CREATE TABLE user_games (
    id VARCHAR(255) PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_data JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_main_games_title ON main_games(title);
CREATE UNIQUE INDEX idx_users_email ON users(LOWER(email));
CREATE INDEX idx_users_token ON users(token);
CREATE INDEX idx_user_games_user_id ON user_games(user_id);

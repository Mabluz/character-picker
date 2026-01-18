# Character Picker

A web application for randomly picking characters in board games. Perfect for game nights when players can't decide which characters to play.

## Supported Games

- Arcadia Quest
- Dark Souls: The Board Game
- Descent (Second Edition)
- Kingdom Death
- Marvel United
- Nemesis
- Rising Sun
- The Others
- Vast
- Vengeance
- Village Attacks
- Zombicide
- Zombicide: Black Plague / Green Horde

## Tech Stack

- **Frontend**: Vue.js 2 with Vuex and Vue Router
- **Backend**: Express.js with PostgreSQL for data storage
- **Infrastructure**: Docker for PostgreSQL

## Prerequisites

- Node.js >= 18.0.0
- Docker (for PostgreSQL)

## Getting Started

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd character-picker
npm install
```

### 2. Start PostgreSQL

```bash
docker compose up -d
```

### 3. Configure Environment

```bash
cp backend/.env.example backend/.env
```

The default configuration works for local development.

### 4. Start the Backend

```bash
npm run dev:backend
```

Backend runs on http://localhost:1337

On first startup, the backend will:
- Run database migrations automatically
- Load all games from `backend/games/` into the database

### 5. Start the Frontend

```bash
npm run dev:frontend
```

Frontend runs on http://localhost:8080

## Project Structure

```
character-picker/
├── backend/
│   ├── controllers/       # API route handlers
│   ├── service/           # Business logic
│   ├── games/             # Game data (JSON files)
│   ├── migrations/        # Database migrations
│   ├── config/            # Configuration
│   └── app.js             # Express server entry point
├── frontend/
│   ├── src/
│   │   ├── views/         # Vue components/pages
│   │   ├── store/         # Vuex state management
│   │   ├── router.js      # Vue Router configuration
│   │   └── App.vue        # Root component
│   └── public/            # Static assets
└── docker-compose.yml
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/game` | Get overview of all games |
| GET | `/game/:gamename` | Get specific game data |
| POST | `/usergame/:gamename` | Save user game |
| DELETE | `/usergame/:gamename` | Delete user game |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:frontend` | Start frontend dev server |
| `npm run dev:backend` | Start backend server |
| `npm run build` | Build frontend for production |
| `npm run lint` | Lint frontend code |
| `npm run format` | Format all code with Prettier |

## Adding New Games

1. Create a new folder in `backend/games/<game-name>/`
2. Add a `load.json` file with the game data:

```json
{
  "id": "game-name",
  "characters": [
    "Character Name|Category|Ability|game-name/image.png"
  ],
  "background": {
    "title": "Game Title",
    "url": "game-name/background/bg.jpg",
    "thumbnail": "game-name/background/thumbnail.jpg",
    "color": "black",
    "transparent": "0.3"
  },
  "settings": {
    "zoomHeight": "600",
    "contentContainer": "bigger"
  }
}
```

3. Restart the backend - the game will be loaded automatically

## Adding Database Migrations

To add a new migration:

1. Create a new file: `backend/migrations/002_your_change.sql`
2. Restart the backend - the migration runs automatically

Migration files are executed in alphabetical order, so use numeric prefixes (001, 002, etc.).

## License

ISC

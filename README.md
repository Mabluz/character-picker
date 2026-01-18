# Character Picker

A web application for randomly picking characters in board games. Perfect for game nights when players can't decide which characters to play.


## Tech Stack

- **Frontend**: Vue.js 2 with Vuex and Vue Router
- **Backend**: Express.js with PostgreSQL for data storage
- **Infrastructure**: Docker for PostgreSQL

## Prerequisites

- Node.js >= 18.0.0
- Docker (for PostgreSQL)

## Getting Started

### 1. Clone and Install Dependencies

Note: Remove the submodule if you dont have access.

```bash
git clone <repository-url>
cd character-picker
git submodule update --init --recursive
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
- Load all games from the `backend/games/` into the database

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
│   ├── games/             # Game data (JSON files / Git submodule - private repo)
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

## Game Data Management

The game data files are stored in a separate private Git repository as a Git submodule to keep the game assets and configurations private. This setup allows the main repository to remain public while protecting the copyrighted game content.

### Setting Up Game Data

After cloning the repository, initialize the submodule:

```bash
git submodule update --init --recursive
```

This will clone the private game data repository into `backend/games/`.

### For Contributors and Forks

If you are contributing to this project or have forked it:

1. **Existing Contributors**: The submodule should work automatically if you have access to the private repository.

2. **New Forks/Contributors**: Since the game data is in a private repository, you will need to:
   - Create your own private repository for game data
   - Add it as a submodule: `git submodule add <your-private-repo-url> backend/games`
   - Or create a local `backend/games/` folder with your own game data

The application will work with any valid game data structure - you can use the existing games as templates or create your own.

### Game Data Structure

Each game requires:
- A folder: `backend/games/<game-name>/`
- A `load.json` file with game configuration
- Optional: `background/` folder with images
- Optional: Additional subfolders for character images

## Adding Database Migrations

To add a new migration:

1. Create a new file: `backend/migrations/002_your_change.sql`
2. Restart the backend - the migration runs automatically

Migration files are executed in alphabetical order, so use numeric prefixes (001, 002, etc.).

## License

ISC

# The Long Game

A browser-based demographic strategy game where you guide a Mennonite community across generations. Author the community's doctrine, manage population growth, maintain cohesion, and navigate the tensions between cultural preservation and modernization.

**Core Tension**: Every mechanism that accelerates growth also accelerates cultural erosion. Success means figuring out which technologies and policies to *refuse*, not just which to adopt.

## 🎮 Game Overview

You start as a Mennonite community arriving in the Cayo District of Belize in 1960. Guide your colony through:
- **Population management** - Births, deaths, marriages, and departures
- **Doctrine authoring** - Control technology, marriage norms, schooling, and religious practices
- **Cohesion balancing** - Keep your community united while adapting to change
- **Economic development** - Manage land, treasury, and productivity
- **Strategic expansion** - Found daughter colonies and manage a federation

The game runs from 1960 to 2100 with annual turns. No real-time mechanics - just thoughtful decisions and their long-term consequences.

## 🛠 Tech Stack

- **Build Tool**: [Vite](https://vitejs.dev/)
- **Framework**: [React](https://react.dev/) 18.2
- **Language**: [TypeScript](https://www.typescriptlang.org/) 5.4
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) 4.4
- **Visualization**: [D3.js](https://d3js.org/) 7.8 for charts and demographics
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) 3.4 + shadcn/ui components
- **Persistence**: IndexedDB for auto-save and manual save slots
- **Testing**: [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

## 🚀 Getting Started

### Prerequisites
- Node.js (latest LTS recommended)
- npm (comes with Node.js)

### Installation

```bash
# Clone the repository
git clone https://github.com/happyherp/long-game.git
cd long-game

# Install dependencies
npm install
```

### Development

```bash
# Start the development server with hot reload
npm run dev
```

The game will be available at `http://localhost:5173` (or another port if 5173 is busy).

### Build

```bash
# Create a production build
npm run build

# Preview the production build locally
npm run preview
```

### Type Checking

```bash
# Run TypeScript type checking without emitting files
npm run typecheck
```

### Linting

```bash
# Lint the source code
npm run lint
```

### Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test -- --watch
```


## 🏗 Architecture Highlights

### Engine/UI Separation
The game engine is implemented as **pure functions with zero UI dependencies**. This enables:
- Full testability without React
- Deterministic replays with seeded RNG
- Potential for headless simulations or AI players

### Deterministic Game Engine
Every engine function that involves randomness takes a seeded PRNG:
```typescript
function tick(colony: Colony, doctrine: Doctrine, year: number, rng: RNG): TickResult
```

Identical seed + identical inputs = identical outputs across all platforms.

### Population Model
Uses **parallel typed arrays** for performance:
- Each person is a real individual with stable ID
- Arrays indexed by person ID: age, sex, cohesion, marital status, etc.
- Dead persons are compacted out (no tombstones)
- Scales to 10,000+ individuals in browser

### Doctrine System
The primary player interface is "The Fence Around the Community":
- Toggle technologies and policies on/off
- Each adoption is a concession to the outside world
- Each refusal is protection for the community
- Affects cohesion, productivity, visibility, and more

## 🎯 Key Features

- **Turn-based gameplay** - Annual ticks with "Next Year" button
- **Complex demography** - TFR compounding, age structures, sex ratios
- **Lineage tracking** - Both paternal and maternal lineages with inbreeding coefficients
- **Schism mechanics** - Colonies can split when modernity pressure exceeds cohesion
- **Persistent saves** - Auto-save to IndexedDB, manual save slots, JSON export/import
- **Deterministic replays** - Share seeds and watch identical games unfold
- **Annual reports** - Detailed feedback on births, deaths, departures, economics

## 📖 Documentation

- **[Game Design Document](GDD.md)** - Comprehensive game design details
- **[Phase 1 Plan](Phase1.md)** - Current development phase details
- **[Phase 2 Plan](Phase2.md)** - Upcoming development phase

## 🧪 Testing Strategy

The project emphasizes testing at multiple levels:

```bash
# Run all tests
npm run test

# Tests cover:
# - Engine functions (pure logic, deterministic)
# - Component rendering and interaction
# - Doctrine effects and edge cases
# - Deterministic replay validation
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Engine code must remain pure (no React/UI imports)
- All random behavior must use the seeded RNG system
- Write tests for new engine functions
- Follow TypeScript strict mode requirements
- Use Tailwind utilities for styling

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Inspired by real demographic mechanics and Mennonite history
- Historical basis: Spanish Lookout colony in Belize's Cayo District
- Game design principles from civilization survival and management games

---

**Made with ❤️ for those who think in generations, not quarters.**
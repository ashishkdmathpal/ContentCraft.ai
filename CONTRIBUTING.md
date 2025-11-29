# Contributing to ContentCraft AI

Thank you for your interest in contributing to ContentCraft AI! This document provides guidelines for contributing to the project.

## Code of Conduct

- Be respectful and professional
- Focus on constructive feedback
- Help create a welcoming environment for all contributors

## How to Contribute

### 1. Fork & Clone

```bash
git clone git@github.com:YOUR-USERNAME/ContentCraft.ai.git
cd ContentCraft.ai
npm install
```

### 2. Create a Branch

```bash
git checkout -b feature/your-feature-name
```

Use prefixes:
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation
- `refactor/` - Code refactoring
- `test/` - Tests

### 3. Make Changes

- Follow the existing code style
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

### 4. Test Your Changes

```bash
npm run lint        # Check for linting errors
npm run type-check  # TypeScript validation
npm run test        # Run tests (when available)
```

### 5. Submit Pull Request

- Push your branch to your fork
- Open a pull request to `main` branch
- Describe your changes clearly
- Link related issues

## Development Setup

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 16
- Git

### Local Development

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your values

# Start Docker services
docker-compose up -d

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

## Code Style

- Use TypeScript strict mode
- Follow ESLint rules
- Use Prettier for formatting
- Write self-documenting code
- Add comments only when necessary

## Commit Messages

Follow conventional commits:

```
feat: add LinkedIn OAuth integration
fix: resolve token refresh bug
docs: update API documentation
refactor: simplify auth middleware
test: add unit tests for JWT utilities
```

## License

By contributing, you agree that your contributions will be licensed under the AGPL-3.0 license.

All contributors retain copyright to their contributions but grant ContentCraft AI the right to use, modify, and distribute those contributions under the project's license.

## Questions?

Open an issue for:
- Bug reports
- Feature requests
- Documentation improvements
- General questions

---

**Copyright © 2025 Ashish KD Mathpal**

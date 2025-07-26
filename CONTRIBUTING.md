# Contributing to ThreatResearchHub

Thank you for your interest in contributing to ThreatResearchHub! This document provides guidelines and information for contributors.

## Code of Conduct

We are committed to providing a welcoming and inspiring community for all. Please read and follow our Code of Conduct.

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When creating a bug report, include:

- **Clear description** of the issue
- **Steps to reproduce** the behavior
- **Expected behavior** vs actual behavior
- **Screenshots** if applicable
- **Environment details** (OS, browser, Node.js version)

### Suggesting Features

Feature suggestions are welcome! Please provide:

- **Clear description** of the feature
- **Use case** explaining why this feature would be useful
- **Proposed implementation** if you have ideas

### Pull Requests

1. **Fork** the repository
2. **Create a branch** from `develop` for your feature
3. **Make your changes** following our coding standards
4. **Test your changes** thoroughly
5. **Commit** with descriptive messages
6. **Push** to your fork
7. **Create a Pull Request** with detailed description

## Development Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 13+
- Docker (optional)

### Local Development

```bash
# Clone your fork
git clone https://github.com/your-username/ThreatResearchHub.git
cd ThreatResearchHub

# Add upstream remote
git remote add upstream https://github.com/coleman74/ThreatResearchHub.git

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your configuration

# Start development server
npm run dev
```

### Database Setup

```bash
# Create database
createdb threatresearchhub_dev

# Run migrations
npm run db:push

# Seed development data (optional)
npm run db:seed
```

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Follow existing patterns for type definitions
- Use strict typing, avoid `any` when possible
- Document complex types with JSDoc comments

### React Components

- Use functional components with hooks
- Follow the existing component structure
- Use Shadcn/UI components when possible
- Implement proper error boundaries

### Styling

- Use Tailwind CSS for styling
- Follow existing design patterns
- Ensure responsive design
- Test in multiple browsers

### Backend

- Follow Express.js best practices
- Use proper error handling
- Implement input validation
- Document API endpoints

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests

- Write tests for new features
- Update tests when modifying existing code
- Aim for good test coverage
- Use descriptive test names

## Documentation

- Update README.md for significant changes
- Document new features in appropriate files
- Use clear, concise language
- Include code examples where helpful

## Git Workflow

### Branch Naming

- `feature/description` - New features
- `bugfix/description` - Bug fixes
- `hotfix/description` - Critical fixes
- `docs/description` - Documentation updates

### Commit Messages

Use conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting changes
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance tasks

Examples:
```
feat(api): add threat intelligence endpoint
fix(ui): resolve dashboard loading issue
docs(readme): update installation instructions
```

## Security Considerations

### Threat Intelligence Handling

- Never commit sensitive threat data
- Use appropriate data sanitization
- Follow responsible disclosure practices
- Respect data source terms of service

### Code Security

- Validate all user inputs
- Use parameterized queries
- Implement proper authentication
- Follow OWASP guidelines

## Performance Guidelines

### Frontend Performance

- Optimize component rendering
- Use lazy loading where appropriate
- Minimize bundle size
- Implement proper caching

### Backend Performance

- Use efficient database queries
- Implement proper indexing
- Use connection pooling
- Monitor API response times

## Release Process

### Version Numbering

We follow [Semantic Versioning](https://semver.org/):

- `MAJOR.MINOR.PATCH`
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes (backward compatible)

### Release Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] Version number updated
- [ ] CHANGELOG.md updated
- [ ] Security review completed

## Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and community support
- **Wiki**: For detailed documentation
- **Discord/Slack**: For real-time community chat (if available)

## Recognition

Contributors will be recognized in:

- README.md contributors section
- Release notes for significant contributions
- GitHub contributor statistics

## License

By contributing to ThreatResearchHub, you agree that your contributions will be licensed under the same license as the project (MIT License).

---

Thank you for contributing to ThreatResearchHub! Your efforts help make the security community stronger.
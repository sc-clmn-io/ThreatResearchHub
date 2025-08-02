# Contributing to ThreatResearchHub

We welcome contributions to ThreatResearchHub! This document provides guidelines for contributing to the project.

## Code of Conduct

By participating in this project, you agree to abide by our code of conduct. We are committed to providing a welcoming and inspiring community for all.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Install dependencies: `npm install`
4. Create a feature branch: `git checkout -b feature/your-feature-name`

## Development Guidelines

### Code Standards and Style Guide

- **JavaScript/TypeScript**: Follow ESLint and Prettier configurations
- **React Components**: Use functional components with hooks
- **File Naming**: Use kebab-case for files, PascalCase for components
- **Imports**: Use absolute imports with `@/` prefix for project files

### Code Quality Requirements

- All code must pass ESLint checks
- Components should include TypeScript types
- Follow existing patterns in the codebase
- Use meaningful variable and function names

## Testing Requirements and Procedures

### Unit Testing
- Write tests for all new functions and components
- Test coverage should be maintained above 80%
- Use Jest and React Testing Library

### Integration Testing
- Test API endpoints with realistic data
- Validate form submissions and user interactions
- Test security stack integrations with mock data

### Security Testing
- Validate all user inputs
- Test authentication and authorization flows
- Ensure PII sanitization works correctly

## Documentation Standards

### Code Documentation
- Add JSDoc comments for all public functions
- Include usage examples in complex components
- Document API endpoints with OpenAPI/Swagger

### User Documentation
- Update README.md for significant changes
- Add step-by-step guides for new features
- Include screenshots for UI changes

## Pull Request Process

### Before Submitting
1. Ensure your code follows the style guide
2. Run the full test suite: `npm test`
3. Update documentation as needed
4. Test your changes locally

### Submission Requirements
- Clear, descriptive title
- Detailed description of changes
- Link to related issues
- Include testing instructions

### Review Process
- All PRs require at least one review
- Address all reviewer feedback
- Maintain clean commit history
- Squash commits before merging

## Issue Reporting Guidelines

### Bug Reports
Include the following information:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, browser, versions)
- Screenshots or error logs if applicable

### Feature Requests
- Describe the problem you're trying to solve
- Explain your proposed solution
- Consider alternative approaches
- Discuss potential impact on existing features

### Security Issues
- **Do not** create public issues for security vulnerabilities
- Email security issues to: sc@clmn.io
- Include detailed reproduction steps
- Allow time for investigation before disclosure

## Development Environment Setup

### Prerequisites
- Node.js 18 or higher
- npm or yarn package manager
- Git for version control

### Local Development
```bash
# Clone the repository
git clone https://github.com/sc-clmn-io/ThreatResearchHub.git
cd ThreatResearchHub

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

### Environment Variables
Create a `.env.local` file with required variables:
```
DATABASE_URL=your_database_url
GITHUB_TOKEN=your_github_token
```

## Architecture Guidelines

### Frontend Development
- Use React 18 with TypeScript
- Follow component composition patterns
- Implement proper error boundaries
- Use TanStack Query for server state

### Backend Development
- Express.js with TypeScript
- Implement proper error handling
- Use Drizzle ORM for database operations
- Follow RESTful API conventions

### Database Changes
- Use Drizzle migrations for schema changes
- Never modify production data directly
- Test migrations on development environment first

## Commit Message Guidelines

Use conventional commit format:
```
type(scope): description

[optional body]

[optional footer(s)]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions or changes
- `chore`: Build process or auxiliary tool changes

Examples:
```
feat(auth): add multi-factor authentication
fix(api): resolve CORS issue with file uploads
docs(readme): update installation instructions
```

## Release Process

### Versioning
We follow Semantic Versioning (SemVer):
- MAJOR: Breaking changes
- MINOR: New features (backward compatible)
- PATCH: Bug fixes (backward compatible)

### Release Checklist
1. Update version in package.json
2. Update CHANGELOG.md
3. Create release notes
4. Tag the release
5. Deploy to production

## Community

### Communication
- GitHub Issues for bug reports and feature requests
- GitHub Discussions for questions and ideas
- Email sc@clmn.io for direct contact

### Recognition
Contributors will be recognized in:
- Project README
- Release notes
- Annual contributor acknowledgments

Thank you for contributing to ThreatResearchHub!
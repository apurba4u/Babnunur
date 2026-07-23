# Changelog

## [3.1.0] - 2026-07-19

### Added
- Release engineering automation (release.sh)
- Final launch report with deployment verification
- Production deployment scripts

### Improved
- Version bumped to 3.1.0 for production release
- Release process documentation

## [3.0.1] - 2026-07-19

### Added
- Persistent session management
- Automated test suite (14 unit tests)
- OpenAPI documentation with Swagger UI
- Memory cache abstraction
- Search result caching
- Security headers middleware
- Request metrics tracking

### Improved
- PDF processing robustness
- Session persistence across server restarts
- Code quality (ESLint clean)

### Fixed
- Duplicate Mongoose email index
- In-memory session storage replaced with database-backed sessions

## [3.0.0] - 2026-07-19

### Added
- Persistent Conversation Memory
- Multi-Agent System (6 agents)
- Advanced RAG (Hybrid Search, BM25)
- Knowledge Base
- Workflow Automation
- Plugin System
- Team Collaboration
- Admin Analytics
- Billing Foundation

### Changed
- Replaced console.log with console.info for production readiness
- Updated version to 3.0.0

## [2.1.0] - 2026-07-19

### Added
- Document Intelligence (PDF, DOCX, TXT, Markdown)
- Embeddings & Vector Search
- RAG (Retrieval-Augmented Generation)
- Web Search (DuckDuckGo)
- Tool Calling (Calculator, DateTime, UUID, JSON Formatter)
- AI Agent Orchestrator
- AI Workspace UI
- Docker production support
- CI/CD pipeline
- Request logging with IDs
- Health/readiness endpoints
- Compression middleware

### Fixed
- PDF parsing (migrated from pdf-parse to unpdf)
- Chunk service infinite loop
- Document processing OOM crashes

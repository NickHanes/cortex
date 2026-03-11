# Cortex – AI Study Companion (Backend)

Cortex is a Spring Boot backend application that demonstrates:

- REST API development
- PostgreSQL integration
- Full CRUD operations
- Global error handling
- Local AI integration using Ollama
- Clean architecture design

## Features

### Notes
- Create notes
- Read all notes
- Read note by ID
- Update notes
- Delete notes

### AI Integration
- Local AI summarization using Ollama
- No external API required
- Fully offline AI support

## Tech Stack

- Java 25
- Spring Boot
- Spring Data JPA
- PostgreSQL
- RestClient
- Ollama (Local AI)

## How To Run

1. Install PostgreSQL
2. Create database named `cortex`
3. Configure database credentials in `application.properties`
4. Install and run Ollama
5. Start the Spring Boot application
6. Use browser or API tool to test endpoints

## Example Endpoints

- `POST /notes`
- `GET /notes`
- `GET /notes/{id}`
- `PUT /notes/{id}`
- `DELETE /notes/{id}`
- `GET /notes/{id}/summarize`

---

Built as a learning project to practice backend development, AI integration, and cloud-ready architecture.

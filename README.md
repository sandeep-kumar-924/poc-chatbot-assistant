# POC Chat Assistant

A proof-of-concept chatbot application that allows users to query a PostgreSQL database using natural language. The application converts user questions into SQL queries and displays results with visualizations.

## Features

- 💬 **Natural Language Queries** - Ask questions about your data in plain English
- 🗄️ **SQL Generation** - Automatically generates SQL queries from user input
- 📊 **Data Visualization** - Displays results as tables and charts
- 🔍 **Query History** - Maintains conversation history
- 💾 **Smart Suggestions** - Pre-built query suggestions for quick analysis
- 🎨 **Dark Theme UI** - Modern, dark-themed interface

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database

### Frontend
- **React** - UI library
- **Plotly.js** - Data visualization

## Project Structure

```
poc-chatbot-assistant/
├── BACKEND/
│   ├── server.js       # Express server & API endpoints
│   └── package.json    # Backend dependencies
├── FRONTEND/
│   ├── src/
│   │   ├── App.js      # Main React component
│   │   └── index.js    # React entry point
│   ├── public/
│   │   └── index.html  # HTML template
│   └── package.json    # Frontend dependencies
├── package-lock.json   # Dependency lock file
└── README.md          # This file
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- PostgreSQL database

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd poc-chatbot-assistant
   ```

2. **Install backend dependencies**
   ```bash
   cd BACKEND
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../FRONTEND
   npm install
   ```

## Running the Application

### Start Backend Server
```bash
cd BACKEND
npm start
```
The server will run on `http://localhost:5000` (or your configured port)

### Start Frontend Development Server
```bash
cd FRONTEND
npm start
```
The frontend will open at `http://localhost:3000`

## Usage

1. Open the application in your browser
2. Choose from pre-built suggestions or type a custom question
3. The assistant will generate and execute a SQL query
4. View results as a table and/or chart visualization
5. Select the "Copy" button to copy the generated SQL

### Example Queries
- "Which customers haven't placed any order?"
- "Top 5 customers by total spend"
- "Products low on stock (< 10 units)"
- "Monthly revenue for this year"
- "Most sold products by quantity"

## Configuration

### Environment Variables (Backend)
Create a `.env` file in the `BACKEND` directory:
```
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
API_PORT=5000
```

## API Endpoints

### POST `/api/chat`
Sends a user message and receives AI-generated SQL query results.

**Request:**
```json
{
  "messages": [
    {"role": "user", "content": "Top 5 customers by spend"},
    {"role": "assistant", "content": "..."}
  ]
}
```

**Response:**
```json
{
  "answer": "Here are the top 5 customers...",
  "sql": "SELECT customer_id, SUM(amount) FROM orders GROUP BY customer_id ORDER BY SUM(amount) DESC LIMIT 5;",
  "columns": ["customer_id", "total_spend"],
  "rows": [...],
  "dbError": null
}
```

## Development

### File Structure
- `App.js` - Main React component with all UI components and state management
- `server.js` - Express backend with API routes and database queries

### Styling
Inline CSS-in-JS styling using the `S` object pattern for consistency

## Troubleshooting

- **Database Connection Error**: Verify PostgreSQL is running and `DATABASE_URL` is correct
- **Port Already in Use**: Change the port in server configuration or kill the process using the port
- **Dependencies Not Installed**: Run `npm install` in both BACKEND and FRONTEND directories

## Future Enhancements

- [ ] Authentication and user management
- [ ] Query result export (CSV, JSON)
- [ ] Advanced filtering and sorting options
- [ ] Query performance analytics
- [ ] Multi-database support
- [ ] Custom report generation

## License

[Add your license here]

## Contact

[Add contact information]

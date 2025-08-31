const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Create database directory if it doesn't exist
const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Database path
const dbPath = path.join(dbDir, 'cultureon.db');

// Create or open database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
  console.log('Connected to SQLite database');
});

// Read and execute init.sql
const initSQL = fs.readFileSync(path.join(__dirname, 'init.sql'), 'utf8');

// Split SQL statements and execute them
const statements = initSQL
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0);

// Execute each statement sequentially
function executeStatements(statements, index = 0) {
  if (index >= statements.length) {
    console.log('✅ Database initialization complete!');
    
    // Verify tables were created
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
      if (err) {
        console.error('Error verifying tables:', err);
      } else {
        console.log('📊 Created tables:', tables.map(t => t.name).join(', '));
      }
      
      // Close database
      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        } else {
          console.log('Database connection closed');
        }
        process.exit(0);
      });
    });
    return;
  }

  const statement = statements[index];
  console.log(`Executing statement ${index + 1}/${statements.length}...`);
  
  db.run(statement, (err) => {
    if (err) {
      console.error(`Error executing statement ${index + 1}:`, err);
      console.error('Statement:', statement.substring(0, 100) + '...');
      process.exit(1);
    } else {
      executeStatements(statements, index + 1);
    }
  });
}

// Start execution
console.log('🚀 Initializing CultureON Analytics database...');
executeStatements(statements);
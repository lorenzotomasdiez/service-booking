const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class Database {
  constructor(dbPath = process.env.AFIP_MOCK_DB_PATH || './data/afip.db') {
    this.dbPath = dbPath;
    this.db = null;
  }

  /**
   * Initialize database connection and create schema
   */
  async init() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        logger.info(`Created data directory: ${dataDir}`);
      }

      // Create database connection
      this.db = await this.connect();
      logger.info(`Database connected: ${this.dbPath}`);

      // Initialize schema
      await this.initSchema();
      logger.info('Database schema initialized');

      return this.db;
    } catch (error) {
      logger.error('Database initialization failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Create database connection
   */
  connect() {
    return new Promise((resolve, reject) => {
      const db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          reject(err);
        } else {
          // Enable foreign keys
          db.run('PRAGMA foreign_keys = ON');
          resolve(db);
        }
      });
    });
  }

  /**
   * Initialize database schema from schema.sql
   */
  async initSchema() {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    return new Promise((resolve, reject) => {
      this.db.exec(schema, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Run a query (INSERT, UPDATE, DELETE)
   */
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          logger.error('Database run error', { sql, error: err.message });
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  /**
   * Get single row
   */
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          logger.error('Database get error', { sql, error: err.message });
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  /**
   * Get all rows
   */
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          logger.error('Database all error', { sql, error: err.message });
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Close database connection
   */
  close() {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      this.db.close((err) => {
        if (err) {
          logger.error('Database close error', { error: err.message });
          reject(err);
        } else {
          logger.info('Database connection closed');
          resolve();
        }
      });
    });
  }

  /**
   * Get the database instance
   */
  getDb() {
    return this.db;
  }
}

// Singleton instance
let instance = null;

module.exports = {
  /**
   * Get database singleton instance
   */
  getInstance() {
    if (!instance) {
      instance = new Database();
    }
    return instance;
  },

  /**
   * Initialize database (call once on startup)
   */
  async init() {
    const db = this.getInstance();
    await db.init();
    return db;
  },

  /**
   * Close database connection
   */
  async close() {
    if (instance) {
      await instance.close();
      instance = null;
    }
  }
};

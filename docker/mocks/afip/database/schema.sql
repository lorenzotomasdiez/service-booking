-- AFIP Mock Server Database Schema
-- SQLite database for storing mock invoice data

-- Invoices table
-- Stores all generated mock invoices with CAE and tracking information
CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cae TEXT NOT NULL,                    -- Código de Autorización Electrónico (14 digits)
  cae_expiration TEXT NOT NULL,         -- CAE expiration date (YYYYMMDD format)
  invoice_number INTEGER NOT NULL,      -- Invoice number within POS
  pos INTEGER NOT NULL,                 -- Punto de Venta (point of sale)
  invoice_date TEXT NOT NULL,           -- Invoice date (YYYYMMDD format)
  invoice_type INTEGER NOT NULL,        -- Invoice type (1=A, 6=B, 11=C)
  total_amount REAL NOT NULL,           -- Total invoice amount in ARS
  iva_amount REAL NOT NULL,             -- IVA/VAT amount in ARS
  cuit_emisor TEXT NOT NULL,            -- CUIT of the issuer
  cuit_receptor TEXT,                   -- CUIT of the recipient (optional)
  tax_category INTEGER NOT NULL,        -- Tax category of issuer
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast CAE lookups
CREATE INDEX IF NOT EXISTS idx_cae ON invoices(cae);

-- Unique index to prevent duplicate invoice numbers per POS
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoice ON invoices(pos, invoice_number);

-- Index for CUIT lookups
CREATE INDEX IF NOT EXISTS idx_cuit_emisor ON invoices(cuit_emisor);

-- Index for date-based queries
CREATE INDEX IF NOT EXISTS idx_invoice_date ON invoices(invoice_date);

-- POS configuration table
-- Tracks the last invoice number for each point of sale
CREATE TABLE IF NOT EXISTS pos_config (
  pos INTEGER PRIMARY KEY,
  last_invoice_number INTEGER NOT NULL DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert default POS
INSERT OR IGNORE INTO pos_config (pos, last_invoice_number) VALUES (1, 0);

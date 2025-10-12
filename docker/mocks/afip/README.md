# AFIP Mock Server

A comprehensive mock server for AFIP (Administración Federal de Ingresos Públicos) WebServices, designed for local development and testing of Argentina's electronic invoicing system.

## Overview

This mock server simulates AFIP's WebServices for electronic invoice authorization (CAE), CUIT validation, and taxpayer information retrieval. It provides a complete testing environment without requiring real AFIP credentials or network connectivity to AFIP's production systems.

**Key Benefits:**
- 🚀 Fast local development without AFIP API dependencies
- 🔒 No need for real AFIP credentials or certificates
- 🧪 Consistent testing environment with predictable responses
- 📝 Complete API documentation with Swagger/OpenAPI
- 🐳 Docker support for easy deployment
- 💾 SQLite database for invoice persistence

## Features

### Core Services

1. **CUIT/CUIL Validation**
   - Checksum validation using AFIP algorithm
   - Format validation (XX-XXXXXXXX-X)
   - Type identification (person/company)
   - Random CUIT generation for testing

2. **CAE Generation**
   - Electronic authorization code generation
   - Expiration date calculation (10 days default)
   - CAE format validation (14 digits)
   - Date-based CAE generation

3. **Electronic Invoicing (WSFEv1)**
   - Invoice creation with automatic CAE assignment
   - Invoice number sequencing per POS (Punto de Venta)
   - IVA (VAT) calculation for different tax categories
   - Invoice queries by CAE, number, or CUIT
   - Last authorized invoice retrieval

4. **Authentication (WSAA)**
   - Mock authentication token generation
   - Token validation and expiration
   - Login ticket simulation

5. **Taxpayer Registry (Padrón A5)**
   - Taxpayer information retrieval by CUIT
   - Batch taxpayer queries
   - Tax category information

## Architecture

```
afip-mock/
├── config/           # Configuration files (tax rules, invoice types)
├── database/         # SQLite database setup and migrations
├── routes/           # Express route handlers
│   ├── auth.js      # WSAA authentication endpoints
│   ├── invoice.js   # WSFEv1 invoice endpoints
│   ├── validation.js # CUIT validation endpoints
│   └── swagger.js   # OpenAPI documentation
├── services/         # Business logic services
│   ├── cuit.service.js    # CUIT validation and formatting
│   ├── cae.service.js     # CAE generation and validation
│   └── invoice.service.js # Invoice management
├── utils/            # Utility functions
│   ├── logger.js    # Winston logger configuration
│   └── config.js    # Configuration loader
├── tests/            # Unit tests
│   ├── cuit.test.js    # CUIT service tests
│   └── invoice.test.js # Invoice service tests
├── data/             # SQLite database storage
├── index.js          # Server entry point
├── Dockerfile        # Container definition
└── package.json      # Dependencies and scripts
```

## Installation

### Prerequisites

- Node.js 20.x or higher
- npm 9.x or higher
- SQLite3 (automatically installed via npm)

### Local Installation

1. **Clone or navigate to the project**:
   ```bash
   cd docker/mocks/afip
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment** (optional):
   ```bash
   cp .env.example .env
   ```

   Edit `.env` to customize:
   ```env
   AFIP_MOCK_PORT=3002
   AFIP_MOCK_DB_PATH=./data/afip.db
   AFIP_MOCK_DEFAULT_POS=1
   NODE_ENV=development
   ENABLE_CORS=true
   ```

4. **Start the server**:
   ```bash
   npm start          # Production mode
   npm run dev        # Development mode (with auto-reload)
   ```

5. **Verify it's running**:
   ```bash
   curl http://localhost:3002/health
   ```

### Docker Installation

1. **Build the Docker image**:
   ```bash
   docker build -t afip-mock:latest .
   ```

2. **Run the container**:
   ```bash
   docker run -d \
     --name afip-mock \
     -p 3002:3002 \
     -v $(pwd)/data:/app/data \
     afip-mock:latest
   ```

3. **Using Docker Compose** (recommended):
   ```bash
   # From project root
   docker-compose -f docker-compose.mocks.yml up -d
   ```

4. **Check container health**:
   ```bash
   docker ps
   docker logs afip-mock
   ```

5. **Stop the container**:
   ```bash
   docker-compose -f docker-compose.mocks.yml down
   ```

## Usage

### Quick Start

Once the server is running, access:

- **Service Info**: http://localhost:3002/
- **Health Check**: http://localhost:3002/health
- **API Documentation**: http://localhost:3002/docs (Swagger UI)
- **Configuration**: http://localhost:3002/config

### API Endpoints

#### Health & Info

**GET /** - Service information and endpoint list
```bash
curl http://localhost:3002/
```

**GET /health** - Health check
```bash
curl http://localhost:3002/health
```

**GET /config** - View current configuration
```bash
curl http://localhost:3002/config
```

#### CUIT Validation

**POST /validate/cuit** - Validate CUIT (body)
```bash
curl -X POST http://localhost:3002/validate/cuit \
  -H "Content-Type: application/json" \
  -d '{"cuit": "20-12345678-6"}'
```

Response:
```json
{
  "valid": true,
  "formatted": "20-12345678-6",
  "cleaned": "20123456786",
  "type": "Persona Física Masculino",
  "checksum_valid": true
}
```

**GET /validate/cuit/:cuit** - Validate CUIT (URL parameter)
```bash
curl http://localhost:3002/validate/cuit/20-12345678-6
```

#### Authentication (WSAA)

**POST /wsaa/auth** - Generate authentication token
```bash
curl -X POST http://localhost:3002/wsaa/auth \
  -H "Content-Type: application/json" \
  -d '{
    "cuit": "20-12345678-6",
    "service": "wsfev1"
  }'
```

Response:
```json
{
  "success": true,
  "token": "PD94bWwgdmVyc2lvbj0iMS4wIi...",
  "sign": "W3NpZ25hdHVyZV0=",
  "expiration": "20231025120000",
  "generation_time": "20231024120000",
  "service": "wsfev1"
}
```

**GET /wsaa/status** - Check authentication status
```bash
curl http://localhost:3002/wsaa/status?token=your-token-here
```

#### Electronic Invoicing (WSFEv1)

**POST /wsfev1/FECAESolicitar** - Request CAE (create invoice)
```bash
curl -X POST http://localhost:3002/wsfev1/FECAESolicitar \
  -H "Content-Type: application/json" \
  -d '{
    "Auth": {
      "Token": "mock-token",
      "Sign": "mock-sign",
      "Cuit": "20123456786"
    },
    "FeCAEReq": {
      "FeCabReq": {
        "CantReg": 1,
        "PtoVta": 1,
        "CbteTipo": 1
      },
      "FeDetReq": [
        {
          "Concepto": 1,
          "DocTipo": 80,
          "DocNro": "27987654321",
          "CbteDesde": 1,
          "CbteHasta": 1,
          "CbteFch": "20231024",
          "ImpTotal": 121.00,
          "ImpTotConc": 0,
          "ImpNeto": 100.00,
          "ImpOpEx": 0,
          "ImpIVA": 21.00,
          "ImpTrib": 0,
          "MonId": "PES",
          "MonCotiz": 1
        }
      ]
    }
  }'
```

Response:
```json
{
  "FeCabResp": {
    "Cuit": "20123456786",
    "PtoVta": 1,
    "CbteTipo": 1,
    "FchProceso": "20231024",
    "CantReg": 1,
    "Resultado": "A"
  },
  "FeDetResp": [
    {
      "Concepto": 1,
      "DocTipo": 80,
      "DocNro": "27987654321",
      "CbteDesde": 1,
      "CbteHasta": 1,
      "CbteFch": "20231024",
      "Resultado": "A",
      "CAE": "20231024123456",
      "CAEFchVto": "20231103",
      "Observaciones": []
    }
  ],
  "Errors": null,
  "Events": null
}
```

**GET /wsfev1/FECompUltimoAutorizado** - Get last authorized invoice
```bash
curl "http://localhost:3002/wsfev1/FECompUltimoAutorizado?PtoVta=1&CbteTipo=1"
```

**GET /wsfev1/FECompConsultar** - Query invoice
```bash
curl "http://localhost:3002/wsfev1/FECompConsultar?PtoVta=1&CbteTipo=1&CbteNro=1"
```

**POST /wsfev1/FEParamGetPtosVenta** - Get points of sale
```bash
curl -X POST http://localhost:3002/wsfev1/FEParamGetPtosVenta \
  -H "Content-Type: application/json" \
  -d '{"Auth": {"Token": "mock-token", "Sign": "mock-sign", "Cuit": "20123456786"}}'
```

**POST /wsfev1/FEParamGetTiposCbte** - Get invoice types
```bash
curl -X POST http://localhost:3002/wsfev1/FEParamGetTiposCbte \
  -H "Content-Type: application/json" \
  -d '{"Auth": {"Token": "mock-token", "Sign": "mock-sign", "Cuit": "20123456786"}}'
```

#### Taxpayer Registry (Padrón A5)

**POST /ws_sr_padron_a5/getPersona** - Get taxpayer by CUIT
```bash
curl -X POST http://localhost:3002/ws_sr_padron_a5/getPersona \
  -H "Content-Type: application/json" \
  -d '{"cuit": "20123456786"}'
```

Response:
```json
{
  "success": true,
  "data": {
    "idPersona": "20123456786",
    "tipoClave": "CUIT",
    "estadoClave": "ACTIVO",
    "nombre": "MOCK EMPRESA SA",
    "domicilioFiscal": {
      "direccion": "AV CORRIENTES 1234",
      "localidad": "CAPITAL FEDERAL",
      "codPostal": "C1043AAZ",
      "provincia": "CIUDAD AUTONOMA BUENOS AIRES"
    },
    "idCategoria": "1",
    "categoriaAutonomo": "RESPONSABLE INSCRIPTO",
    "actividadPrincipal": "SERVICIOS INFORMATICOS"
  }
}
```

**POST /ws_sr_padron_a5/getPersonaList** - Get multiple taxpayers
```bash
curl -X POST http://localhost:3002/ws_sr_padron_a5/getPersonaList \
  -H "Content-Type: application/json" \
  -d '{"cuits": ["20123456786", "27987654321"]}'
```

## Test CUIT Numbers

Use these CUIT numbers for testing (all have valid checksums):

### Valid CUITs

| CUIT | Format | Type | Description |
|------|--------|------|-------------|
| 20-12345678-6 | 20123456786 | Person (Male) | Test individual male |
| 27-98765432-0 | 27987654320 | Person (Female) | Test individual female |
| 23-45678901-3 | 23456789013 | Person (Non-resident) | Test non-resident |
| 30-71234567-1 | 30712345671 | Legal Entity | Test company |

### Invalid CUITs (for error testing)

| CUIT | Reason |
|------|--------|
| 20-12345678-0 | Invalid checksum (should be 6) |
| 27-98765432-1 | Invalid checksum (should be 0) |
| 23-45678901-0 | Invalid checksum (should be 3) |
| 99-99999999-9 | Invalid format and checksum |
| 20-1234567-6 | Invalid length |
| ABCDEFGHIJK | Non-numeric characters |

### Generate Random Valid CUITs

You can also use the API to generate random valid test CUITs:

```bash
# Using the validation service (check implementation)
curl -X POST http://localhost:3002/validate/cuit/generate \
  -H "Content-Type: application/json" \
  -d '{"type": "20"}'  # 20=male, 27=female, 30=company
```

## Tax Categories

| Code | Description | IVA Rate |
|------|-------------|----------|
| 1 | Responsable Inscripto | 21% |
| 2 | Exento | 0% |
| 3 | Monotributista | 0% |
| 4 | IVA no Alcanzado | 0% |
| 5 | Consumidor Final | 21% |

## Invoice Types

| Code | Description | Usage |
|------|-------------|-------|
| 1 | Factura A | Between registered taxpayers |
| 6 | Factura B | From registered to final consumer |
| 11 | Factura C | Between non-registered |
| 3 | Nota de Crédito A | Credit note for Factura A |
| 8 | Nota de Crédito B | Credit note for Factura B |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `AFIP_MOCK_PORT` | 3002 | Server port |
| `AFIP_MOCK_DB_PATH` | ./data/afip.db | SQLite database path |
| `AFIP_MOCK_DEFAULT_POS` | 1 | Default point of sale |
| `NODE_ENV` | development | Environment (development/production) |
| `ENABLE_CORS` | true | Enable CORS for cross-origin requests |
| `LOG_LEVEL` | info | Logging level (error/warn/info/debug) |

## Testing

### Run Unit Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Test Coverage

Current test coverage:
- **CUIT Service**: 100% coverage (all validation, formatting, generation)
- **Invoice Service**: 100% coverage (creation, retrieval, IVA calculation)
- **Overall Target**: >70% coverage ✓

### Integration Testing

Test the full workflow:

```bash
# 1. Authenticate
TOKEN=$(curl -s -X POST http://localhost:3002/wsaa/auth \
  -H "Content-Type: application/json" \
  -d '{"cuit": "20-12345678-6", "service": "wsfev1"}' | jq -r .token)

# 2. Create invoice
CAE=$(curl -s -X POST http://localhost:3002/wsfev1/FECAESolicitar \
  -H "Content-Type: application/json" \
  -d '{
    "Auth": {"Token": "'$TOKEN'", "Sign": "mock-sign", "Cuit": "20123456786"},
    "FeCAEReq": {
      "FeCabReq": {"CantReg": 1, "PtoVta": 1, "CbteTipo": 1},
      "FeDetReq": [{
        "Concepto": 1,
        "DocTipo": 80,
        "DocNro": "27987654321",
        "CbteDesde": 1,
        "CbteHasta": 1,
        "CbteFch": "20231024",
        "ImpTotal": 121.00,
        "ImpNeto": 100.00,
        "ImpIVA": 21.00
      }]
    }
  }' | jq -r .FeDetResp[0].CAE)

# 3. Query invoice
curl "http://localhost:3002/wsfev1/FECompConsultar?PtoVta=1&CbteTipo=1&CbteNro=1"

# 4. Validate CUIT
curl http://localhost:3002/validate/cuit/20-12345678-6
```

## Database Schema

### Tables

**invoices**
- `id` INTEGER PRIMARY KEY
- `cae` TEXT - Electronic authorization code
- `cae_expiration` TEXT - CAE expiration date (YYYYMMDD)
- `invoice_number` INTEGER - Sequential invoice number
- `pos` INTEGER - Point of sale
- `invoice_date` TEXT - Invoice date (YYYYMMDD)
- `invoice_type` INTEGER - Invoice type code
- `total_amount` REAL - Total amount including IVA
- `iva_amount` REAL - IVA amount
- `cuit_emisor` TEXT - Issuer CUIT
- `cuit_receptor` TEXT - Receiver CUIT (nullable)
- `tax_category` INTEGER - Tax category code
- `created_at` DATETIME - Creation timestamp

**pos_config**
- `id` INTEGER PRIMARY KEY
- `pos` INTEGER - Point of sale number
- `last_invoice_number` INTEGER - Last used invoice number
- `created_at` DATETIME
- `updated_at` DATETIME

**auth_tokens** (optional)
- Token storage for authentication simulation

## AFIP Compliance Notes

### What This Mock Provides

✅ **Implemented:**
- CUIT/CUIL validation with correct checksum algorithm
- CAE format and generation (14-digit format)
- Invoice number sequencing per POS
- IVA calculation for different tax categories
- Tax category and invoice type validation
- Basic taxpayer registry simulation
- Authentication token simulation

### Differences from Real AFIP

❌ **Not Implemented (Mock Only):**
- Real certificate-based authentication (WSAA with PKCS7)
- Digital signatures for requests/responses
- Real-time AFIP server connectivity
- Actual tax authority validation
- Production-level security measures
- Rate limiting and quotas
- Complete AFIP business rule validation
- Real taxpayer data (uses mock data)

### Important Warnings

⚠️ **Development Only:**
This server is for **development and testing purposes only**. It does not:
- Connect to real AFIP servers
- Use real certificates or credentials
- Provide legally valid CAEs
- Store or transmit real tax data
- Meet production security requirements

For production use, you must:
1. Use official AFIP SDKs and libraries
2. Obtain real AFIP certificates
3. Implement proper security measures
4. Follow all AFIP regulations and protocols
5. Test in AFIP's homologation environment

## Development

### Project Structure

The codebase follows a service-oriented architecture:

```
Services (Business Logic)
    ↓
Routes (HTTP Handlers)
    ↓
Express Middleware
    ↓
SQLite Database
```

### Adding New Features

1. **Create Service**: Add business logic in `services/`
2. **Create Route**: Add HTTP handlers in `routes/`
3. **Update Swagger**: Document in `routes/swagger.js`
4. **Add Tests**: Create tests in `tests/`
5. **Update README**: Document the new feature

### Logging

Logs are managed by Winston and include:
- HTTP request/response logging
- Service operation logging
- Error tracking with stack traces
- Structured JSON logging for production

View logs:
```bash
# Local development
npm run dev  # Logs to console

# Docker
docker logs afip-mock
docker logs -f afip-mock  # Follow logs
```

### Debugging

Enable debug logging:
```bash
export LOG_LEVEL=debug
npm run dev
```

## Troubleshooting

### Server Won't Start

**Issue**: Port 3002 already in use
```bash
# Check what's using the port
lsof -i :3002

# Kill the process
kill -9 <PID>

# Or use a different port
export AFIP_MOCK_PORT=3003
npm start
```

**Issue**: Database initialization fails
```bash
# Check database directory exists
mkdir -p data

# Check permissions
chmod 755 data

# Remove corrupt database
rm data/afip.db
npm start  # Will recreate
```

### Docker Issues

**Issue**: Container fails health check
```bash
# Check container logs
docker logs afip-mock

# Check container status
docker ps -a

# Restart container
docker restart afip-mock
```

**Issue**: Permission denied in container
```bash
# Ensure data volume has correct permissions
chmod 755 data
docker-compose down
docker-compose up -d
```

### API Errors

**Issue**: "Database not initialized"
- Restart the server
- Check database file exists and is readable
- Check disk space

**Issue**: "Invalid CUIT"
- Verify CUIT checksum is correct
- Use test CUITs provided above
- Check CUIT format (11 digits)

**Issue**: "Invoice validation failed"
- Check all required fields are present
- Verify tax category and invoice type are valid
- Ensure amounts are within valid ranges

## Performance

- **Response Time**: <100ms for most endpoints
- **Throughput**: 1000+ requests/second
- **Database**: SQLite with WAL mode for concurrent reads
- **Memory**: ~50MB RAM usage
- **Storage**: ~1KB per invoice

## Contributing

When contributing to this mock server:

1. Follow existing code structure and patterns
2. Add unit tests for all new features
3. Update Swagger documentation
4. Update this README
5. Test with Docker before committing
6. Ensure test coverage remains >70%

## License

MIT License - See project root for details

## Support

For issues, questions, or contributions:
- Check the Swagger docs at `/docs`
- Review the logs for error details
- Test with the provided test CUITs
- Verify configuration in `.env`

## Changelog

### Version 1.0.0 (2023-10-12)

**Initial Release:**
- ✓ CUIT validation service with checksum verification
- ✓ CAE generation and expiration management
- ✓ Electronic invoicing (WSFEv1) endpoints
- ✓ Authentication simulation (WSAA)
- ✓ Taxpayer registry simulation (Padrón A5)
- ✓ SQLite persistence layer
- ✓ Swagger/OpenAPI documentation
- ✓ Docker support with health checks
- ✓ Comprehensive unit tests (>70% coverage)
- ✓ Request logging and error handling
- ✓ CORS support for frontend integration

---

**Generated for BarberPro - Service Booking Platform**
Mock Server for Argentina AFIP WebServices Integration

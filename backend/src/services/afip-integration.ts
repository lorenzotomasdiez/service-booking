/**
 * AFIP Integration Service for BarberPro Argentina
 * Electronic Invoice Generation and Tax Compliance
 */

import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import paymentConfig from '../config/payment';

export interface AFIPInvoiceData {
  pointOfSale: number;
  invoiceType: number; // 11 = Factura C, 6 = Factura B, 1 = Factura A
  invoiceNumber: number;
  amount: number;
  taxAmount: number;
  netAmount: number;
  clientCuit?: string;
  clientDni?: string;
  clientName: string;
  items: AFIPInvoiceItem[];
  paymentMethod: string;
  currency: string;
  date: Date;
}

export interface AFIPInvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  totalAmount: number;
  productCode?: string;
  unitMeasure: string;
}

export interface AFIPInvoiceResponse {
  success: boolean;
  invoiceId: string;
  cae?: string; // Código de Autorización Electrónica
  caeExpirationDate?: Date;
  invoiceNumber?: number;
  qrCode?: string;
  pdfUrl?: string;
  errors?: string[];
}

export interface CITIReport {
  period: { month: number; year: number };
  sales: CITISalesRecord[];
  purchases: CITIPurchasesRecord[];
  generatedAt: Date;
}

export interface CITISalesRecord {
  date: Date;
  invoiceType: number;
  pointOfSale: number;
  invoiceNumber: number;
  debitNoteNumber?: number;
  clientDocumentType: number;
  clientDocumentNumber: string;
  clientName: string;
  netAmount: number;
  exemptAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  exchangeRate: number;
}

export interface CITIPurchasesRecord {
  date: Date;
  invoiceType: number;
  pointOfSale: number;
  invoiceNumber: number;
  providerDocumentType: number;
  providerDocumentNumber: string;
  providerName: string;
  netAmount: number;
  exemptAmount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  exchangeRate: number;
}

export class AFIPIntegrationService {
  private prisma: PrismaClient;
  private config: any;
  private nextInvoiceNumber: number = 1;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.config = paymentConfig.tax;
    
    if (!this.config.afipIntegrationEnabled) {
      console.log('📋 AFIP integration is disabled');
      return;
    }

    this.initializeInvoiceNumbers();
  }

  /**
   * Generate electronic invoice for payment
   */
  async generateElectronicInvoice(
    paymentId: string,
    clientData: {
      name: string;
      email: string;
      phone?: string;
      dni?: string;
      cuit?: string;
      address?: string;
    }
  ): Promise<AFIPInvoiceResponse> {
    try {
      if (!this.config.afipIntegrationEnabled) {
        return {
          success: false,
          invoiceId: '',
          errors: ['AFIP integration is disabled'],
        };
      }

      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
        include: {
          booking: {
            include: {
              service: true,
              provider: { include: { user: true } },
            },
          },
        },
      });

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'PAID') {
        throw new Error('Payment must be completed to generate invoice');
      }

      // Determine invoice type based on client CUIT/DNI
      const invoiceType = this.determineInvoiceType(clientData.cuit);
      const invoiceNumber = this.getNextInvoiceNumber();

      // Calculate tax amounts
      const netAmount = Number(payment.amount);
      const taxRate = invoiceType === 11 ? 0 : this.config.ivaRate; // Factura C has no IVA breakdown
      const taxAmount = netAmount * taxRate;
      const totalAmount = invoiceType === 11 ? netAmount : netAmount + taxAmount;

      const invoiceData: AFIPInvoiceData = {
        pointOfSale: this.config.electronicInvoicePointOfSale,
        invoiceType,
        invoiceNumber,
        amount: totalAmount,
        taxAmount,
        netAmount: invoiceType === 11 ? totalAmount : netAmount,
        clientCuit: clientData.cuit,
        clientDni: clientData.dni,
        clientName: clientData.name,
        paymentMethod: payment.paymentMethod,
        currency: payment.currency as string,
        date: new Date(),
        items: [
          {
            description: `Servicio de peluquería - ${payment.booking.service.name}`,
            quantity: 1,
            unitPrice: netAmount,
            taxRate: taxRate,
            totalAmount: netAmount,
            unitMeasure: 'Unidad',
          },
        ],
      };

      // In a real implementation, this would call the AFIP Web Service
      const afipResponse = await this.simulateAFIPService(invoiceData);

      // Save invoice record
      await this.saveInvoiceRecord(payment.id, invoiceData, afipResponse);

      return afipResponse;

    } catch (error: any) {
      console.error('AFIP invoice generation error:', error);
      return {
        success: false,
        invoiceId: uuidv4(),
        errors: [error.message || 'Unknown error occurred'],
      };
    }
  }

  /**
   * Generate CITI report for AFIP compliance
   */
  async generateCITIReport(month: number, year: number): Promise<CITIReport> {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      // Get all paid payments for the period
      const payments = await this.prisma.payment.findMany({
        where: {
          status: 'PAID',
          paidAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        include: {
          booking: {
            include: {
              service: true,
              provider: { include: { user: true } },
              client: true,
            },
          },
        },
      });

      // Generate sales records
      const salesRecords: CITISalesRecord[] = payments.map((payment, index) => {
        const invoiceType = this.determineInvoiceType(
          (payment.metadata as any)?.clientInfo?.cuit
        );
        const netAmount = Number(payment.amount);
        const taxRate = invoiceType === 11 ? 0 : this.config.ivaRate;
        const taxAmount = netAmount * taxRate;

        return {
          date: payment.paidAt || payment.createdAt,
          invoiceType,
          pointOfSale: this.config.electronicInvoicePointOfSale,
          invoiceNumber: index + 1, // In real implementation, use actual invoice numbers
          clientDocumentType: (payment.metadata as any)?.clientInfo?.cuit ? 80 : 96, // 80 = CUIT, 96 = DNI
          clientDocumentNumber: (payment.metadata as any)?.clientInfo?.cuit || 
                               (payment.metadata as any)?.clientInfo?.dni || 
                               '99999999',
          clientName: (payment.metadata as any)?.clientInfo?.name || 'Consumidor Final',
          netAmount: invoiceType === 11 ? netAmount : netAmount,
          exemptAmount: 0,
          taxAmount: invoiceType === 11 ? 0 : taxAmount,
          totalAmount: invoiceType === 11 ? netAmount : netAmount + taxAmount,
          currency: 'PES', // Pesos Argentinos
          exchangeRate: 1,
        };
      });

      // For this service platform, we typically don't have purchases to report
      const purchasesRecords: CITIPurchasesRecord[] = [];

      return {
        period: { month, year },
        sales: salesRecords,
        purchases: purchasesRecords,
        generatedAt: new Date(),
      };

    } catch (error: any) {
      console.error('CITI report generation error:', error);
      throw new Error(`Failed to generate CITI report: ${error.message}`);
    }
  }

  /**
   * Export CITI report to required file format
   */
  exportCITIReport(report: CITIReport): {
    salesFile: string;
    purchasesFile: string;
    aliquotsFile: string;
  } {
    // CITI Sales format (fixed-width format required by AFIP)
    const salesLines = report.sales.map(record => {
      return [
        record.date.toISOString().slice(0, 10).replace(/-/g, ''), // YYYYMMDD
        record.invoiceType.toString().padStart(3, '0'),
        record.pointOfSale.toString().padStart(5, '0'),
        record.invoiceNumber.toString().padStart(20, '0'),
        '', // Debit note number
        record.clientDocumentType.toString().padStart(2, '0'),
        record.clientDocumentNumber.padEnd(20, ' '),
        record.clientName.padEnd(30, ' ').substring(0, 30),
        Math.round(record.netAmount * 100).toString().padStart(15, '0'),
        Math.round(record.exemptAmount * 100).toString().padStart(15, '0'),
        '0000000000000000', // Perceptions
        '0000000000000000', // Exempt perceptions
        Math.round(record.taxAmount * 100).toString().padStart(15, '0'),
        Math.round(record.totalAmount * 100).toString().padStart(15, '0'),
        record.currency,
        '0000001000', // Exchange rate (1.000)
        '1', // Quantity of aliquots
        'N', // Operation code
        '0000000000000000', // Other taxes
        record.date.toISOString().slice(0, 10).replace(/-/g, ''), // Due date
      ].join('');
    });

    // CITI Purchases format (empty for service platform)
    const purchasesLines: string[] = [];

    // CITI Aliquots format (IVA aliquots)
    const aliquotsLines = report.sales
      .filter(record => record.taxAmount > 0)
      .map(record => {
        return [
          record.invoiceType.toString().padStart(3, '0'),
          record.pointOfSale.toString().padStart(5, '0'),
          record.invoiceNumber.toString().padStart(20, '0'),
          record.clientDocumentType.toString().padStart(2, '0'),
          record.clientDocumentNumber.padEnd(20, ' '),
          Math.round(record.netAmount * 100).toString().padStart(15, '0'),
          '0005', // IVA 21% aliquot code
          Math.round(record.taxAmount * 100).toString().padStart(15, '0'),
        ].join('');
      });

    return {
      salesFile: salesLines.join('\n'),
      purchasesFile: purchasesLines.join('\n'),
      aliquotsFile: aliquotsLines.join('\n'),
    };
  }

  /**
   * Validate CUIT number
   */
  validateCUIT(cuit: string): { valid: boolean; error?: string } {
    try {
      // Remove non-numeric characters
      const cleanCuit = cuit.replace(/\D/g, '');
      
      if (cleanCuit.length !== 11) {
        return { valid: false, error: 'CUIT must be 11 digits' };
      }

      // CUIT validation algorithm
      const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
      let sum = 0;

      for (let i = 0; i < 10; i++) {
        sum += parseInt(cleanCuit[i]) * weights[i];
      }

      const remainder = sum % 11;
      const checkDigit = remainder < 2 ? remainder : 11 - remainder;

      if (parseInt(cleanCuit[10]) !== checkDigit) {
        return { valid: false, error: 'Invalid CUIT check digit' };
      }

      // Check entity type (first 2 digits)
      const entityType = cleanCuit.substring(0, 2);
      const validEntityTypes = ['20', '23', '24', '27', '30', '33', '34'];
      
      if (!validEntityTypes.includes(entityType)) {
        return { valid: false, error: 'Invalid CUIT entity type' };
      }

      return { valid: true };

    } catch (error) {
      return { valid: false, error: 'CUIT validation failed' };
    }
  }

  /**
   * Get tax obligations for a given amount
   */
  calculateTaxObligations(amount: number, hasClientCuit: boolean): {
    netAmount: number;
    ivaAmount: number;
    withholdingAmount: number;
    totalAmount: number;
    invoiceType: number;
  } {
    const invoiceType = this.determineInvoiceType(hasClientCuit ? 'has_cuit' : undefined);
    
    if (invoiceType === 11) { // Factura C (Final Consumer)
      return {
        netAmount: amount,
        ivaAmount: 0,
        withholdingAmount: 0,
        totalAmount: amount,
        invoiceType,
      };
    }

    // Factura A or B
    const netAmount = amount / (1 + this.config.ivaRate);
    const ivaAmount = amount - netAmount;
    const withholdingAmount = this.config.withholdingEnabled ? netAmount * 0.02 : 0; // 2% withholding
    
    return {
      netAmount,
      ivaAmount,
      withholdingAmount,
      totalAmount: amount,
      invoiceType,
    };
  }

  // Private helper methods

  private async initializeInvoiceNumbers(): Promise<void> {
    try {
      // In a real implementation, this would query AFIP for the last invoice number
      // For simulation, we'll start from 1 or get from database
      this.nextInvoiceNumber = 1;
      console.log('📋 AFIP invoice numbering initialized');
    } catch (error: any) {
      console.error('Failed to initialize invoice numbers:', error);
    }
  }

  private getNextInvoiceNumber(): number {
    return this.nextInvoiceNumber++;
  }

  private determineInvoiceType(clientCuit?: string): number {
    // 11 = Factura C (Final Consumer, no tax breakdown)
    // 6 = Factura B (Registered taxpayer, tax included)  
    // 1 = Factura A (Registered taxpayer, tax separate)
    
    if (!clientCuit) {
      return 11; // Factura C for final consumers
    }
    
    // In a real implementation, you would check the client's tax status with AFIP
    // For simulation, we'll use Factura B for registered taxpayers
    return 6;
  }

  private async simulateAFIPService(invoiceData: AFIPInvoiceData): Promise<AFIPInvoiceResponse> {
    // Simulate AFIP Web Service call delay
    await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));

    // Simulate occasional AFIP service issues
    if (Math.random() > 0.95) {
      return {
        success: false,
        invoiceId: uuidv4(),
        errors: ['AFIP service temporarily unavailable'],
      };
    }

    // Generate simulated CAE (Código de Autorización Electrónica)
    const cae = Math.floor(Math.random() * 90000000000000) + 10000000000000;
    const caeExpirationDate = new Date();
    caeExpirationDate.setDate(caeExpirationDate.getDate() + 10); // CAE valid for 10 days

    return {
      success: true,
      invoiceId: uuidv4(),
      cae: cae.toString(),
      caeExpirationDate,
      invoiceNumber: invoiceData.invoiceNumber,
      qrCode: `https://www.afip.gob.ar/fe/qr/?p=${Buffer.from(JSON.stringify({
        ver: 1,
        fecha: invoiceData.date.toISOString().split('T')[0],
        cuit: 20123456789, // Provider CUIT
        ptoVta: invoiceData.pointOfSale,
        tipoCmp: invoiceData.invoiceType,
        nroCmp: invoiceData.invoiceNumber,
        importe: invoiceData.amount,
        moneda: 'PES',
        ctz: 1,
        tipoDocRec: invoiceData.clientCuit ? 80 : 96,
        nroDocRec: invoiceData.clientCuit || invoiceData.clientDni,
        tipoCodAut: 'E',
        codAut: cae,
      })).toString('base64')}`,
      pdfUrl: `${process.env.API_BASE_URL}/invoices/${invoiceData.invoiceNumber}/pdf`,
    };
  }

  private async saveInvoiceRecord(
    paymentId: string,
    invoiceData: AFIPInvoiceData,
    afipResponse: AFIPInvoiceResponse
  ): Promise<void> {
    try {
      // In a real implementation, you would save to an invoices table
      // For now, we'll update the payment metadata
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          metadata: {
            ...(await this.prisma.payment.findUnique({ where: { id: paymentId } }))?.metadata,
            afipInvoice: {
              invoiceId: afipResponse.invoiceId,
              invoiceNumber: invoiceData.invoiceNumber,
              invoiceType: invoiceData.invoiceType,
              cae: afipResponse.cae,
              caeExpirationDate: afipResponse.caeExpirationDate,
              generatedAt: new Date(),
              qrCode: afipResponse.qrCode,
              pdfUrl: afipResponse.pdfUrl,
            },
          },
        },
      });

      console.log(`📋 Invoice generated for payment ${paymentId}: ${invoiceData.invoiceNumber}`);
    } catch (error: any) {
      console.error('Failed to save invoice record:', error);
    }
  }
}

export default AFIPIntegrationService;
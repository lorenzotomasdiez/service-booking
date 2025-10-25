/**
 * Email Service
 * Handles email sending via Nodemailer (MailHog for dev, real SMTP for prod)
 */

import nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';
import type { SendMailOptions } from 'nodemailer';
import { emailConfig } from '../config/email.config';
import logger from '../utils/logger';

/**
 * Email service class
 */
class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private templatesDir = path.join(__dirname, '../templates/email');

  constructor() {
    this.initializeTransporter();
  }

  /**
   * Initialize Nodemailer transporter
   */
  private initializeTransporter() {
    try {
      const config = {
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.secure,
        ...(emailConfig.user && emailConfig.password
          ? {
              auth: {
                user: emailConfig.user,
                pass: emailConfig.password,
              },
            }
          : {}),
      };

      this.transporter = nodemailer.createTransport(config);

      logger.info('Email service initialized', {
        host: emailConfig.host,
        port: emailConfig.port,
        isMailHog: emailConfig.isMock,
      });
    } catch (error) {
      logger.error('Failed to initialize email transporter', { error });
      throw error;
    }
  }

  /**
   * Load email template by name
   */
  private loadTemplate(templateName: string): string {
    try {
      const templatePath = path.join(this.templatesDir, templateName);
      const template = fs.readFileSync(templatePath, 'utf-8');
      return template;
    } catch (error) {
      logger.error('Failed to load email template', {
        template: templateName,
        error,
      });
      throw new Error(`Failed to load email template: ${templateName}`);
    }
  }

  /**
   * Render template with variables
   */
  private renderTemplate(template: string, variables: Record<string, any>): string {
    let rendered = template;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      rendered = rendered.replace(new RegExp(placeholder, 'g'), String(value));
    }

    return rendered;
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(
    email: string,
    userName: string,
    verificationToken: string,
    verificationLink: string,
    resendLink: string
  ): Promise<boolean> {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      // Load and render template
      const template = this.loadTemplate('verification.html');
      const html = this.renderTemplate(template, {
        userName: userName || 'Usuario',
        verificationToken,
        verificationLink,
        resendLink,
        currentYear: new Date().getFullYear(),
      });

      // Send email
      const mailOptions: SendMailOptions = {
        from: `${emailConfig.fromName} <${emailConfig.from}>`,
        to: email,
        subject: '¡Verifica tu email para BarberPro!',
        html,
      };

      const result = await this.transporter.sendMail(mailOptions);

      logger.info('Verification email sent successfully', {
        to: email,
        messageId: result.messageId,
      });

      return true;
    } catch (error) {
      logger.error('Failed to send verification email', {
        to: email,
        error,
      });

      throw error;
    }
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(email: string, userName: string): Promise<boolean> {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      // Simple welcome email (can be expanded with template later)
      const mailOptions: SendMailOptions = {
        from: `${emailConfig.fromName} <${emailConfig.from}>`,
        to: email,
        subject: '¡Bienvenido a BarberPro!',
        html: `
          <h2>¡Bienvenido, ${userName}!</h2>
          <p>Tu email ha sido verificado exitosamente.</p>
          <p>Ahora puedes disfrutar de todas las características de BarberPro.</p>
        `,
      };

      await this.transporter.sendMail(mailOptions);

      logger.info('Welcome email sent', { to: email });

      return true;
    } catch (error) {
      logger.error('Failed to send welcome email', {
        to: email,
        error,
      });

      throw error;
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, resetLink: string): Promise<boolean> {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      const mailOptions: SendMailOptions = {
        from: `${emailConfig.fromName} <${emailConfig.from}>`,
        to: email,
        subject: 'Restablece tu contraseña en BarberPro',
        html: `
          <h2>Restablece tu contraseña</h2>
          <p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
          <a href="${resetLink}">Restablecer contraseña</a>
          <p>Este enlace expira en 24 horas.</p>
        `,
      };

      await this.transporter.sendMail(mailOptions);

      logger.info('Password reset email sent', { to: email });

      return true;
    } catch (error) {
      logger.error('Failed to send password reset email', {
        to: email,
        error,
      });

      throw error;
    }
  }

  /**
   * Check if email service is ready
   */
  async verifyConnection(): Promise<boolean> {
    try {
      if (!this.transporter) {
        return false;
      }

      await this.transporter.verify();
      logger.info('Email transporter verified successfully');
      return true;
    } catch (error) {
      logger.error('Email transporter verification failed', { error });
      return false;
    }
  }

  /**
   * Get MailHog UI URL (development only)
   */
  getMailHogUrl(): string | null {
    if (emailConfig.isMock) {
      return process.env.MAILHOG_UI_URL || 'http://localhost:8025';
    }
    return null;
  }
}

// Export singleton instance
export default new EmailService();

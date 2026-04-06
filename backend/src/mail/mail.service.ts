import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class MailService {
  private resend: Resend;

  constructor() {
    // Inicializamos Resend con la llave que pusiste en Render
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendPasswordResetEmail(to: string, token: string) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${token}`;

    try {
      const { data, error } = await this.resend.emails.send({
        // IMPORTANTE: En el plan gratis sin dominio propio, debes usar este correo exacto de Resend:
        from: 'DevTrack Pro <onboarding@resend.dev>', 
        to: to, // Ojo: en el plan gratis, solo puedes enviar correos a la dirección con la que te registraste en Resend.
        subject: 'Password Reset Request - DevTrack Pro',
        html: `
          <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
            <h2 style="color: #1e293b; text-align: center;">DevTrack Pro</h2>
            <p style="color: #475569; font-size: 16px;">Hello,</p>
            <p style="color: #475569; font-size: 16px;">You recently requested to reset your password. Click the button below to proceed:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Reset Password
              </a>
            </div>
            <p style="color: #475569; font-size: 14px;">If you did not request a password reset, please ignore this email or reply to let us know. This link will expire in 1 hour.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">© 2026 DevTrack Pro. All rights reserved.</p>
          </div>
        `,
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log(`Email sent via HTTP API to ${to}`);
    } catch (error) {
      console.error('Error sending email via Resend:', error);
      throw new InternalServerErrorException('Error sending the reset email');
    }
  }
}
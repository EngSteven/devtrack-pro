import { Test, TestingModule } from '@nestjs/testing';
import { MailService } from './mail.service';
import * as nodemailer from 'nodemailer';
import { InternalServerErrorException } from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

// Interceptamos la librería entera
jest.mock('nodemailer');

describe('MailService', () => {
  let service: MailService;
  let mockSendMail: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Preparamos la función falsa de sendMail
    mockSendMail = jest.fn();
    
    // Le decimos a Nodemailer que cuando el servicio llame a createTransport, devuelva nuestro mock
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: mockSendMail,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [MailService],
    }).compile();

    service = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendPasswordResetEmail', () => {
    it('should send an email successfully', async () => {
      // Mockeamos el log para no ensuciar la terminal al correr las pruebas
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {}) as unknown as jest.Mock;
      
      mockSendMail.mockResolvedValue(true);

      await service.sendPasswordResetEmail('test@example.com', 'token123');

      expect(mockSendMail).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('Email sent successfully to test@example.com');
      
      consoleLogSpy.mockRestore();
    });

    it('should throw InternalServerErrorException on error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {}) as unknown as jest.Mock;
      
      // Simulamos que el proveedor (Gmail) rechazó el correo
      mockSendMail.mockRejectedValue(new Error('SMTP Error'));

      await expect(service.sendPasswordResetEmail('test@example.com', 'token123'))
        .rejects.toThrow(InternalServerErrorException);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error sending email:', expect.any(Error));
      
      consoleErrorSpy.mockRestore();
    });
  });
});
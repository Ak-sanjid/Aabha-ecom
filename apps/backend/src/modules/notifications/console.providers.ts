import { Injectable, Logger } from '@nestjs/common';
import { type ConfigService } from '@nestjs/config';
import { createId } from 'src/db/schema/_shared';
import {
  EmailProvider,
  SmsProvider,
  WhatsAppProvider,
  type EmailMessage,
  type SmsMessage,
  type SmsSendResult,
  type WhatsAppMessage,
} from './notification.contracts';

/**
 * Development transport: writes the message to the log instead of hitting a
 * paid gateway. In production swap in TwilioSmsProvider / BulkSmsBdProvider by
 * setting SMS_PROVIDER — no calling code changes.
 */
@Injectable()
export class ConsoleSmsProvider extends SmsProvider {
  readonly name = 'console';
  private readonly logger = new Logger('SMS');

  constructor(private readonly config: ConfigService) {
    super();
  }

  async send(message: SmsMessage): Promise<SmsSendResult> {
    const sender = this.config.get<string>('otp.senderId') ?? 'AABHA';
    this.logger.log(`[${sender} → ${message.to}] ${message.body}`);
    return { provider: this.name, messageId: createId(), accepted: true };
  }
}

@Injectable()
export class ConsoleWhatsAppProvider extends WhatsAppProvider {
  readonly name = 'console';
  private readonly logger = new Logger('WhatsApp');

  async send(message: WhatsAppMessage): Promise<SmsSendResult> {
    this.logger.log(
      `[WhatsApp → ${message.to}] ${message.template ?? ''} ${message.body ?? ''}`.trim(),
    );
    return { provider: this.name, messageId: createId(), accepted: true };
  }
}

@Injectable()
export class ConsoleEmailProvider extends EmailProvider {
  readonly name = 'console';
  private readonly logger = new Logger('Email');

  async send(message: EmailMessage): Promise<SmsSendResult> {
    this.logger.log(`[Email → ${message.to}] ${message.subject}`);
    return { provider: this.name, messageId: createId(), accepted: true };
  }
}

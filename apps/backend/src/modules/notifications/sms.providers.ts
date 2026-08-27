import { Injectable, Logger } from '@nestjs/common';
import { type ConfigService } from '@nestjs/config';
import { createId } from 'src/db/schema/_shared';
import { SmsProvider, type SmsMessage, type SmsSendResult } from './notification.contracts';

/**
 * Twilio-compatible REST transport. Also works with any gateway that mirrors
 * the Twilio Messages API shape — several BD resellers do.
 */
@Injectable()
export class TwilioSmsProvider extends SmsProvider {
  readonly name = 'twilio';
  private readonly logger = new Logger('SMS:twilio');

  constructor(private readonly config: ConfigService) {
    super();
  }

  async send(message: SmsMessage): Promise<SmsSendResult> {
    const sid = process.env.TWILIO_ACCOUNT_SID ?? '';
    const token = process.env.TWILIO_AUTH_TOKEN ?? '';
    const from = process.env.TWILIO_FROM_NUMBER ?? '';
    if (!sid || !token || !from) {
      this.logger.warn('Twilio is not fully configured — message dropped');
      return { provider: this.name, messageId: createId(), accepted: false };
    }

    const body = new URLSearchParams({ To: message.to, From: from, Body: message.body });
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      },
    );
    const raw = (await response.json()) as { sid?: string };
    return {
      provider: this.name,
      messageId: raw.sid ?? createId(),
      accepted: response.ok,
      raw,
    };
  }
}

/**
 * BulkSMSBD — a common local Bangladeshi gateway. Kept as a reference
 * implementation of the swappable-provider contract.
 */
@Injectable()
export class BulkSmsBdProvider extends SmsProvider {
  readonly name = 'bulksmsbd';
  private readonly logger = new Logger('SMS:bulksmsbd');

  constructor(private readonly config: ConfigService) {
    super();
  }

  async send(message: SmsMessage): Promise<SmsSendResult> {
    const apiKey = process.env.BULKSMSBD_API_KEY ?? '';
    const senderId = this.config.get<string>('otp.senderId') ?? 'AABHA';
    if (!apiKey) {
      this.logger.warn('BULKSMSBD_API_KEY missing — message dropped');
      return { provider: this.name, messageId: createId(), accepted: false };
    }

    const url = new URL('http://bulksmsbd.net/api/smsapi');
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('type', 'text');
    url.searchParams.set('number', message.to);
    url.searchParams.set('senderid', senderId);
    url.searchParams.set('message', message.body);

    const response = await fetch(url, { method: 'GET' });
    const raw = await response.text();
    return { provider: this.name, messageId: createId(), accepted: response.ok, raw };
  }
}

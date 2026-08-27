/**
 * Notification transport contracts. Providers are swappable behind these
 * interfaces so a Twilio → local BD SMS gateway switch is a config change,
 * never a code change.
 */

export interface SmsMessage {
  to: string;
  body: string;
  /** Optional template reference for gateways that require pre-approval. */
  templateId?: string;
}

export interface SmsSendResult {
  provider: string;
  messageId: string;
  accepted: boolean;
  raw?: unknown;
}

export abstract class SmsProvider {
  abstract readonly name: string;
  abstract send(message: SmsMessage): Promise<SmsSendResult>;
}

export interface WhatsAppMessage {
  to: string;
  template?: string;
  body?: string;
  variables?: Record<string, string>;
}

export abstract class WhatsAppProvider {
  abstract readonly name: string;
  abstract send(message: WhatsAppMessage): Promise<SmsSendResult>;
}

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export abstract class EmailProvider {
  abstract readonly name: string;
  abstract send(message: EmailMessage): Promise<SmsSendResult>;
}

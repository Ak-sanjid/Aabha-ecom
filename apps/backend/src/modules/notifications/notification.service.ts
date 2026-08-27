import { Injectable, Logger } from '@nestjs/common';
import { type ConfigService } from '@nestjs/config';
import {
  type EmailProvider,
  type SmsProvider,
  type WhatsAppProvider,
  type SmsSendResult,
} from './notification.contracts';

/**
 * Application-level notification façade. Everything customer-facing goes
 * through here so that (a) copy stays consistent, (b) Milestone 3 can move
 * these calls onto a BullMQ queue without touching call sites.
 */
@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    private readonly sms: SmsProvider,
    private readonly whatsapp: WhatsAppProvider,
    private readonly email: EmailProvider,
    private readonly config: ConfigService,
  ) {}

  async sendOtp(destination: string, code: string, locale: 'EN' | 'BN'): Promise<SmsSendResult> {
    const brand = this.config.get<string>('app.name') ?? 'Aabha';
    const body =
      locale === 'BN'
        ? `আপনার ${brand} ভেরিফিকেশন কোড: ${code}। কারো সাথে শেয়ার করবেন না।`
        : `Your ${brand} verification code is ${code}. Do not share it with anyone.`;
    return this.sms.send({ to: destination, body });
  }

  async sendPasswordResetLink(
    destination: string,
    link: string,
    channel: 'EMAIL' | 'WHATSAPP',
  ): Promise<SmsSendResult> {
    if (channel === 'WHATSAPP') {
      return this.whatsapp.send({
        to: destination,
        body: `Reset your Aabha password: ${link} (valid for 30 minutes)`,
      });
    }
    return this.email.send({
      to: destination,
      subject: 'Reset your Aabha password',
      html: `<p>Tap the link below to choose a new password. It expires in 30 minutes.</p><p><a href="${link}">${link}</a></p>`,
    });
  }

  async sendWelcomeGuestAccount(phone: string, locale: 'EN' | 'BN'): Promise<SmsSendResult> {
    const body =
      locale === 'BN'
        ? `আভায় আপনার অ্যাকাউন্ট তৈরি হয়েছে। ইউজারনেম: ${phone}, পাসওয়ার্ড: আপনার মোবাইল নম্বর। লগইন করে পাসওয়ার্ড পরিবর্তন করুন।`
        : `Your Aabha account is ready. Username: ${phone}, password: your mobile number. Please log in and change it.`;
    return this.sms.send({ to: phone, body });
  }
}

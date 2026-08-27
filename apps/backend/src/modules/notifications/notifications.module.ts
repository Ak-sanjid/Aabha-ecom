import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ConsoleEmailProvider,
  ConsoleSmsProvider,
  ConsoleWhatsAppProvider,
} from './console.providers';
import { EmailProvider, SmsProvider, WhatsAppProvider } from './notification.contracts';
import { BulkSmsBdProvider, TwilioSmsProvider } from './sms.providers';
import { NotificationService } from './notification.service';

@Global()
@Module({
  providers: [
    ConsoleSmsProvider,
    ConsoleWhatsAppProvider,
    ConsoleEmailProvider,
    TwilioSmsProvider,
    BulkSmsBdProvider,
    {
      // The active SMS gateway is chosen purely by configuration.
      provide: SmsProvider,
      inject: [ConfigService, ConsoleSmsProvider, TwilioSmsProvider, BulkSmsBdProvider],
      useFactory: (
        config: ConfigService,
        consoleProvider: ConsoleSmsProvider,
        twilio: TwilioSmsProvider,
        bulk: BulkSmsBdProvider,
      ): SmsProvider => {
        switch (config.get<string>('otp.provider')) {
          case 'twilio':
            return twilio;
          case 'bulksmsbd':
          case 'alpha_sms':
            return bulk;
          default:
            return consoleProvider;
        }
      },
    },
    { provide: WhatsAppProvider, useClass: ConsoleWhatsAppProvider },
    { provide: EmailProvider, useClass: ConsoleEmailProvider },
    NotificationService,
  ],
  exports: [SmsProvider, WhatsAppProvider, EmailProvider, NotificationService],
})
export class NotificationsModule {}

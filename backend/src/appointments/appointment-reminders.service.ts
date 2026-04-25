import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppointmentNotificationsService } from './appointment-notifications.service';

@Injectable()
export class AppointmentRemindersService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AppointmentRemindersService.name);
  private intervalHandle?: NodeJS.Timeout;
  private isRunning = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly appointmentNotificationsService: AppointmentNotificationsService,
  ) {}

  onModuleInit() {
    const enabled =
      this.configService.get<string>('APPOINTMENT_REMINDER_ENABLED', 'true') !==
      'false';

    if (!enabled) {
      this.logger.log('Appointment reminder polling is disabled');
      return;
    }

    const intervalMinutes = Math.max(
      1,
      Number(
        this.configService.get<string>('APPOINTMENT_REMINDER_INTERVAL_MINUTES', '5'),
      ),
    );
    const intervalMs = intervalMinutes * 60 * 1000;

    this.intervalHandle = setInterval(() => {
      void this.runReminderPass();
    }, intervalMs);

    void this.runReminderPass();
    this.logger.log(
      `Appointment reminder polling started with a ${intervalMinutes}-minute interval`,
    );
  }

  onModuleDestroy() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = undefined;
    }
  }

  private async runReminderPass() {
    if (this.isRunning) {
      this.logger.warn('Skipping reminder pass because the previous pass is still running');
      return;
    }

    this.isRunning = true;

    try {
      await this.appointmentNotificationsService.processDueReminders();
    } catch (error) {
      this.logger.error(
        `Appointment reminder pass failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    } finally {
      this.isRunning = false;
    }
  }
}

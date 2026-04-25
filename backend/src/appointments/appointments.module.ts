import { Module } from '@nestjs/common';
import { AvailabilityModule } from '../availability/availability.module';
import { EmailModule } from '../email/email.module';
import { AppointmentNotificationsService } from './appointment-notifications.service';
import { AppointmentRemindersService } from './appointment-reminders.service';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';

@Module({
  imports: [AvailabilityModule, EmailModule],
  controllers: [AppointmentsController],
  providers: [
    AppointmentsService,
    AppointmentNotificationsService,
    AppointmentRemindersService,
  ],
  exports: [AppointmentsService],
})
export class AppointmentsModule {}

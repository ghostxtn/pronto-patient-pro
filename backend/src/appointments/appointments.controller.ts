import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Audit } from '../common/decorators/audit.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentNoteDto } from './dto/create-appointment-note.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { GetAppointmentsQueryDto } from './dto/get-appointments-query.dto';
import { UpdateAppointmentNoteDto } from './dto/update-appointment-note.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Audit('CREATE_APPOINTMENT', 'appointment')
  @Roles('owner', 'admin', 'doctor', 'staff', 'patient')
  create(
    @Body() dto: CreateAppointmentDto,
    @CurrentUser() user: { clinicId: string; role: string; userId: string },
  ) {
    return this.appointmentsService.create(dto, user.clinicId, user.role, user.userId);
  }

  @Get()
  @Audit('LIST_APPOINTMENTS', 'appointment')
  @Roles('owner', 'admin', 'doctor', 'staff', 'patient')
  findAll(
    @CurrentUser() user: { clinicId: string; userId: string; role: string },
    @Query() query: GetAppointmentsQueryDto,
  ) {
    return this.appointmentsService.findAllByClinic(
      user.clinicId,
      {
        doctorId: query.doctorId,
        patientId: query.patientId,
        dateFrom: query.dateFrom,
        dateTo: query.dateTo,
        status: query.status,
      },
      {
        userId: user.userId,
        role: user.role,
      },
    );
  }

  @Get(':id')
  @Audit('VIEW_APPOINTMENT', 'appointment')
  @Roles('owner', 'admin', 'doctor', 'staff', 'patient')
  findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { clinicId: string; userId: string; role: string },
  ) {
    return this.appointmentsService.findById(
      id,
      user.clinicId,
      user.userId,
      user.role,
    );
  }

  @Patch(':id')
  @Audit('UPDATE_APPOINTMENT', 'appointment')
  @Roles('owner', 'admin', 'doctor', 'staff')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAppointmentDto,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.appointmentsService.update(id, dto, user.clinicId);
  }

  @Patch(':id/status')
  @Audit('UPDATE_APPOINTMENT_STATUS', 'appointment')
  @Roles('owner', 'admin', 'doctor', 'staff')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateStatusDto,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.appointmentsService.updateStatus(id, dto.status, user.clinicId);
  }

  @Delete(':id')
  @Audit('DELETE_APPOINTMENT', 'appointment')
  @Roles('owner', 'admin')
  softDelete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: { clinicId: string },
  ) {
    return this.appointmentsService.softDelete(id, user.clinicId);
  }

  @Post(':appointmentId/notes')
  @Audit('CREATE_APPOINTMENT_NOTE', 'appointment_note')
  @Roles('doctor')
  createNote(
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
    @Body() dto: CreateAppointmentNoteDto,
    @CurrentUser() user: { userId: string; clinicId: string },
  ) {
    return this.appointmentsService.createNote(
      appointmentId,
      dto,
      user.userId,
      user.clinicId,
    );
  }

  @Get(':appointmentId/notes')
  @Audit('LIST_APPOINTMENT_NOTES', 'appointment_note')
  @Roles('owner', 'admin', 'doctor')
  findNotesByAppointment(
    @Param('appointmentId', ParseUUIDPipe) appointmentId: string,
    @CurrentUser() user: { clinicId: string; userId: string; role: string },
  ) {
    return this.appointmentsService.findNotesByAppointment(
      appointmentId,
      user.clinicId,
      {
        userId: user.userId,
        role: user.role,
      },
    );
  }

  @Patch('notes/:noteId')
  @Audit('UPDATE_APPOINTMENT_NOTE', 'appointment_note')
  @Roles('doctor')
  updateNote(
    @Param('noteId', ParseUUIDPipe) noteId: string,
    @Body() dto: UpdateAppointmentNoteDto,
    @CurrentUser() user: { userId: string; clinicId: string },
  ) {
    return this.appointmentsService.updateNote(
      noteId,
      dto,
      user.clinicId,
      user.userId,
    );
  }

  @Delete('notes/:noteId')
  @Audit('DELETE_APPOINTMENT_NOTE', 'appointment_note')
  @Roles('owner', 'doctor')
  deleteNote(
    @Param('noteId', ParseUUIDPipe) noteId: string,
    @CurrentUser() user: { userId: string; clinicId: string },
  ) {
    return this.appointmentsService.deleteNote(noteId, user.clinicId, user.userId);
  }
}

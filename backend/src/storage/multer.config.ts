import { BadRequestException } from '@nestjs/common';
import { mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';

function ensureDirectory(path: string) {
  mkdirSync(path, { recursive: true });
}

function createFilename(originalname: string) {
  return `${randomUUID()}-${Date.now()}-${originalname}`;
}

export const avatarMulterOptions = {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      const destination = '/app/uploads/avatars';
      ensureDirectory(destination);
      cb(null, destination);
    },
    filename: (_req, file, cb) => {
      cb(null, createFilename(file.originalname));
    },
  }),
  fileFilter: (
    _req: unknown,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      cb(new BadRequestException('Only image files are allowed'), false);
      return;
    }

    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 },
};

export const appointmentFileMulterOptions = {
  storage: diskStorage({
    destination: (_req, _file, cb) => {
      const destination = '/app/uploads/appointments';
      ensureDirectory(destination);
      cb(null, destination);
    },
    filename: (_req, file, cb) => {
      cb(null, createFilename(file.originalname));
    },
  }),
  fileFilter: (
    _req: unknown,
    file: Express.Multer.File,
    cb: (error: Error | null, acceptFile: boolean) => void,
  ) => {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      cb(
        new BadRequestException('Only images and PDF files are allowed'),
        false,
      );
      return;
    }

    cb(null, true);
  },
  limits: { fileSize: 10 * 1024 * 1024 },
};

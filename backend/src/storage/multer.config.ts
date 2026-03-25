import { BadRequestException } from '@nestjs/common';
import { mkdirSync } from 'fs';
import { extname } from 'path';
import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';

function ensureDirectory(path: string) {
  mkdirSync(path, { recursive: true });
}

function sanitizeExtension(originalname: string): string {
  const ext = extname(originalname).toLowerCase().replace(/[^a-z0-9.]/g, '');
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];
  return allowedExtensions.includes(ext) ? ext : '';
}

function createFilename(originalname: string): string {
  const ext = sanitizeExtension(originalname);
  return `${randomUUID()}${ext}`;
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

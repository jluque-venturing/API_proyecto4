import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

const MAPA: Record<string, [number, string]> = {
  P2002: [HttpStatus.CONFLICT, 'El recurso ya existe'],
  P2003: [HttpStatus.BAD_REQUEST, 'La referencia indicada no existe'],
  P2025: [HttpStatus.NOT_FOUND, 'El recurso no existe'],
};

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(error: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const [status, message] = MAPA[error.code] ?? [
      HttpStatus.INTERNAL_SERVER_ERROR,
      'Error interno del servidor',
    ];

    // El detalle de Prisma queda solo en el log: al cliente no le llega tabla ni columna.
    this.logger.error(`Prisma ${error.code}: ${error.message}`);
    response.status(status).json({ statusCode: status, message });
  }
}

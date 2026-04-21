import {
  ConflictException,
  InternalServerErrorException,
  NotFoundException
} from "@nestjs/common";
import { Prisma } from "../../../generated/prisma/client";

interface PrismaErrorOptions {
  entityName: string;
  duplicateMessage?: string;
  referenceMessage?: string;
  notFoundMessage?: string;
}

export function handlePrismaError(error: unknown, options: PrismaErrorOptions): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        throw new ConflictException(
          options.duplicateMessage ?? `${options.entityName} already exists.`
        );
      case "P2003":
        throw new ConflictException(
          options.referenceMessage ??
            `${options.entityName} cannot be deleted while it is referenced by operational records.`
        );
      case "P2025":
        throw new NotFoundException(
          options.notFoundMessage ?? `${options.entityName} was not found.`
        );
    }
  }

  throw new InternalServerErrorException(`Unable to save ${options.entityName.toLowerCase()}.`);
}

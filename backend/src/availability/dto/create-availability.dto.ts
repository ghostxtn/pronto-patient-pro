import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Max,
  Min,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';

function HasExactlyOneAvailabilitySelector(
  validationOptions?: ValidationOptions,
) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'hasExactlyOneAvailabilitySelector',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(_: unknown, args: ValidationArguments) {
          const dto = args.object as CreateAvailabilityDto;
          const hasDayOfWeek =
            dto.dayOfWeek !== undefined && dto.dayOfWeek !== null;
          const hasSpecificDate =
            dto.specificDate !== undefined &&
            dto.specificDate !== null &&
            dto.specificDate !== '';

          return hasDayOfWeek !== hasSpecificDate;
        },
        defaultMessage() {
          return 'Exactly one of dayOfWeek or specificDate must be provided';
        },
      },
    });
  };
}

export class CreateAvailabilityDto {
  @IsString()
  @IsNotEmpty()
  doctorId!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek?: number;

  @IsOptional()
  @IsDateString()
  specificDate?: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, {
    message: 'startTime must be HH:mm format',
  })
  startTime!: string;

  @IsString()
  @Matches(/^\d{2}:\d{2}$/, {
    message: 'endTime must be HH:mm format',
  })
  endTime!: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  slotDuration?: number;

  @HasExactlyOneAvailabilitySelector()
  private readonly availabilitySelectorValidation!: never;
}

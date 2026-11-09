import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from "class-validator";
import { isValidMoney, MIN_MONEY, dec } from "@/common/money";

export interface IsMoneyOptions {
  /** Amount must be strictly greater than zero. Defaults to true. */
  positive?: boolean;
  /** Allow negative amounts (used for signed adjustment payloads). */
  signed?: boolean;
  /** Allow zero. Defaults to false. */
  allowZero?: boolean;
}

@ValidatorConstraint({ name: "isMoney", async: false })
export class IsMoneyConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const options = (args.constraints[0] ?? {}) as IsMoneyOptions;
    if (typeof value !== "string") return false;
    if (!isValidMoney(value, options.signed)) return false;

    const amount = dec(value);
    if (!options.allowZero && amount.isZero()) return false;
    if (options.positive && !amount.gt(0)) return false;
    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    const options = (args.constraints[0] ?? {}) as IsMoneyOptions;
    if (options.signed) {
      return `${args.property} must be a decimal string with at most 2 decimal places`;
    }
    return `${args.property} must be a positive decimal string with at most 2 decimal places (min ${MIN_MONEY})`;
  }
}

/** Validates amount strings without ever parsing them through floating point. */
export function IsMoney(options: IsMoneyOptions = {}, validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [options],
      validator: IsMoneyConstraint,
    });
  };
}

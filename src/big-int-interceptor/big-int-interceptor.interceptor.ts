import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

/**
 * Serializes non-JSON-safe database values.
 *
 * Financial values are emitted as decimal strings so the frontend never has to
 * parse money through IEEE-754 floating point. BigInt values are also strings
 * to avoid precision loss.
 */
@Injectable()
export class BigIntInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => this.transform(data)));
  }

  private transform(value: any): any {
    if (value === null || value === undefined) return value;

    if (typeof value === "bigint") {
      return value.toString();
    }

    if (Prisma.Decimal.isDecimal(value)) {
      return value.toString();
    }

    if (value instanceof Date) {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.transform(item));
    }

    if (typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value).map(([key, val]) => [key, this.transform(val)]),
      );
    }

    return value;
  }
}

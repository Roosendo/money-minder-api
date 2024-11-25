import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common'
import { Observable } from 'rxjs'
import { map } from 'rxjs/operators'

@Injectable()
export class BigIntInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => this.handleBigInt(data)),
    )
  }

  private handleBigInt(value: any): any {
    if (value === null || value === undefined) return value

    // Handle BigInt
    if (typeof value === 'bigint') {
      return Number(value)
    }

    // Handle Date objects
    if (value instanceof Date) {
      return value
    }

    // Handle Arrays
    if (Array.isArray(value)) {
      return value.map((item) => this.handleBigInt(item))
    }

    // Handle Objects (excluding Date objects)
    if (typeof value === 'object' && value !== null) {
      return Object.fromEntries(
        Object.entries(value).map(([key, val]) => [key, this.handleBigInt(val)]),
      )
    }

    return value
  }
}

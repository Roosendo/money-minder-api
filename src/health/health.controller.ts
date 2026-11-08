import { Public } from "@/common";
import { Controller, Get } from "@nestjs/common";

@Controller("health")
export class HealthController {
  @Public()
  @Get()
  check() {
    return { status: "ok" };
  }
}

import { ExitService } from './exits.service';
import { CreateExpenseDto, GetExitsDto, MonthlyExitDto } from './exits.dto';
import { UsersService } from '@/users/users.service';
export declare class ExitController {
    private readonly exitService;
    private readonly usersService;
    constructor(exitService: ExitService, usersService: UsersService);
    newExpense(createExpenseDto: CreateExpenseDto): Promise<void>;
    getExits(getExitsDto: GetExitsDto): Promise<unknown>;
    getExpensesByCategoryMonthly(monthlyExitDto: MonthlyExitDto): Promise<unknown>;
}

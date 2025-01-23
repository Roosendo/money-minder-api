import { UsersService } from './users.service';
import { CreateUserDto } from './users.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    createUser(createUserDto: CreateUserDto): Promise<void>;
}

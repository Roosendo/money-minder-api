import { CreateUserDto } from './users.dto';
import { Client } from '@libsql/client/.';
export declare class UsersService {
    private readonly client;
    constructor(client: Client);
    createUser({ email, fullName }: CreateUserDto): Promise<void>;
}

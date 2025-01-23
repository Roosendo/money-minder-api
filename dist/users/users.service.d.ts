import { CreateUserDto } from './users.dto';
import { PrismaService } from '@/prisma.service';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    createUser({ email, fullName }: CreateUserDto): Promise<void>;
}

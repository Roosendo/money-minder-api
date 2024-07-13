import { Profile, Strategy } from 'passport-github2';
declare const GitHubStrategy_base: new (...args: any[]) => InstanceType<typeof Strategy>;
export declare class GitHubStrategy extends GitHubStrategy_base {
    constructor();
    validate(_accessToken: string, _refreshToken: string, profile: Profile, _done: () => void): Promise<any>;
}
export {};

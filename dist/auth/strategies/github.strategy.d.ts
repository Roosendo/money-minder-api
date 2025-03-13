import { Profile, Strategy } from 'passport-github2';
declare const GitHubStrategy_base: new (...args: [options: import("passport-github2").StrategyOptionsWithRequest] | [options: import("passport-github2").StrategyOptions]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class GitHubStrategy extends GitHubStrategy_base {
    constructor();
    validate(_accessToken: string, _refreshToken: string, profile: Profile, _done: () => void): Promise<any>;
}
export {};

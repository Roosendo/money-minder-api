"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const bootstrap_nest_1 = require("../../src/bootstrap.nest");
let server;
const handler = async (event, context, callback) => {
    server = server ?? (await (0, bootstrap_nest_1.bootstrapServerless)());
    return server(event, context, callback);
};
exports.handler = handler;
//# sourceMappingURL=api.js.map
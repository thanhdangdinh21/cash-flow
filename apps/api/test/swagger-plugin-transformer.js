// Runs the @nestjs/swagger CLI plugin under ts-jest, so the e2e spec matches `nest build`.
const transformer = require('@nestjs/swagger/plugin');

module.exports.name = 'nestjs-swagger-transformer';
module.exports.version = 1;
module.exports.factory = (cs) =>
  transformer.before({ introspectComments: true }, cs.program);

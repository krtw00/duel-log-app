const app = require('./_handler.cjs');

module.exports = (req) => app.fetch(req);

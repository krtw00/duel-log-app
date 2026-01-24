const app = require('../packages/api/dist/index.cjs');

module.exports = (req) => app.fetch(req);

#!env node
require('babel-core/register')
const Playground = require('../src/models/Playground')

Playground.sync()
  .then(() => {
    console.log('Database created')
    process.exit(0)
  })

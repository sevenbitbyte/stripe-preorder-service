

const DEFAULT_CONFIG = {
  rest: {
    restUri: 'http://0.0.0.0:4001',
    cors: {
      originUri: 'http://localhost:3000'
    }
  },
  stripeKey: null,
  aws_ses: {
    region: 'us-west-2',
    id: null,
    key: null
  },
}

module.exports = DEFAULT_CONFIG

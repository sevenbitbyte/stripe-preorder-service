const Joi = require('@hapi/joi')
const debug = require('debug')('has-account')
const Stripe = require('stripe')
const moment = require('moment')

const LookupAccount = require('../utils/lookup-account')

const schema = Joi.object().keys({
  jwt: Joi.string().required(),
});

module.exports.has_account = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false; 

  debug('has account')

  debug(event.body)

  const valid = Joi.attempt(
    JSON.parse(event.body),
    schema
  )

  const accountInfo = await LookupAccount(valid.jwt)

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.CORS_ORIGIN, // Required for CORS support to work
      'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
    },
    body: JSON.stringify(accountInfo)
  }
}

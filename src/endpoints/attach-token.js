const Joi = require('@hapi/joi')
const debug = require('debug')('attach-token')
const Stripe = require('stripe')
const moment = require('moment')

let stripe = Stripe(process.env.STRIPE_KEY)

const LookupAccount = require('../utils/lookup-account')

const schema = Joi.object().keys({
  jwt: Joi.string().required(),
  tokenId: Joi.string().required(),
})

module.exports.attach_token = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false

  console.log('has account')

  console.log(event.body)

  try {
    const valid = Joi.attempt(JSON.parse(event.body), schema)

    const accountInfo = await LookupAccount(valid.jwt)

    if (!accountInfo.customerId) {
      throw new Error('no stripe customer')
    }
    if (!accountInfo.emailVerified) {
      throw new Error('not verified')
    }

    let card = null
    debug(
      'setting default source/token for customer',
      accountInfo.customerId,
      accountInfo.email,
      valid.tokenId
    )
    card = await stripe.customers.update(accountInfo.customerId, {
      source: valid.tokenId,
    })

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*', // Required for CORS support to work
        'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
      },
      body: JSON.stringify({
        tokenId: valid.tokenId,
      }),
    }
  } catch (e) {
    debug(e)
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*', // Required for CORS support to work
        'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
      },
      body: JSON.stringify({
        error: 'There was an error while attaching the token.',
      }),
    }
  }
}

const Joi = require('@hapi/joi')
const debug = require('debug')('list-orders')
const Stripe = require('stripe')
const moment = require('moment')

const LookupAccount = require('../utils/lookup-account')

const schema = Joi.object().keys({
  jwt: Joi.string().required(),
})

let stripe = Stripe(process.env.STRIPE_KEY)

module.exports.list_orders = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false

  console.log('has account')

  console.log(event.body)

  const valid = Joi.attempt(JSON.parse(event.body), schema)

  try {
    const accountInfo = await LookupAccount(valid.jwt)

    if (!accountInfo.customerId) {
      throw new Error('no stripe customer')
    }
    if (!accountInfo.emailVerified) {
      throw new Error('not verified')
    }

    const orders = await stripe.orders.list({
      limit: 25,
      customer: accountInfo.customerId,
    })

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*', // Required for CORS support to work
        'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
      },
      body: JSON.stringify(orders),
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
        error: 'There was an error while getting the list of orders.',
      }),
    }
  }
}

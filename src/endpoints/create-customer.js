const Joi = require('@hapi/joi')
const debug = require('debug')('create-customer')
const Stripe = require('stripe')
const moment = require('moment')

const verifyJwt = require('../utils/verify-jwt')
const LookupAccount = require('../utils/lookup-account')

let stripe = Stripe(process.env.STRIPE_KEY)


const schema = Joi.object().keys({
  jwt: Joi.string().required(),
  customer: {
    name: Joi.string(),
    email: Joi.string().required(),
    phone: Joi.string(),
    shipping: {
      name: Joi.string().required(),
      phone: Joi.string(),
      address: {
        line1: Joi.string().required(),
        line2: Joi.string(),
        city: Joi.string(),
        state: Joi.string(),
        postal_code: Joi.string(),
        country: Joi.string(),
      }
    }
  }
});

module.exports.create_customer = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false; 

  debug('has account')

  debug(event.body)

  const valid = Joi.attempt(
    JSON.parse(event.body),
    schema
  )

  debug(valid)

  const verification = await verifyJwt(valid.jwt)

  debug(verification)
  
  const account = await LookupAccount(valid.jwt)

  if(!accountInfo.emailVerified){  throw new Error('not verified') }

  if(!account.customerId){
    debug('creating user', valid.customer.email)

    const customerData = await stripe.customers.create({
      ...valid.customer,
      description: 'PocketPC Customer'
    })

    account.customerId = customerData.id

    debug('created user', valid.customer.email, account.customerId)

  } else{

    debug('found stripe user', account.customerId, account.email)

   }

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*', // Required for CORS support to work
      'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
    },
    body: JSON.stringify(account)
  }
}


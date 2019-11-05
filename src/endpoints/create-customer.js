const Joi = require('@hapi/joi')
const debug = require('debug')('create-customer')
const Stripe = require('stripe')
const moment = require('moment')

const verifyJwt = require('../utils/verify-jwt')
const DefaultConfig = require('../default-config')

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

  const findByEmail = await stripe.customers.list({ email: verification.email })
  let customerStripeId = null

  if(findByEmail.data && findByEmail.data.length > 0){
    customerStripeId = findByEmail.data[0].id

    debug('found stripe user', customerStripeId)
  } else {
    

    debug('creating user', valid.customer.email)

    const customerData = await stripe.customers.create({
      ...valid.customer,
      description: 'PocketPC customer'
    })

    customerStripeId = customerData.id

    debug('created user', valid.customer.email, customerStripeId)

  }

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*', // Required for CORS support to work
      'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
    },
    body: JSON.stringify({
      isValid: verification.isValid,
      userName: verification.userName,
      clientId: verification.clientId,
      email: verification.email,
      emailVerified: verification.emailVerified,
      customerId: customerStripeId
    })
  }
}
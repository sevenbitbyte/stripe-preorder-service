const Joi = require('@hapi/joi')
const Hoek =require('@hapi/hoek')
const debug = require('debug')('create-order')
const Stripe = require('stripe')

const LookupAccount = require('../utils/lookup-account')

let stripe = Stripe(process.env.STRIPE_KEY)

const schema = Joi.object().keys({
  jwt: Joi.string().required(),
  products: Joi.array().items(
    Joi.object().keys({
      // Product
      sku: Joi.string().required(),
      quantity: Joi.number().required()
    }).required()
  )
});




module.exports.has_account = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false; 

  console.log('has account')

  console.log(event.body)

  const valid = Joi.attempt(
    JSON.parse(event.body),
    schema
  )

  const accountInfo = await LookupAccount(valid.jwt)

  if(!accountInfo.customerId){  throw new Error('no stripe customer') }
  if(!accountInfo.emailVerified){  throw new Error('not verified') }

  const items = valid.products.map( product => {
    return {
      type: 'sku',
      parent: product.sku,
      quantity: product.quantity
    }
  })

  // Create order
  const order = await stripe.orders.create({
    items,
    currency: 'usd',
    customer: accountInfo.customerId
  })



  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*', // Required for CORS support to work
      'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
    },
    body: JSON.stringify({
      orderId: order.id,
      order: order
    })
  }
}

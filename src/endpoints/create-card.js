const Joi = require('@hapi/joi')
const debug = require('debug')('create-card')
const Stripe = require('stripe')
const moment = require('moment')

let stripe = Stripe(process.env.STRIPE_KEY)

const LookupAccount = require('../utils/lookup-account')

const schema = Joi.object().keys({
  jwt: Joi.string().required(),
  card:{
    exp_month: Joi.number().required(),
    exp_year: Joi.number().required(),
    number: Joi.string().required(),     //! credit card number
    cvc: Joi.string().required(),
    name: Joi.string(),
    address_line1: Joi.string().required(),
    address_line2: Joi.string(),
    address_city: Joi.string(),
    address_state: Joi.string(),
    address_postal_code: Joi.string(),
    address_country: Joi.string(),
  }
});

module.exports.create_card = async (event, context, callback) => {
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

  let card = null
  const sources = await stripe.customers.listSources( accountInfo.customerId, {object:'card'} )

  if(sources.data.length > 0){
    // found existing source
  }
  else {
    // create new source
    debug('creating new source for customer', accountInfo.customerId, accountInfo.email)
    card = await stripe.customers.createSource( 
      accountInfo.customerId,{
        source: {
        ...valid.card,
        object: 'card'
       }
      }
    )
  }

  // reply with source id


  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*', // Required for CORS support to work
      'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
    },
    body: JSON.stringify({
      cardId: card.id
    })
  }
}

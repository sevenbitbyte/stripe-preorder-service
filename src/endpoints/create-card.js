const Joi = require('@hapi/joi')
const debug = require('debug')('funding-status')
const Stripe = require('stripe')
const moment = require('moment')

let stripe = Stripe(process.env.STRIPE_KEY)

const LookupAccount = require('../utils/lookup-account')

const schema = Joi.object().keys({
  jwt: Joi.string().required(),
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

  if(!accountInfo.customerId){ return }

  const sources = await stripe.customers.listSources( accountInfo.customerId, {object:'card'} )

  if(sources.data.length > 0){
    // found existing source
  }
  else {
    // create new source
  }

  // reply with source id


  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*', // Required for CORS support to work
      'Access-Control-Allow-Credentials': true, // Required for cookies, authorization headers with HTTPS
    },
    body: JSON.stringify(accountInfo)
  }
}

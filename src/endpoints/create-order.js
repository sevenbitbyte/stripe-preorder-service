const Joi = require('@hapi/joi')
const Hoek =require('@hapi/hoek')
const debug = require('debug')('create-order')
const Stripe = require('stripe')

const DefaultConfig = require('../default-config')
const LookupAccount = require('../utils/lookup-account')

let stripe = Stripe(process.env.STRIPE_KEY)

const schema = Joi.object().keys({
  jwt: Joi.string().required(),
  products: Joi.array().items(
    Joi.object().keys({
      // Product
      sku: Joi.string().allow(
        'pocket-pc',
        'pocket-pc-lora',
      ).required(),
      qty: Joi.number().required()
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
      quantity: product.qty
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
      order: {
        id: order.id,
        amount: order.amount
      }
    })
  }
}



module.exports.create_order = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false; 

  /**
   * @TODO 
   *  - get email address from login provider session
   *  - remove email address from joi schema
   */

  const loginEmail = event.body.email

  try {
    const valid = Joi.attempt(
      {
        ...event.body,
        email: loginEmail
      },
      schema
    )

    console.log(valid)

    // Ensure source is valid
    const source = await stripe.sources.retrieve(valid.source)

    if(!source){ throw new Error('InvalidPaymentSource') }

    let customer = (await stripe.customers.list({
      email: valid.email
    })).data[0]

    if(!customer){
      debug('creating customer for', valid.email)
      await stripe.customers.create({
        name: valid.name,
        email: valid.email,
        source: source.id,
        shipping: Hoek.reach(valid, 'shipping.address')
      })
    }
    else {
      debug('found customer', customer.id, 'for email', valid.email)
    }

    
    let countGR8 = 0
    const items = []
    for(const product of valid.products){

      if(product.sku.indexOf('pocket-pc') > -1){
        // Count GR8 in pocket-pc
        countGR8 += product.sku.qty
      }

      items.push({
        type: 'sku',
        parent: product.sku,
        quantity: product.qty
      })
    }

    if(countGR8 > 0){
      items.push({
        type: 'sku',
        parent: 'gr8',
        quantity: countGR8
      })
    }


    // Create order
    const order = await stripe.orders.create({
      items,
      currency: 'usd',
      customer: customer.id
    })

    callback(null,{
      statusCode: 200,
      body: JSON.stringify({
        customer: {
          id: customer.id
        },
        order: {
          data: order,
          id: order.id,
          timestamp: Date.now(),
          products: valid.products,
          shipping: valid.shipping
        }
      })
    });
  } catch(e) {
    if(e.name == 'ValidationError'){
      //console.log('msg -', e.message);
      callback(null,{
        statusCode: 500,
        body: JSON.stringify(
          { error: { name: e.name }}
        ),
      });
    }
    else {
      //console.log(e.name)
      //console.log('ERROR - ', e)
      callback(null,{
        statusCode: 500,
        body: JSON.stringify({
          error: {
          name: 'BadRequest',
          message: 'BadRequest'
        }})
      });
    }
  }
}
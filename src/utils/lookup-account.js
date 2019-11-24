const Stripe = require('stripe')
const debug = require('debug')('util.lookup-account')

const verifyJwt = require('./verify-jwt')

let stripe = Stripe(process.env.STRIPE_KEY)


const LookupAccount = async (jwt)=>{
  debug('lookup')

  const verification = await verifyJwt(jwt)

  debug('jwt email', verification.email)

  const findByEmail = await stripe.customers.list({ email: verification.email })
  let customerStripeId = null
  let stripeSourceId = null
  let stripeAddress = null

  if(findByEmail.data && findByEmail.data.length > 0){

    customerStripeId = findByEmail.data[0].id
    stripeSourceId = findByEmail.data[0].default_source
    stripeAddress = findByEmail.data[0].address

    debug('stripe keys', Object.keys(findByEmail.data[0]))
    debug('shipping address', stripeAddress)
    
    debug('found stripe user', customerStripeId)


  } else {

    debug('no stripe user')

  }

  return {
    isValid: verification.isValid,
    userName: verification.userName,
    clientId: verification.clientId,
    email: verification.email,
    emailVerified: verification.emailVerified,
    customerId: customerStripeId,
    sourceId: stripeSourceId,
    address: stripeAddress
  }
}



module.exports = LookupAccount
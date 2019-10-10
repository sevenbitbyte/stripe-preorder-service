const debug = require('debug')('preorder.endpoint.place-order')
const Joi = require('joi')



const validator = Joi.object().keys({
  source: Joi.string().required(),
  email: Joi.string().email().required(),
  
  products: Joi.array().items( Joi.object().keys({
    // Product
    upc: Joi.string().required(),
    qty: Joi.number().required()
  }).required()
  ),
  shipping: {
    name: Joi.string(),
    address: {
      line1: Joi.string(),
      city: Joi.string(),
      state: Joi.string(),
      country: Joi.string(),
      postal_code: Joi.string()
    }
  }
})

const Handler = async function(req, res){
  debug('express', req.body)

  const valid = await Joi.validate(req.body, validator)

  debug(valid)

  res.send({
    customer: {
      id: 'st_cus_xy2cfjgj54'
    },
    order: {
      order_id: 'abc_123_xyz_0987',
      timestamp: Date.now(),
      products: valid.products,
      shipping: valid.shipping
    }
  })
}

exports.express = async function(req, res){
  try{
    return await Handler(req, res)
  }
  catch(e){
    if(e.name == 'ValidationError'){

      debug('msg -', e.message)
      res.status(500).send({
        error: {
          name: e.name,
          message: e.message
        }
      })

      return
      
    }
    else {
      debug(e.name)
      debug('ERROR - ', e)
      res.status(500).send({
        error: {
          name: 'BadRequest',
          message: 'BadRequest'
        }
      })
    }
  }
}



exports.handler = async function(event) {
  const promise = new Promise(function(resolve, reject) {
    resolve()
  })
    
  return promise
}
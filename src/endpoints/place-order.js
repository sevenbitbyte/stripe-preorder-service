const Joi = require('@hapi/joi')
const DefaultConfig = require('../default-config')

const schema = Joi.object().keys({
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
});

module.exports.place_order = async (event, context, callback) => {
  context.callbackWaitsForEmptyEventLoop = false; 

  

  try {
    const valid = Joi.attempt(event.body, validator);

    console.log(valid);

    callback(null,{
      statusCode: 200,
      body: JSON.stringify({
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
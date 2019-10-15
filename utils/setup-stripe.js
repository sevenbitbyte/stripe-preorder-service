const Hoek = require('hoek')
const debug = require('debug')('setup-stripe')
const Stripe = require('stripe')

console.log(process.env.STRIPE_KEY)


const PRODUCTS = {
  processor: {
    product: {
      name: 'processor',
      description: 'Processor Type',
      type: 'good',
      attributes: ['model']
    },
    sku: {
      gr8: {
        price: 100,
        active: true,
        attributes: {
          model: 'gr8'
        },
        inventory: {
          type: 'finite',
          quantity: 450,
          value: null
        }
      }
    }
  },
  'pocket-pc': {
    product: {
      name: 'pocket-pc',
      description: 'Pocket Popcorn Computer',
      type: 'good',
      shippable: true,
      active: true,
      attributes: ['lora', 'processor', 'sku', 'rf-region']
    },
    sku: {
      'pocket-pc': {
        price: 20000,
        active: true,
        attributes: {
          sku: 1,
          lora: false,
          processor: 'gr8',
          'rf-region': null
        }
      },
      'pocket-pc-lora': {
        price: 29900,
        active: true,
        attributes: {
          sku: 3,
          lora: true,
          processor: 'gr8',
          'rf-region': 'eu-us-as-kr-in-au'
        }
      },
      'pocket-pc-lora-cn': {
        price: 29900,
        active: true,
        attributes: {
          sku: 4,
          lora: true,
          processor: 'gr8',
          'rf-region': 'cn'
        }
      }
    }
  },
  'popcorn-computer': {
    product: {
      name: 'popcorn-computer',
      description: 'Pocket Popcorn Computer',
      type: 'good',
      shippable: true,
      active: true,
      attributes: ['processor', 'sku']
    },
    sku: {
      'original': {
        price: 4900,
        active: true,
        attributes: {
          sku: 5,
          processor: 'r8'
        }
      }
    }
  }
}

const BUNDLES = {
  'pocket-preorder': {
    items: ['processor.gr8', 'pocket.pocket-pc']
  },
  'pocket-lora-preorder': {
    items: ['processor.gr8', 'pocket.pocket-pc-lora']
  },

}



class ProductSKUListing {
  constructor(stripe){
    this.stripe = stripe
    this.cache = {
      products: null,
      sku: null
    }

    this.productNameIdMap = {}
    this.productIds = []
    this.skuIds = []
  }


  hasProduct(id){
    return this.productIds.indexOf(id) > -1
  }


  hasSKU(id){
    return this.skuIds.indexOf(id) > -1
  }

  getProduct(id){
    if(!this.hasProduct(id)){ return null }

    for(const product of this.cache.products){
      if(product.id == id){
        return product
      }
    }

    return null
  }

  getSKU(id){
    if(!this.hasSKU(id)){ return null }

    for(const sku of this.cache.sku){
      if(sku.id == id){
        return sku
      }
    }
    
    return null
  }
  
  async pull(){
    this.cache.products = (await this.stripe.products.list()).data
    this.cache.sku = (await this.stripe.skus.list()).data

    this.productNameIdMap = {}
    this.productIds = []
    this.skuIds = []

    this.cache.products.map(cloudProduct=>{ 
      this.productNameIdMap[cloudProduct.name] = cloudProduct.id
      this.productIds.push(cloudProduct.id)
    })

    this.cache.sku.map(cloudSku=>{ 
      this.skuIds.push(cloudSku.id)
    })

    /*for(const p of this.cache.products){
      debug('delete', p.id)
      await this.stripe.products.del(p.id)
    }

    for(const s of this.cache.sku){
      debug('delete', s.id)
      await this.stripe.skus.del(s.id)
    }

    process.exit()*/
  }

  async addProducts(products){
    
    await this.pull()

    const productList = Object.keys(products).map(k=>Hoek.reach(products, k))
  
    /*productList.map( async (product)=>{
      await this.addProduct(product.product, product.sku)
    })*/

    for(const product of productList){
      debug('product', product.product.name)
      await this.addProduct(product.product, product.sku)
    }

    await this.pull()

    return this.cache
  }


  async addProduct(details, skus){

    //let cloudProductId = this.productNameIdMap[details.name]
    let cloudProduct = this.getProduct(details.name)
    if(cloudProduct !== null){
      debug('\t skip product', details.name)
    }
    else{
      
      debug('\t add product', details.name)

      cloudProduct = await this.stripe.products.create({
        id: details.name,
        ...details
      })
    }

    let skuPromises = []

    debug(cloudProduct)

    for(const skuId of Object.keys(skus)){
      debug('\t\tconsider sku', skuId)

      let cloudSku = this.getSKU(skuId)

      if(!cloudSku){
        const sku = {
          id: skuId,
          currency: 'usd',
          inventory: skus[skuId].inventory || {type:'bucket', value: 'in_stock'},
          product: cloudProduct.id,
          ...skus[skuId]
        }

        debug('\t\t',skuId, sku)

        await this.addSKU(sku)
      }
    }

  }


  async addSKU(details){

    debug('\t add sku', details.id)

    const cloudSku = await this.stripe.skus.create(details)
  }

  async getInventory(){}
}

/**
 * 1. create products
 * 2. create SKUs
 */

async function main(){

  let stripe = Stripe(process.env.STRIPE_KEY)

  let productListing = new ProductSKUListing(stripe)

  debug('bundles', BUNDLES)
  debug('products', PRODUCTS)

  const cloudProducts = await productListing.addProducts(PRODUCTS)


  console.log(cloudProducts)
}


// Run main
main().catch((error) => {

  console.error(error)

  process.exit()
})
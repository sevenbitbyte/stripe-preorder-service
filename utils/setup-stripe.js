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
      shippable: true,
      active: true,
      attributes: ['lora', 'processor']
    },
    sku: {
      gr8: {
        price: 0,
        active: true,
        attributes: {
          processor: 'gr8'
        },
        inventory: {
          type: 'finite',
          quantity: 450
        }
      }
    }
  },
  pocket: {
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
          processor: 'gr8'
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
  }


  async addProducts(products){
    
    this.cache.products = (await this.stripe.products.list()).data
    this.cache.sku = (await this.stripe.skus.list()).data


    this.cache.products.map(cloudProduct=>{ this.productNameIdMap[cloudProduct.name] = cloudProduct.id })

    const productList = Object.keys(products).map(k=>Hoek.reach(products, k))
  
    productList.map( async (product)=>{
      await this.addProduct(product.product, product.sku)
    })

    return this.cache
  }

  async addProduct(details, sku){

    let cloudProductId = this.productNameIdMap[details.name]
    if(cloudProductId){
      debug('\t skip product', details.name, cloudProductId)
    }
    else{
      
      debug('\t add product', details.name)

      const cloudProduct = await this.stripe.products.create(details)

      this.productNameIdMap[cloudProduct.name] = cloudProduct.id
    }

    
  }

  async addSKU(productNameOrId, details){
    let cloudSkuId = this.skuNameIdMap[details.name]
    if(cloudProductId){
      debug('\t skip product', details.name, cloudProductId)
      return
    }

    debug('\t add product', details.name)

    const cloudProduct = await this.stripe.products.create(details)

    this.productNameIdMap[cloudProduct.name] = cloudProduct.id
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

  console.log(BUNDLES)
  console.log(PRODUCTS)

  const cloudProducts = await productListing.addProducts(PRODUCTS)


  console.log(cloudProducts)
}


// Run main
main().catch((error) => {

  console.error(error)

  process.exit()
})
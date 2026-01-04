# Products and Apps Architecture Plan                                                                                                                       
                                                                                                                                                            
## Overview                                                                                                                                                 
We're transitioning from a single-subscription model to a multi-product system where:                                                                       
1. **Base Subscription** ($2/month) - Required for all users                                                                                                
2. **Optional Product Subscriptions** - Additional monthly charges for ambitious projects                                                                   
3. **Apps** - Individual applications/games that are unlocked by specific products                                                                          
                                                                                                                                                            
## Collections Design                                                                                                                                       
                                                                                                                                                            
### 1. Products Collection (`lib/collections/products.js`)                                                                                                  
```javascript                                                                                                                                               
// Schema for Products collection                                                                                                                           
{                                                                                                                                                           
  _id: String,           // Meteor-generated ID                                                                                                             
  name: String,          // Display name (e.g., "Base Monthly")                                                                                             
  description: String,    // Detailed description                                                                                                           
  sortOrder: Number,     // Display order (lower = first)                                                                                                   
  checkoutUUID: String,  // Lemon Squeezy checkout UUID (optional initially)                                                                                
  productID: Number,     // Lemon Squeezy product ID (optional initially)                                                                                   
  pricePerMonthUSD: Number,  // Decimal price (e.g., 2.00)                                                                                                  
  gitHubURL: String,     // Optional GitHub repo link                                                                                                       
  paymentInstructions: String, // Payment details for owners                                                                                                
  isApproved: Boolean,   // Default: false                                                                                                                  
  createdAt: Date,                                                                                                                                          
  updatedAt: Date,                                                                                                                                          
  createdBy: String,     // User ID who created this                                                                                                        
  isRequired: Boolean,     // Is this product required? (Base subscription)                                                                                   
  isActive: Boolean        // Soft delete flag                                                                                                                
}                                                                                                                                                           
                                                                                                                                                            

2. Apps Collection (lib/collections/apps.js)                                                                                                                

                                                                                                                                                            
// Schema for Apps collection                                                                                                                               
{                                                                                                                                                           
  _id: String,           // Meteor-generated ID                                                                                                             
  name: String,          // Display name (e.g., "Backlog Beacon")                                                                                           
  description: String,   // Detailed description                                                                                                            
  productId: String,     // References Products._id                                                                                                         
  gitHubURL: String,     // Optional GitHub repo link                                                                                                       
  ageRating: String,     // ESRB rating (e.g., "E", "T", "M")                                                                                               
  isApproved: Boolean,   // Default: false                                                                                                                  
  createdAt: Date,                                                                                                                                          
  updatedAt: Date,                                                                                                                                          
  createdBy: String,     // User ID who created this                                                                                                        
  isActive: Boolean        // Soft delete flag                                                                                                                
}                                                                                                                                                           
                                                                                                                                                            

3. Join Collections (Many-to-Many Relationships)                                                                                                            

ProductOwners (lib/collections/productOwners.js)                                                                                                            

                                                                                                                                                            
{                                                                                                                                                           
  _id: String,                                                                                                                                              
  productId: String,     // References Products._id                                                                                                         
  userId: String,       // References Meteor.users._id                                                                                                      
  role: String,         // "owner", "maintainer", "contributor"                                                                                             
  sharePercentage: Number, // Decimal percentage (0-100)                                                                                                    
  createdAt: Date,                                                                                                                                          
  createdById: String     // Who assigned this ownership: References Meteor.users._id
}                                                                                                                                                           
                                                                                                                                                            

AppOwners (lib/collections/appOwners.js)                                                                                                                    

                                                                                                                                                            
{                                                                                                                                                           
  _id: String,                                                                                                                                              
  appId: String,         // References Apps._id                                                                                                             
  userId: String,       // References Meteor.users._id                                                                                                      
  role: String,         // "owner", "maintainer", "contributor"                                                                                             
  sharePercentage: Number, // Decimal percentage (0-100)                                                                                                    
  createdAt: Date,                                                                                                                                          
  createdById: String     // Who assigned this ownership: References Meteor.users._id
}                                                                                                                                                           
                                                                                                                                                            


User Subscription Data Refactor                                                                                                                             

Current Structure (Single Subscription):                                                                                                                    

                                                                                                                                                            
user.lemonSqueezy: {                                                                                                                                        
  customerId: String,                                                                                                                                       
  subscriptions: [{                                                                                                                                         
    subscriptionId: String,                                                                                                                                 
    productId: String,      // Lemon Squeezy product ID                                                                                                     
    // ... other fields                                                                                                                                     
  }]                                                                                                                                                        
}                                                                                                                                                           
user.subscription: {                                                                                                                                        
  status: String,                                                                                                                                           
  planName: String,                                                                                                                                         
  validUntil: Date                                                                                                                                          
}                                                                                                                                                           
                                                                                                                                                            

New Structure (Multiple Products):                                                                                                                          

                                                                                                                                                            
user.lemonSqueezy: {                                                                                                                                        
  customerId: String,                                                                                                                                       
  subscriptions: [{                                                                                                                                         
    subscriptionId: String,                                                                                                                                 
    productId: String,      // Lemon Squeezy product ID                                                                                                     
    checkoutUUID: String,   // Lemon Squeezy checkout UUID for link to purchase
    status: String,                                                                                                                                         
    productName: String,                                                                                                                                    
    renewsAt: Date,                                                                                                                                         
    endsAt: Date,                                                                                                                                           
    // ... other Lemon Squeezy fields                                                                                                                       
  }]                                                                                                                                                        
}                                                                                                                                                           
user.products: [{                                                                                                                                           
  productId: String,        // References our Products._id                                                                                                  
  checkoutUUID: String,     // For lookup                                                                                                                   
  status: String,           // 'active', 'cancelled', 'expired'                                                                                             
  validUntil: Date,                                                                                                                                         
  lemonSqueezyId: String,   // Links to lemonSqueezy.subscriptions                                                                                          
  createdAt: Date,                                                                                                                                          
  updatedAt: Date                                                                                                                                           
}]                                                                                                                                                          
                                                                                                                                                            


Migration Strategy                                                                                                                                          

1. Install Migration Package                                                                                                                                

                                                                                                                                                            
meteor add quave:migrations
https://packosphere.com/quave/migrations
                                                                                                                                                            

2. Initial Migration (server/migrations/1_initial_products.js)                                                                                              

                                                                                                                                                            
import { Migrations } from 'meteor/quave:migrations';                                                                                                   
import Products from '/lib/collections/products';                                                                                                           
import Apps from '/lib/collections/apps';                                                                                                                   
                                                                                                                                                            
Migrations.add({                                                                                                                                            
  version: 1,                                                                                                                                               
  name: 'Create initial base product and apps',                                                                                                             
  up() {                                                                                                                                                    
    // Create Base Monthly Product                                                                                                                          
    const baseProductId = Products.insert({                                                                                                                 
      name: 'Base Monthly',                                                                                                                                 
      description: 'Access to fundamental apps and games including Backlog Beacon',                                                                         
      sortOrder: 0,                                                                                                                                         
      pricePerMonthUSD: 2.00,                                                                                                                               
      isApproved: true,                                                                                                                                     
      isRequired: true,                                                                                                                                       
      isActive: true,                                                                                                                                         
      createdAt: new Date(),                                                                                                                                
      updatedAt: new Date(),                                                                                                                                
      createdBy: 'system'                                                                                                                                   
    });                                                                                                                                                     
                                                                                                                                                            
    // Create Backlog Beacon App                                                                                                                            
    Apps.insert({                                                                                                                                           
      name: 'Backlog Beacon',                                                                                                                               
      description: 'Track your personal video game collection',                                                                                             
      productId: baseProductId,                                                                                                                             
      ageRating: 'E',                                                                                                                                       
      isApproved: true,                                                                                                                                     
      isActive: true,                                                                                                                                         
      createdAt: new Date(),                                                                                                                                
      updatedAt: new Date(),                                                                                                                                
      createdBy: 'system'                                                                                                                                   
    });                                                                                                                                                     
                                                                                                                                                            
    // Migrate existing users                                                                                                                               
    Meteor.users.find({ 'subscription.status': 'active' }).forEach(user => {                                                                                
      Meteor.users.update(user._id, {                                                                                                                       
        $set: {                                                                                                                                             
          'products': [{                                                                                                                                    
            productId: baseProductId,                                                                                                                       
            status: user.subscription.status,                                                                                                               
            validUntil: user.subscription.validUntil,                                                                                                       
            lemonSqueezyId: user.lemonSqueezy?.subscriptions?.[0]?.subscriptionId,                                                                          
            createdAt: new Date(),                                                                                                                          
            updatedAt: new Date()                                                                                                                           
          }]                                                                                                                                                
        }                                                                                                                                                   
      });                                                                                                                                                   
    });                                                                                                                                                     
  },                                                                                                                                                        
  down() {                                                                                                                                                  
    // Rollback if needed                                                                                                                                   
    Products.remove({});                                                                                                                                    
    Apps.remove({});                                                                                                                                        
    Meteor.users.update({}, { $unset: { products: 1 } }, { multi: true });                                                                                  
  }                                                                                                                                                         
});                                                                                                                                                         
                                                                                                                                                            


Implementation Phases                                                                                                                                       

Phase 1: Database & Migration (Week 1)                                                                                                                      

 1 Create collection files                                                                                                                                  
 2 Set up migration system                                                                                                                                  
 3 Run initial migration                                                                                                                                    
 4 Update webhooks to handle new structure                                                                                                                  

Phase 2: Backend Refactor (Week 2)                                                                                                                          

 1 Update server/methods/subscriptions.js                                                                                                                   
 2 Update server/publications.js                                                                                                                            
 3 Update server/webhooks/lemonSqueezy.js                                                                                                                   
 4 Create helper methods for product/app queries                                                                                                            

Phase 3: Frontend Updates (Week 3)                                                                                                                          

 1 Create new UI components                                                                                                                                 
 2 Update SubscriptionButton component                                                                                                                      
 3 Update SubscriberCount component                                                                                                                         
 4 Update HomePage to show multiple products                                                                                                                

Phase 4: Admin Interface (Week 4)                                                                                                                           

 1 Create admin pages for managing products/apps                                                                                                            
 2 Add approval workflows                                                                                                                                   
 3 Add ownership management                                                                                                                                 


Detailed Code Changes                                                                                                                                       

1. Update server/methods/subscriptions.js                                                                                                                   

                                                                                                                                                            
// Add new methods:                                                                                                                                         
Meteor.methods({                                                                                                                                            
  'products.getAll': function() {                                                                                                                           
    return Products.find({                                                                                                                                  
      isApproved: true,                                                                                                                                     
      isActive: true                                                                                                                                          
    }, {                                                                                                                                                    
      sort: { sortOrder: 1 }                                                                                                                                
    }).fetch();                                                                                                                                             
  },                                                                                                                                                        
                                                                                                                                                            
  'products.getApps': function(productId) {                                                                                                                 
    return Apps.find({                                                                                                                                      
      productId: productId,                                                                                                                                 
      isApproved: true,                                                                                                                                     
      isActive: true                                                                                                                                          
    }).fetch();                                                                                                                                             
  },                                                                                                                                                        
                                                                                                                                                            
  'subscriptions.getUserProducts': function() {                                                                                                             
    if (!this.userId) throw new Meteor.Error('not-authorized');                                                                                             
                                                                                                                                                            
    const user = Meteor.users.findOne(this.userId);                                                                                                         
    const userProducts = user?.products || [];                                                                                                              
                                                                                                                                                            
    // Get product details for each subscription                                                                                                            
    return userProducts.map(userProduct => {                                                                                                                
      const product = Products.findOne(userProduct.productId);                                                                                              
      return {                                                                                                                                              
        ...userProduct,                                                                                                                                     
        productDetails: product                                                                                                                             
      };                                                                                                                                                    
    });                                                                                                                                                     
  }                                                                                                                                                         
});                                                                                                                                                         
                                                                                                                                                            

2. Update server/publications.js                                                                                                                            

                                                                                                                                                            
// Add publications for products and apps                                                                                                                   
Meteor.publish('products', function() {                                                                                                                     
  return Products.find({                                                                                                                                    
    isApproved: true,                                                                                                                                       
    isActive: true                                                                                                                                            
  }, {                                                                                                                                                      
    sort: { sortOrder: 1 },                                                                                                                                 
    fields: {                                                                                                                                               
      name: 1,                                                                                                                                              
      description: 1,                                                                                                                                       
      sortOrder: 1,                                                                                                                                         
      pricePerMonthUSD: 1,                                                                                                                                  
      required: 1                                                                                                                                           
    }                                                                                                                                                       
  });                                                                                                                                                       
});                                                                                                                                                         
                                                                                                                                                            
Meteor.publish('apps', function() {                                                                                                                         
  return Apps.find({                                                                                                                                        
    isApproved: true,                                                                                                                                       
    isActive: true                                                                                                                                            
  }, {                                                                                                                                                      
    fields: {                                                                                                                                               
      name: 1,                                                                                                                                              
      description: 1,                                                                                                                                       
      productId: 1,                                                                                                                                         
      ageRating: 1                                                                                                                                          
    }                                                                                                                                                       
  });                                                                                                                                                       
});                                                                                                                                                         
                                                                                                                                                            
// Update currentUser publication to include products                                                                                                       
Meteor.publish('currentUser', function() {                                                                                                                  
  if (!this.userId) return this.ready();                                                                                                                    
                                                                                                                                                            
  return Meteor.users.find({ _id: this.userId }, {                                                                                                          
    fields: {                                                                                                                                               
      'emails': 1,                                                                                                                                          
      'profile': 1,                                                                                                                                         
      'products': 1,                                                                                                                                        
      'lemonSqueezy.customerId': 1,                                                                                                                         
      'lemonSqueezy.subscriptions': 1,                                                                                                                      
      'createdAt': 1                                                                                                                                        
    }                                                                                                                                                       
  });                                                                                                                                                       
});                                                                                                                                                         
                                                                                                                                                            

3. Update imports/ui/components/SubscriptionButton.js                                                                                                       

                                                                                                                                                            
// Change from single product to dynamic productId prop                                                                                                     
// Component will fetch product details from Products collection                                                                                            
// Show subscription status for specific product                                                                                                            
// Handle checkout for specific product                                                                                                                     
                                                                                                                                                            

4. Update imports/ui/components/SubscriberCount.js                                                                                                          

                                                                                                                                                            
// Add productId parameter to count subscribers for specific product                                                                                        
// Update publication to accept productId parameter                                                                                                         
                                                                                                                                                            

5. Create New Components                                                                                                                                    

 • ProductList.js - Lists all approved products                                                                                                             
 • ProductCard.js - Individual product card with subscribe button                                                                                           
 • UserProducts.js - Shows user's current subscriptions                                                                                                     
 • AppList.js - Shows apps grouped by product                                                                                                               


Webhook Updates                                                                                                                                             

Update server/webhooks/lemonSqueezy.js to:                                                                                                                  

 1 Match subscriptions by checkoutUUID in custom data                                                                                                       
 2 Update the correct product in user.products array                                                                                                        
 3 Handle multiple subscriptions per user                                                                                                                   


Settings Configuration                                                                                                                                      

Update settings.json to remove hardcoded product ID:                                                                                                        

                                                                                                                                                            
{                                                                                                                                                           
  "public": {                                                                                                                                               
    "appName": "Kokokino Hub"                                                                                                                               
  },                                                                                                                                                        
  "private": {                                                                                                                                              
    "lemonSqueezy": {                                                                                                                                       
      "storeName": "kokokino",                                                                                                                              
      "apiKey": "your-api-key",                                                                                                                             
      "webhookSecret": "your-webhook-secret"                                                                                                                
    }                                                                                                                                                       
  }                                                                                                                                                         
}                                                                                                                                                           
                                                                                                                                                            


Security Considerations                                                                                                                                     

 1 Publications Security: Only publish approved, active products                                                                                            
 2 Method Security: Check user permissions for admin methods                                                                                                
 3 Ownership Security: Validate ownership assignments                                                                                                       
 4 Webhook Security: Continue using signature verification                                                                                                  


Testing Strategy                                                                                                                                            

 1 Unit Tests: Test collection schemas and methods                                                                                                          
 2 Integration Tests: Test product-app relationships                                                                                                        
 3 Migration Tests: Test migration up/down                                                                                                                  
 4 Webhook Tests: Test subscription lifecycle                                                                                                               


Deployment Checklist                                                                                                                                        

 • [ ] Create collections with proper indexes                                                                                                               
 • [ ] Run initial migration                                                                                                                                
 • [ ] Update webhook handlers                                                                                                                              
 • [ ] Update UI components                                                                                                                                 
 • [ ] Test multi-product checkout flow                                                                                                                     
 • [ ] Test migration of existing users                                                                                                                     
 • [ ] Update documentation                                                                                                                                 


Future Enhancements                                                                                                                                         

 1 Product Bundles: Combine multiple products                                                                                                               
 2 Tiered Pricing: Different price points for same product                                                                                                  
 3 Trial Periods: Free trials for products                                                                                                                  
 4 Family Plans: Share subscriptions across users                                                                                                           
 5 Analytics: Track product popularity and revenue                                                                                                          

────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
Last Updated: 2025-12-19 Next Review: 2026-01-19                                                                                                            

                                                                                                                                                            
                                                                                                                                                            
This plan provides a comprehensive architecture for your multi-product system. The key changes are:                                                         
                                                                                                                                                            
1. **New Collections**: Products, Apps, and join tables for ownership                                                                                       
2. **User Data Refactor**: Store multiple products in `user.products` array                                                                                 
3. **Migration System**: Use `quave:migrations` for database changes                                                                                    
4. **Dynamic UI**: Components that work with any number of products                                                                                         
5. **Backward Compatibility**: Migration handles existing users                                                                                             
                                                                                                                                                            
The implementation is phased to minimize risk and allow for testing at each stage.

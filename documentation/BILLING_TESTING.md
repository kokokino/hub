I'll help you step by step with setting up Lemon Squeezy. Let's go through the process:                                                                     


Step 1: Get Your Store Details                                                                                                                              

 1 In Lemon Squeezy dashboard, go to Settings → Store                                                                                                       
 2 Note your Store ID (you'll need this)                                                                                                                    
 3 Also note your Store Name (the subdomain part of your store URL)                                                                                         


Step 2: Get API Key                                                                                                                                         

 1 Go to Settings → API                                                                                                                                     
 2 Click Create API Key                                                                                                                                     
 3 Give it a name like "Kokokino Hub Production"                                                                                                            
 4 Copy the API Key (you'll only see it once!)                                                                                                              


Step 3: Set Up Webhooks                                                                                                                                     

First, you need to deploy your app to get a public URL                                                                                                      

If you haven't deployed yet, you can test locally using ngrok:                                                                                              

                                                                                                                                                            
# Install ngrok if you haven't                                                                                                                              
npm install -g ngrok                                                                                                                                        
                                                                                                                                                            
# Start Meteor                                                                                                                                              
meteor --settings settings.json                                                                                                                             
                                                                                                                                                            
# In another terminal, expose your local server                                                                                                             
ngrok http 3000                                                                                                                                             
                                                                                                                                                            

You'll get a URL like https://abc123.ngrok.io                                                                                                               

Configure Webhook in Lemon Squeezy:                                                                                                                         

 1 Go to Settings → Webhooks                                                                                                                                
 2 Click Create Webhook                                                                                                                                     
 3 Endpoint URL: https://your-domain.com/webhooks/lemon-squeezy (or your ngrok URL)                                                                         
 4 Secret: Generate a random secret string (you'll need this for your settings)                                                                             
 5 Events to send: Select these events:                                                                                                                     
    • subscription_created                                                                                                                                  
    • subscription_updated                                                                                                                                  
    • subscription_cancelled                                                                                                                                
    • subscription_expired                                                                                                                                  
    • subscription_paused                                                                                                                                   
    • subscription_unpaused                                                                                                                                 
    • subscription_payment_success                                                                                                                          
    • subscription_payment_failed                                                                                                                           
    • subscription_payment_recovered                                                                                                                        


Step 4: Get Your Product/Variant ID                                                                                                                         

 1 Go to Products                                                                                                                                           
 2 Click on your "base_monthly" product                                                                                                                     
 3 You'll see a Variant ID (looks like 123456)                                                                                                              
 4 Also note the Product ID (different from variant ID)                                                                                                     


Step 5: Update Your settings.json File                                                                                                                      

Create or update your settings.json file:                                                                                                                   

                                                                                                                                                            
{                                                                                                                                                           
  "public": {                                                                                                                                               
    "appName": "Kokokino Hub"                                                                                                                               
  },                                                                                                                                                        
  "private": {                                                                                                                                              
    "MAIL_URL": "smtp://username:password@smtp.example.com:587",                                                                                            
    "lemonSqueezy": {                                                                                                                                       
      "storeId": "YOUR_STORE_ID",                                                                                                                           
      "storeName": "YOUR_STORE_NAME",  # e.g., "kokokino"                                                                                                   
      "apiKey": "YOUR_API_KEY",                                                                                                                             
      "webhookSecret": "YOUR_WEBHOOK_SECRET"                                                                                                                
    }                                                                                                                                                       
  }                                                                                                                                                         
}                                                                                                                                                           
                                                                                                                                                            


Step 6: Test Your Product Link                                                                                                                              

Your checkout URL will be:                                                                                                                                  

                                                                                                                                                            
https://YOUR_STORE_NAME.lemonsqueezy.com/checkout/buy/PRODUCT_VARIANT_ID                                                                                    
                                                                                                                                                            

You can test this directly in browser first.                                                                                                                


Step 7: Test the Integration                                                                                                                                

Test with ngrok (local development):                                                                                                                        

 1 Start Meteor with settings:                                                                                                                              

                                                                                                                                                            
meteor --settings settings.json                                                                                                                             
                                                                                                                                                            

 2 Start ngrok:                                                                                                                                             

                                                                                                                                                            
ngrok http 3000                                                                                                                                             
                                                                                                                                                            

 3 Update Lemon Squeezy webhook to use your ngrok URL                                                                                                       
 4 Make a test purchase using Lemon Squeezy's test cards:                                                                                                   
    • 4242 4242 4242 4242 - Success                                                                                                                         
    • 4000 0000 0000 0002 - Card declined                                                                                                                   
    • 4000 0000 0000 0069 - Expired card                                                                                                                    


Step 8: Verify Webhooks Are Working                                                                                                                         

Check your Meteor server logs when you make a test purchase. You should see webhook events being processed.                                                 


Step 9: Deploy to Production                                                                                                                                

Once testing is complete:                                                                                                                                   

 1 Deploy your Meteor app to Galaxy or your hosting                                                                                                         
 2 Update the webhook endpoint to your production URL                                                                                                       
 3 Update settings.json with production values                                                                                                              
 4 Test with a real $2 purchase                                                                                                                             


Important Notes:                                                                                                                                            

 1 Test Mode: Lemon Squeezy has a test mode toggle. Use it for testing.                                                                                     
 2 Webhook Security: The webhook secret in your settings.json must match what you set in Lemon Squeezy.                                                     
 3 Custom Data: Your code passes user_id and email as custom data. Make sure these are being captured in Lemon Squeezy webhooks.                            
 4 SSL: Production needs HTTPS for webhooks.                                                                                                                


Quick Checklist:                                                                                                                                            

 • [ ] Store ID noted                                                                                                                                       
 • [ ] API Key created and saved                                                                                                                            
 • [ ] Webhook configured with secret                                                                                                                       
 • [ ] settings.json updated                                                                                                                                
 • [ ] Product/Variant ID noted                                                                                                                             
 • [ ] Test purchase works                                                                                                                                  
 • [ ] Webhooks are firing                                                                                                                                  
 • [ ] User subscription status updates in MongoDB                                                                                                          

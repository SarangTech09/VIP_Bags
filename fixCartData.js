const mongoose = require('mongoose');
const userModel = require('./models/user-model');  // Adjust the path based on your project structure
const productModel = require('./models/product-model');  // Adjust the path based on your project structure

mongoose.connect('mongodb://localhost:27017/VIP') 
  .then(() => {
    console.log("Connected to database");

    // Fetch all users with cart entries that might be invalid
    userModel.find({ 'cart': { $elemMatch: { $eq: null } } }).then(async users => {
      for (const user of users) {
        for (let i = 0; i < user.cart.length; i++) {
          // Ensure the cart item is not null
          if (user.cart[i] !== null) {
            const productId = user.cart[i]._id;  // Use the existing _id to find the product
            
            // Find the product using the productId
            const product = await productModel.findById(productId);

            if (product) {
              // Replace the null entry with the valid product
              user.cart[i] = { product: productId, quantity: 1 };
            }
          } else {
            // Handle case where cart item is null
            console.log(`Found null in cart for user ${user.email} at index ${i}`);
          }
        }

        // Save the updated cart
        await user.save();
        console.log(`Updated cart for user: ${user.email}`);
      }
    });
  }).catch(err => {
    console.error('Error connecting to database:', err);
  });

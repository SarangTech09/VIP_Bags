const express = require("express");
 const router = express.Router();
 const isloggedin = require("../middlewares/isLoggedIn");
const productModel = require("../models/product-model");
const userModel = require("../models/user-model");

 router.get("/", function(req, res){
    let error = req.flash("error");
    res.render("index", {error, loggedin:false });
});

router.get("/shop", isloggedin, async function(req, res){
    let products = await productModel.find()
    res.render("shop", {products});
})

//Add to cart or increase quantity if already in cart
router.get("/addtocart/:id", isloggedin, async function(req, res) {
    try {
        // Find the product by ID
        let product = await productModel.findById(req.params.id);
        
        if (!product) {
            console.log("Product not found:", req.params.id); // Log if the product is not found
            return res.status(404).send("Product not found");
        }

        // Find the user by email
        let user = await userModel.findOne({ email: req.user.email });
        
        if (!user) {
            console.log("User not found for email:", req.user.email); // Log if user is not found
            return res.status(404).send("User not found");
        }

        console.log("User found:", user); // Log the user object to check if cart exists
        console.log("User's cart before update:", user.cart); // Log the cart array to see if it exists and is populated

        // Check if the product is already in the user's cart
        const existingProduct = user.cart.find(item => item.product.toString() === req.params.id);

        if (existingProduct) {
            // If the product exists in the cart, increase the quantity
            existingProduct.quantity += 1;
            console.log("Updated quantity for product:", existingProduct); // Log the updated product in the cart
        } else {
            // If the product is not in the cart, add it with quantity 1
            user.cart.push({ product: req.params.id, quantity: 1 });
            console.log("Added new product to cart:", req.params.id); // Log the product being added to the cart
        }

        // Save the updated cart to the user
        await user.save();

        // Redirect the user to the cart page
        res.redirect("/cart");
    } catch (err) {
        console.error("Error adding product to cart:", err);
        res.status(500).send("Internal Server Error");
    }
});






//Remove product from cart
router.get("/removefromcart/:id", isloggedin, async function(req, res){
    let user = await userModel.findOne({ email: req.user.email });
    
    // Remove the product from the user's cart
    user.cart = user.cart.filter(item => item.product.toString() !== req.params.id);

    await user.save();
    
    // Redirect back to the cart page
    res.redirect("/cart");
});

// Increase quantity of product in cart
router.get("/increasequantity/:id", isloggedin, async function(req, res) {
    let user = await userModel.findOne({ email: req.user.email });

    // Find the product in the cart and increase the quantity
    const productInCart = user.cart.find(item => item.product.toString() === req.params.id);
    if (productInCart) {
        productInCart.quantity += 1;
        await user.save();
    }

    res.redirect("/cart");
});

// Decrease quantity of product in cart
router.get("/decreasequantity/:id", isloggedin, async function(req, res) {
    let user = await userModel.findOne({ email: req.user.email });

    // Find the product in the cart and decrease the quantity
    const productInCart = user.cart.find(item => item.product.toString() === req.params.id);
    if (productInCart && productInCart.quantity > 1) {
        productInCart.quantity -= 1;
        await user.save();
    } else if (productInCart && productInCart.quantity === 1) {
        // If quantity is 1, remove the product from the cart
        user.cart = user.cart.filter(item => item.product.toString() !== req.params.id);
        await user.save();
    }

    res.redirect("/cart");
});

// Render the cart page with product details and quantities
router.get("/cart", isloggedin, async function (req, res) {
    try {
        let user = await userModel.findOne({ email: req.user.email }).populate("cart.product");

        if (!user || !user.cart) {
            return res.status(404).send("User or Cart not found");
        }

        let total = 0;
        user.cart.forEach(item => {
            if (item.product) {
                total += (item.product.price - (item.product.discount || 0) + 20) * item.quantity;
            }
        });

        res.render("cart", { user, total });
    } catch (err) {
        console.error("Error fetching cart:", err);
        res.status(500).send("Internal Server Error");
    }
});



router.get("/logout", isloggedin, function(req, res){
    res.render("shop");
})
 
module.exports = router;
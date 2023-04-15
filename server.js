const express = require("express");
const app = express();
const HTTP_PORT = process.env.PORT || 8080;

// use a static resources folder
app.use(express.static('assets'))

// configure express to receive form field data
app.use(express.urlencoded({ extended: true }))

// setup handlebars
const exphbs = require("express-handlebars");
app.engine(".hbs", exphbs.engine({
    extname: ".hbs",
    helpers: {
        json: (context) => { return JSON.stringify(context) }
    }
}));
app.set("view engine", ".hbs");

// setup sessions
const session = require('express-session')
app.use(session({
    secret: "the quick brown fox jumped over the lazy dog 1234567890",  // random string, used for configuring the session
    resave: false,
    saveUninitialized: true
}))
//MOngoose
const mongoose = require('mongoose');
mongoose.connect("mongodb+srv://abhibhi:abhibhi@cluster0.wqc5fzn.mongodb.net/?retryWrites=true&w=majority");
const Schema = mongoose.Schema

const UsersSchema = new Schema({username:String, password:String, isAdmin:{type:Boolean, default:false}})
const ClassesSchema = new Schema({imgName:String, classType: String, lengthInDB:Number})
const PaymentsSchema = new Schema({username:String, classType:String, subTotal:Number, total:Number, dateCreated:Date})
const cartItemSchema = new Schema({username: String, classId: String, className: String});

const users = mongoose.model("users_Collection", UsersSchema)
const classes = mongoose.model("classes_Collection", ClassesSchema)
const payments = mongoose.model("payments_Collection", PaymentsSchema)
const cart = mongoose.model('CartItem', cartItemSchema);



//endpoints:
app.get("/", async(req,res)=>{
    console.log("[DEBUG]: At home/login page")
    console.log(req.session)
    res.render("login", { layout:"my-layout-template"})
})

//Login Endpoint
app.post("/login", async (req,res)=>{
    console.log("[DEBUG]: Login Requested")
    console.log(`Email: ${req.body.email}`)
    console.log(`Password: ${req.body.password}`)
    
    const emailFromUI = req.body.email
    const passwordFromUI = req.body.password
    req.session.userLoggedIn = true

    try {
        if (emailFromUI.length === 0) {
            const errmsg = "Email field is empty!"
            res.render("error", {layout:false, errormsg: errmsg})
            return
        }
        if (passwordFromUI.length === 0){
            const errmsg = "Password field is empty!"
            res.render("error", {layout:false, errormsg: errmsg})
            return
        }
        if (!(emailFromUI.includes("@"))) {
            const errmsg = "Email is invalid...PLease use a valid email"
            res.render("error", {layout:false, errormsg: errmsg})
            return
        }

        const emailFromDB = await users.findOne({username:emailFromUI}).lean()
        if (emailFromDB === null) {
            const errmsg = "You are not an exisiting valid user, please create an account"
            res.render("error", {layout:false, errormsg: errmsg})
            return
        }

        if (emailFromDB.password !== passwordFromUI) {
            const errmsg = "Incorrect Password!"
            res.render("error", {layout:false, errormsg: errmsg})
            return
        }

        if (emailFromDB.username === emailFromUI) {
            res.render("class", {layout:"my-layout-template"})
            return
        }

    } catch (err) {
        console.log(err)
    }
})


 
//create account endpoint
app.post("/createAccount", async (req, res) => {   
    console.log("[DEBUG]: Request received at /createAccount endpoint")
    console.log(`Email: ${req.body.email}`)
    console.log(`Password: ${req.body.password}`)

    const emailFromUI = req.body.email

    const passwordFromUI = req.body.password


    try {
        if (emailFromUI.length === 0) {
            const errmsg = "Email field is empty!"
            res.render("error", {layout:false, errormsg: errmsg})
            return
        }
        if (passwordFromUI.length === 0){
            const errmsg = "Password field is empty!"
            res.render("error", {layout:false, errormsg: errmsg})
            return
        }
        if (!(emailFromUI.includes("@"))) {
            const errmsg = "Invalid email used"
            res.render("error", {layout:false, errormsg: errmsg})
            return
        }

        if (passwordFromUI.length<8) {
            const errmsg = "Password doesn't match criteria (Min 8 characters long)"
            res.render("error", {layout:false, errormsg: errmsg})
            return
        }

        const emailFromDB = await users.findOne({username:emailFromUI}).lean()
        if (emailFromDB !== null) {
            const errmsg = "You are already an existing user, please login"
            res.render("error", {layout:false, errormsg: errmsg})
            return

        }
        const userToInsert = await users({username:emailFromUI, password:passwordFromUI})
        userToInsert.save()
        res.render("class", {layout:"my-layout-template"})
        return
    } catch(err) {
        console.log(err)

}
})

//logout endpoint
app.post("/logout", (req, res) => {
    console.log(`[DEBUG] LOGOUT requested...`)
    req.session.destroy()
 
 
    console.log(`Session destroyed...`)
    console.log(req.session)
   
    res.send("You are logged out")
 })

app.post("/goBack", (req,res)=>{
    console.log(`[DEBUG] GET request received at /goBack endpoint`)
    res.render("login", {layout:false})
    return
})

app.get("/classes", async(req,res)=>{
    console.log("[DEBUG]: At classes page")
    const displayClasses = await classes.findOne()
    res.render("class", {layout:"my-layout-template", class:displayClasses})

})

app.post("/book", async(req,res)=>{
    console.log(`[DEBUG] GET request received at /book endpoint`)
    console.log(req.session)

    try{
    // 1. check if they are logged in
    if (req.session.userLoggedIn === undefined) {
        // 3. if no, then show them an error message
        const errmsg = "You must be logged in to perform this action"
        res.render("error", {layout:false, errormsg: errmsg})
        return
    }
    if (req.session.userLoggedIn === true)  {
            // 2. if yes, show them the output
    const bookedByUsername = req.session.userLoggedIn
    const bookedClassFromUI = req.body.bookAClass
    const bookedClass = await classes.find().lean()
    console.log(bookedClass)
   //const classLength = bookedClass.lengthInDB //******/
    const priceBeforeTax = 0.65 * parseFloat(classLength) 
    const total = priceBeforeTax * 0.13
    const dateCreated = Date()

    const paymentToInsert = await payments({username:bookedByUsername, classType:bookedClassFromUI, subTotal:priceBeforeTax, total:total, dateCreated:dateCreated})
    paymentToInsert.save()
    console.log("Inserted")
    }
    }catch(err){
    console.log(err)
    }

})
 
 

// start server
const onHttpStart = () => {
    console.log("Express http server listening on: " + HTTP_PORT);
    console.log(`http://localhost:${HTTP_PORT}`);
}
app.listen(HTTP_PORT, onHttpStart);
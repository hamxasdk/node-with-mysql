const jwt = require('jsonwebtoken')
require("dotenv").config();

function authenticateToken(req,res,next){
const token = req.header('Authorization')?.split(' ')[1]
if(!token){
    return res.status(401).end()
}
jwt.verify(token,process.env.SECRET_KEY,(err,user)=>{
    if(err){
        return res.status(401).json({error:"Unauthenticated" })
    }
    req.user = user
    next()
})
}

module.exports = authenticateToken
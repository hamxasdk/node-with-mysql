const jwt = require('jsonwebtoken')
require("dotenv").config();

function intercepter(req,res,next){
const token = req.header('Authorization')?.split(' ')[1]
if(token){
    jwt.verify(token, process.env.SECRET_KEY,(err,user)=>{
        if(err){
            return res.status(401).json({error:"Unauthenticated" })
        }
        req.user = user
        next()
    })
    return res.status(401).end()
}else{
    next()
}

}

module.exports = intercepter
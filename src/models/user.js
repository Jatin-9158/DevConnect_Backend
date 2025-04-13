const mongoose = require('mongoose');
const validator = require('validator')

const bcrypt = require("bcrypt");
const jwt  = require('jsonwebtoken');
const getDefaultPhotoURL = function (){
    if(this.gender === "male")
        return "https://cdn-icons-png.flaticon.com/256/432/432693.png"
    else if(this.gender==="female")
        return "https://png.pngtree.com/png-clipart/20230408/original/pngtree-female-admin-and-assistant-job-vacancies-png-image_9037120.png"
    else
     return "https://static.vecteezy.com/system/resources/previews/026/434/417/non_2x/default-avatar-profile-icon-of-social-media-user-photo-vector.jpg"    
}
const userSchema = new mongoose.Schema({

  firstName: { 
    type: String, 
    required: [true, "First name is required"],
    maxLength:50,
    trim:true,
  },
  lastName: { 
    type: String, 
    trim:true,
  },
  emailId: { 
    type: String, 
    lowercase:true,
    required:true,
    unique:true,
    trim:true,
    validate:{
      validator: function (value){
        return validator.isEmail(value)
      },
      message:"Invalid Email Format"
    }
  },
  password: { 
    type: String, 
    required:true,
    validate:{
      validator: function (value){
        return validator.isStrongPassword(value)
      },
      message:"Password should contain length of 8 characters with uppercase , lowercase , symbols"
    }
  },
  age: { 
    type: Number, 
    required:true,
    min:[18,"Please enter the least age at 18"],
    max:[125,"Please enter the Possible age"]
    },
  gender: { 
    type:String,
    required:true,
    enum:{
           values:["Male","Female","Others","Prefer not to answer"],
           message:"{VALUE} is not a valid gender option",
         }
  },
  photoURL:{
    type: String,
    default:getDefaultPhotoURL(),
    validate:{
      validator: function (value){
         return validator.isURL(value)
      },
      message:"Photo URL is not valid URL"
    }
  },
  about:{
    type:String,
    default:"Development is not everyone's cup of tea",
    // minLength:[100,"Min Length Should be 100 words"],
    maxLength:[250,"Max Length Should be 250 words"],
  },
  skills:{
    type:[String],
    set: function(skills){
       return [...new Set(skills.map((skill)=>skill.toLowerCase()))]
    },
    validate:[ 
    // {
    //   validator: function(skills){
    //      return skills.length > 0;
    //   },
    //   message:"At least one skill is required",
    // },
    {
      validator: function(skills){
        return skills.length === [ ...new Set(skills)].length;
     },
     message:"Duplicate Skills are not allowed",      
    },

   ]
  }
},
 {
  timestamps:true,
 }
);
userSchema.index({firstName:1,lastName:1})
userSchema.methods.getJWT = async function () {
   
  const user = this
  const token = await jwt.sign({_id:user._id},process.env.SECRET_KEY,{expiresIn:"7d",})
  return token;
}
userSchema.methods.validatePassword = async function(passwordInputByUser){
  const user = this;
  const isPasswordValid=await bcrypt.compare(passwordInputByUser,user.password)
  return isPasswordValid;

}
module.exports = mongoose.model('User', userSchema);

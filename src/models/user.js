const mongoose = require('mongoose')
const validator = require('validator')

const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const Task = require('./task')

const userSchema = new mongoose.Schema({

    name:{
        type:String,
        required:true,
        trim:true
    },
    email: {   
        type:String,
        unique:true,    
        required:true,
        trim:true,
        lowercase:true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error('Email is invalid.')
            }
        }
    },
    age:{
        type:Number,
        required:true,
        default:true,
        validate(value){
            if(value < 0){
                throw new Error('Age must be positive, please enter again.')
            }
        }
    },

    password:{
        type:String,
        required:true,
        trim:true,
        minlength: 7,
        validate(value){
            if(value.toLowerCase().includes('password'))
                throw new Error('Password cannot contain the phrase password!')
        }
    },

    tokens:[{

        token:{
            type:String,
            required:true,
        }

    }],
    avatar:{
        type:Buffer
    }
 
}, {

    timestamps:true

})

userSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'user'
})

userSchema.statics.findByCredentials = async (email, password) =>{

    const user = await User.findOne({email})

    if(!user){
        console.log('error here')
        throw new Error('User does not exist!')
    }

    const isMatch = await bcrypt.compare(password, user.password)

    if(!isMatch){
        console.log('error here')
        throw new Error('Password is incorrect.')
    }
    console.log(isMatch)
    return user
    
}

userSchema.methods.generateAuthToken = async function () {

    const user = this
    const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SECRET)

    user.tokens = user.tokens.concat({ token })
    await user.save()

    return token

}

userSchema.methods.toJSON = function () {

    const user = this
    const userObject = user.toObject()

    delete userObject.password
    delete userObject.tokens
    delete userObject.avatar

    return userObject

}


//Hash password
userSchema.pre('save', async function(next) {

    const user = this

    if(user.isModified('password')){
        user.password = await bcrypt.hash(user.password, 8)
    }

    next()

})

userSchema.pre('remove', async function (next) {
    const user = this
    await Task.deleteMany({ user: user._id })


    next()
})

const User = mongoose.model('User', userSchema)


module.exports = User

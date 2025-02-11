import {asyncHandler} from "../utils/asyncHandaler.js"
import { ApiError } from "../utils/Apierror.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js"

const registerUser = asyncHandler(async (req,res)=>{
    //get user detail from frontend
    //validation - not empty
    //check if user already exists: username, email
    //check for images,check for avatar
    //upload them cloudinary
    //extract response url
    //create user object - create entry in db
    //remove password and refresh token feed
    //check if repsonse aaya ya nai
    //check for user creation
    //return res

    const {fullname,email, username, password} = req.body
    console.log("email",email);
    
    if(
        [fullname,email,username,password].some((feild)=>feild?.trim() === "")
    ){
        throw new ApiError(400,"All Feilds are required")
    }
    
    const existedUser = await User.findOne({
        $or: [{ username },{ email }]
    })

    if(existedUser){
        throw new ApiError(409,"User with email or username exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const cover = await uploadOnCloudinary(coverImageLocalPath);
    

    if(!avatar || !cover){
        throw new ApiError(400,"Avatar and cover file is required");
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: cover.url || "",
        email,
        password,
        username : username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Somthing went wrong while registring a user")
    }

    return res.status(201).json(
        new ApiResponse(200,createdUser,"register succesfully")
    )
    console.log(req.files);
    

})

export {registerUser}
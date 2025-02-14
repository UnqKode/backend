import { asyncHandler } from "../utils/asyncHandaler.js"
import { ApiError } from "../utils/Apierror.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

const generateAccessAndRefreshToken = async (userID) => {
    try {

        const user = await User.findById(userID)
        const accessToken = user.genrateAccessToken()
        const refreshToken = user.genrateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and acces token")
    }
}

const registerUser = asyncHandler(async (req, res) => {
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

    const { fullname, email, username, password } = req.body
    console.log("email", email);

    if (
        [fullname, email, username, password].some((feild) => feild?.trim() === "")
    ) {
        throw new ApiError(400, "All Feilds are required")
    }

    const existedUser = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (existedUser) {
        throw new ApiError(409, "User with email or username exists")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const cover = await uploadOnCloudinary(coverImageLocalPath);


    if (!avatar || !cover) {
        throw new ApiError(400, "Avatar and cover file is required");
    }

    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: cover.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Somthing went wrong while registring a user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "register succesfully")
    )
    console.log(req.files);


})

const loginUser = asyncHandler(async (req, res) => {
    //req body -> data
    //get username and password
    //validate information{check user and password}
    //genrate refresh and acces token
    //send cookies

    const { email, username, password } = req.body

    if (!username && !email) {
        throw new ApiError(400, "Username or email id required")
    }

    const user =await User.findOne({
        $or: [{ username }, { email }]
    })

    console.log(`hi i am user ${user}`);
    

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid User Credential")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User Logged in Successfully"
            )
        )
})

const logOutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly : true,
        secure : true
    }

    return res.status(200)
        .clearCookie("accessToken",options)
        .clearCookie("refreshToken", options)
        .json(
            new ApiResponse(200,
                {
                },
                "User Logged Out Successfully"
            )
        )
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incommingRefreshToken = req.cookie.refreshToken || req.body.refreshToken
    
    if(!incommingRefreshToken){
        throw new ApiError(404,"No Refresh Token Found")
    }

    try {
        const decodedToken = jwt.verify(incommingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401, "Invalid Refresh Token")
        }
    
        if(incommingRefreshToken !== user.refreshToken){
            throw new ApiError(401,"Refresh Token is Expired or used")
        }
    
        const options = {
            httpOnly : true,
            secure : true
        }
    
        const {accessToken,newrefreshToken} = await generateAccessAndRefreshToken(user._id)
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newrefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken,newrefreshToken},
                "AccessToken re"
            )
        )
    } catch (error) {
        throw new ApiError(401,"Invalid Refresh Token")
    }
})

export { registerUser, loginUser, logOutUser ,refreshAccessToken}
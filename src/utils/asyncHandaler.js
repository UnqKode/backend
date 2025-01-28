const asyncHandler = (requestHandler) => {
    (req,res,next)=>{
        Promise.resolve(requestHandler()).catch((err) => next(err))
    }
}

export {asyncHandler}



// const asyncHandler = (fn) => async (req,res,next) => {
//     try {
//         await fn()
        
//     } catch (error) {
//         res.status(error.code).json({
//             success: false,
//             message: error.message
//         })
//     }
// }
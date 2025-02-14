import mongoose from "mongoose"
import {Schema} from "mongoose"

const subscriptionScehma = new Schema({
    subscriber:{
        type: Schema.Types.ObjectId,
        ref: "User"
    },
    channel:{
        type:Schema.Types.ObjectId,
        ref: "USer"
    }
},{timestamps: true})


export const Subscription = mongoose.model("Subscription",subscriptionScehma)
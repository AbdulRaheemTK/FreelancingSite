const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true
    },
    password:{
        type: String,
        required:true
    },
    verified:{
        type:Boolean,
        default:false
    },
    firstlogin:{
        type:Boolean,
        default:true
    },
    personalInformation : {
        name:{
            type:String
        },
        abilitiesAndExperiences:{
            type:String
        },
        personelImageLink:{
            type: String
        },
        city:{
            type:String
        },
        country:{
            type:String
        },
        gitHubLink:{
            type:String
        },
        stackOverFlowLink:{
            type:String
        },
        twitterLink:{
            type:String
        },
        linkedInLink:{
            type:String
        },
        personalWebsiteLink:{
            type:String
        }
    },
    aboutMe:{
        type:String
    },
    skills:[{
        name:{
            type:String
        },
        description:{
            type:String
        }
    }],
    projects:[{
        name:{
            type:String
        },
        ToolsAndStacks:{
            type:String
        },
        projectImageLink:{
            type:String
        },
        projectSourceCodeLink:{
            type:String
        },
        aboutTheProject:{
            type:String
        },
        comments:[{
            commentText:{
                type:String
            },
            fromUserId:{
                type: Schema.Types.ObjectId
            },
            fromUserName:{
                type:String
            },
            fromUserImageLink:{
                type:String
            }
        }]
    }],
    messages:[{
        title:{
            type:String
        },
        date:{
            type:String,
        },
        messageText:{
            type:String
        },
        fromUserId:{
            type: Schema.Types.ObjectId
        },
        fromUserName:{
            type:String
        },
        messageRead:{
            type:Boolean,
            default: false
        }
    }]
})

module.exports = mongoose.model('User',userSchema);
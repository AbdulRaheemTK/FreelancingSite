const {query} = require("express");
const path = require("path");
const rootDir = require("../util/path");
const User = require("../models/user");
const mongoose = require("mongoose");
const fs = require("fs");

const {validationResult} = require('express-validator');
const ItemsPerPage = 3;

// / ->get
exports.getIndex = (req, res, next) => {
    const name = req.query.name;
    const page = +req.query.page || 1;
    let totalUsers;
    User.find()
        .countDocuments()
        .then(numUsers => {
            totalUsers = numUsers;
            return User.find().skip((page - 1) * ItemsPerPage).limit(ItemsPerPage);
        })
        .then(users => {
            if (!name && users) {
                res.render('index', {
                    token: req.session.token,
                    authenticationNotRequired: true,
                    users: users,
                    name: name,
                    path: "",
                    currentPage: page,
                    hasNextPage: ItemsPerPage * page < totalUsers,
                    hasPreviousPage: page > 1,
                    nextPage: page + 1,
                    previousPage: page - 1,
                    lastPage: Math.ceil(totalUsers / ItemsPerPage)
                });
            } else {
                User.find({"personalInformation.name": {$regex: new RegExp(`${name}`, "i")}})
                    .then(users => {
                        if (users) {
                            res.render('index', {
                                token: req.session.token,
                                authenticationNotRequired: true,
                                users: users,
                                name: name
                            });
                        }
                    })
                    .catch(err => {
                        console.log(err);
                    })
            }
        })


};

// /developers ->get
exports.getProjects = (req, res, next) => {
    const name = req.query.name;
    const page = +req.query.page || 1;
    let totalProjects = 0;
    if (!name) {
        User.find({}, {"projects": 1})
            .then(users => {
                users.forEach(user => {
                    user.projects.forEach(project => {
                        if (project.name && project.projectImageLink && project.aboutTheProject) {
                            totalProjects++;
                        }
                    })

                })
                return User.aggregate([{
                    $unwind: "$projects"
                }]).skip((page - 1) * ItemsPerPage).limit(ItemsPerPage)
            })
            .then(users => {
                if (users) {
                    res.render('projects', {
                        token: req.session.token,
                        authenticationNotRequired: true,
                        users: users,
                        name: name,
                        currentPage: page,
                        path: "projects",
                        hasNextPage: ItemsPerPage * page < totalProjects,
                        hasPreviousPage: page > 1,
                        nextPage: page + 1,
                        previousPage: page - 1,
                        lastPage: Math.ceil(totalProjects / ItemsPerPage)
                    });
                }
            })
            .catch(err => {
                console.log(err);
            })
    } else {
        console.log(name)
        User.find({"projects.name": {$regex: new RegExp(`${name}`, "i")}}, {
            "projects.$": 1,
            "personalInformation": 1
        })
            .then(users => {
                console.log(users);
                res.render('projects', {
                    token: req.session.token,
                    authenticationNotRequired: true,
                    users: users,
                    name: name
                });
            })
            .catch(err => {
                console.log(err);
            })
    }
};

// /account ->get
exports.getAccount = (req, res, next) => {
    const userId = req.session.userId;
    User.findOne({_id: userId})
        .then(user => {
            res.render("account", {
                token: req.session.token,
                authenticationNotRequired: false,
                user: user
            });
        })
        .catch(err => {
            console.log(err);
        })
};

// /addPersonalInformationForm ->get
exports.addPersonalInformationForm = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    const userId = req.session.userId;
    User.findOne({_id: userId})
        .then(user => {
            if (user) {
                res.render('addPersonalInformationForm', {
                    token: req.session.token,
                    authenticationNotRequired: true,
                    errorMessage: message,
                    oldInput:
                        {
                            EPIName: user.personalInformation.name,
                            EPIAbilitiesAndExperiences: user.personalInformation.abilitiesAndExperiences,
                            EPICity: user.personalInformation.city,
                            EPICountry: user.personalInformation.country,
                            EPIGitHubLink: user.personalInformation.gitHubLink,
                            EPIStackoverflowLink: user.personalInformation.stackOverFlowLink,
                            EPITwitterLink: user.personalInformation.twitterLink,
                            EPILinkedInLink: user.personalInformation.linkedInLink,
                            EPIPersonalWebsiteLink: user.personalInformation.personalWebsiteLink
                        },
                    validationErrors: []
                })
            } else {
                res.render('addPersonalInformationForm', {
                    token: req.session.token,
                    authenticationNotRequired: true,
                    errorMessage: message,
                    oldInput:
                        {
                            EPIName: '',
                            EPIAbilitiesAndExperiences: '',
                            EPICity: '',
                            EPICountry: '',
                            EPIGitHubLink: '',
                            EPIStackoverflowLink: '',
                            EPITwitterLink: '',
                            EPILinkedInLink: '',
                            EPIPersonalWebsiteLink: ''
                        },
                    validationErrors: []
                })
            }
        })
        .catch(err => {
            console.log(err);
        })

};

// /addAboutMeForm ->get
exports.addAboutMeForm = (req, res, next) => {
    let message = req.flash('error');
    if (message.length > 0) {
        message = message[0];
    } else {
        message = null;
    }
    const userId = req.session.userId;
    User.findOne({_id: userId})
        .then(user => {
            if (user) {
                res.render('addAboutMeForm', {
                    token: req.session.token,
                    authenticationNotRequired: true,
                    errorMessage: message,
                    oldInput:
                        {
                            EPIAboutMe: user.aboutMe
                        },
                    validationErrors: []
                })
            } else {
                res.render('addAboutMeForm', {
                    token: req.session.token,
                    authenticationNotRequired: true,
                    errorMessage: message,
                    oldInput:
                        {
                            EPIAboutMe: ''
                        },
                    validationErrors: []
                })
            }
        })
        .catch(err => {
            console.log(err);
        })

}

// /account ->post
exports.postAccountPersonalInformation = (req, res, next) => {
    const userId = req.session.userId;
    const EPIName = req.body.EPIName;
    const EPIAbilitiesAndExperiences = req.body.EPIAbilitiesAndExperiences;
    const imageFile = req.file;
    const EPICity = req.body.EPICity;
    const EPICountry = req.body.EPICountry;
    const EPIGitHubLink = req.body.EPIGitHubLink;
    const EPIStackoverflowLink = req.body.EPIStackoverflowLink;
    const EPITwitterLink = req.body.EPITwitterLink;
    const EPILinkedInLink = req.body.EPILinkedInLink;
    const EPIPersonalWebsiteLink = req.body.EPIPersonalWebsiteLink;
    const formName = req.body.formName;
    const errors = validationResult(req);

    if (!errors.isEmpty() && (formName == "addPersonalInformationForm")) {
        const errorMessage = errors.array()[0].msg
        const error = new Error(errorMessage, {
            cause: {
                render: "addPersonalInformationForm",
                oldInput:
                    {
                        EPIName: EPIName,
                        EPIAbilitiesAndExperiences: EPIAbilitiesAndExperiences,
                        EPICity: EPICity,
                        EPICountry: EPICountry,
                        EPIGitHubLink: EPIGitHubLink,
                        EPIStackoverflowLink: EPIStackoverflowLink,
                        EPITwitterLink: EPITwitterLink,
                        EPILinkedInLink: EPILinkedInLink,
                        EPIPersonalWebsiteLink: EPIPersonalWebsiteLink
                    },
                validationErrors: errors.array(),
                token: req.session.token,
                authenticationNotRequired: true,
            }
        });
        errors.statusCode = 422;
        throw error;
    }

    User.findByIdAndUpdate({_id: userId})
        .then(user => {
            if (user) {
                user.personalInformation.name = EPIName.toUpperCase();
                user.personalInformation.abilitiesAndExperiences = EPIAbilitiesAndExperiences;
                if (imageFile) {
                    if (user.personalInformation.personelImageLink) {
                        fs.unlinkSync(path.join(rootDir, 'public', user.personalInformation.personelImageLink));
                    }
                    user.personalInformation.personelImageLink = req.file.path.slice(6);
                }
                user.personalInformation.city = EPICity;
                user.personalInformation.country = EPICountry;
                user.personalInformation.gitHubLink = EPIGitHubLink;
                user.personalInformation.stackOverFlowLink = EPIStackoverflowLink;
                user.personalInformation.twitterLink = EPITwitterLink;
                user.personalInformation.linkedInLink = EPILinkedInLink;
                user.personalInformation.personalWebsiteLink = EPIPersonalWebsiteLink;
                return user.save()
            }
        })
        .then(user => {
            if (user && (user.firstlogin == true || !user.aboutMe)) {
                res.redirect('/addAboutMeForm')
            } else if (user) {
                res.redirect('/account')
            }
        })
        .catch(err => {
            console.log(err);
        })

};

// /postAccountAboutMe ->post
exports.postAccountAboutMe = (req, res, next) => {
    const userId = req.session.userId;
    const EPIAboutMe = req.body.EPIAboutMe;
    const formName = req.body.formName;
    const errors = validationResult(req);

    if (!errors.isEmpty() && (formName == "addAboutMeForm")) {
        const errorMessage = errors.array()[0].msg
        const error = new Error(errorMessage, {
            cause: {
                render: "addAboutMeForm",
                oldInput:
                    {
                        EPIAboutMe: EPIAboutMe
                    },
                validationErrors: errors.array(),
                token: req.session.token,
                authenticationNotRequired: true,
            }
        });
        errors.statusCode = 422;
        throw error;
    }

    User.findByIdAndUpdate({_id: userId})
        .then(user => {
            if (user) {
                user.aboutMe = EPIAboutMe;
                if (!user.personalInformation.name ||
                    !user.personalInformation.abilitiesAndExperiences ||
                    !user.personalInformation.personelImageLink ||
                    !user.personalInformation.city ||
                    !user.personalInformation.country ||
                    !user.aboutMe) {
                    user.firstLogin = true;
                } else {
                    user.firstLogin = false;
                }
                return user.save()
            }

        })
        .then(usersaved => {
            if (usersaved) {
                res.redirect('/account');
            }
        })
        .catch(err => {
            console.log(err);
        })
};

// /postAccountAddSkill ->post
exports.postAccountAddSkill = (req, res, next) => {
    const userId = req.session.userId;
    const skillName = req.body.skillName;
    const skillDescription = req.body.skillDescription;

    User.findByIdAndUpdate({_id: userId})
        .then(user => {
            if (user) {
                user.skills.push({name: skillName.toUpperCase(), description: skillDescription})
                return user.save();
            }
        })
        .then(user => {
            if (user) {
                res.redirect('/account')
            }

        })
        .catch(err => {
            console.log(err);
        })
};

// /postAccountEditSkill/skillId ->post
exports.postAccountEditSkill = (req, res, next) => {
    const userId = req.session.userId;
    const skillId = req.params.skillId;
    const skillName = req.body.skillName;
    const skillDescription = req.body.skillDescription;
    User.updateOne(
        {_id: userId, "skills._id": skillId},
        {$set: {"skills.$.name": skillName.toUpperCase(), "skills.$.description": skillDescription}}
    )
        .then(skillupdated => {
            if (skillupdated) {
                res.redirect('/account');
            }
        })
        .catch(err => {
            console.log(err);
        })
};

// /postAccountDeleteSkill/skillId ->post
exports.postAccountDeleteSkill = (req, res, next) => {
    const userId = req.session.userId;
    const skillId = req.params.skillId;
    User.updateOne(
        {_id: userId},
        {$pull: {skills: {_id: skillId}}}
    )
        .then(skillDeleted => {
            if (skillDeleted) {
                res.redirect('/account');
            }
        })
        .catch(err => {
            console.log(err);
        })
};


// /postAccountAddProject ->post
exports.postAccountAddProject = (req, res, next) => {
    const userId = req.session.userId;
    const imageFile = req.file;
    const projectName = req.body.projectName;
    const projectToolsAndStacks = req.body.projectToolsAndStacks;
    const projectSourceCodeLink = req.body.projectSourceCodeLink;
    const projectAbout = req.body.projectAbout;
    let projectImageLink;
    if (imageFile) {
        projectImageLink = req.file.path.slice(6);
    }

    User.findByIdAndUpdate({_id: userId})
        .then(user => {
            if (user) {
                user.projects.push(
                    {
                        name: projectName.toUpperCase(),
                        ToolsAndStacks: projectToolsAndStacks.toUpperCase(),
                        projectImageLink: projectImageLink,
                        projectSourceCodeLink: projectSourceCodeLink,
                        aboutTheProject: projectAbout
                    })
                return user.save()
            }
        })
        .then(user => {
            if (user) {
                res.redirect('/account')
            }
        })
        .catch(err => {
            console.log(err);
        })
};

// /postAccountEditProject/projectId ->post
exports.postAccountEditProject = (req, res, next) => {
    const userId = req.session.userId;
    const projectId = req.params.projectId;
    const imageFile = req.file;
    const projectName = req.body.projectName;
    const projectToolsAndStacks = req.body.projectToolsAndStacks;
    const projectSourceCodeLink = req.body.projectSourceCodeLink;
    const projectAbout = req.body.projectAbout;

    // const projectToolsAndStackstags = JSON.parse(projectToolsAndStacks);// PARSE projectToolsAndStacks TAGS COMING IN FROM THE FRONT END
    // const projectToolsAndStackstagsString = (projectToolsAndStackstags.map(({value}) => value)).toString() //converting projectToolsAndStacks tags into string to store in DB.

    if (imageFile) {
        User.findOne({_id: userId, "projects._id": projectId}, {"projects.$": 1})
            .then(project => {
                if (project) {
                    if (project.projects[0].projectImageLink) {
                        fs.unlinkSync(path.join(rootDir, 'public', project.projects[0].projectImageLink));
                    }
                }
            })
            .catch(err => {
                console.log(err);
            })

        User.updateOne(
            {_id: userId, "projects._id": projectId},
            {
                $set:
                    {
                        "projects.$.name": projectName.toUpperCase(),
                        "projects.$.ToolsAndStacks": projectToolsAndStacks.toUpperCase(),
                        "projects.$.projectImageLink": req.file.path.slice(6),
                        "projects.$.projectSourceCodeLink": projectSourceCodeLink,
                        "projects.$.aboutTheProject": projectAbout,
                    }
            }
        )
            .then(skillupdated => {
                if (skillupdated) {
                    res.redirect('/account');
                }
            })
            .catch(err => {
                console.log(err);
            })
    } else {
        User.updateOne(
            {_id: userId, "projects._id": projectId},
            {
                $set:
                    {
                        "projects.$.name": projectName.toUpperCase(),
                        "projects.$.ToolsAndStacks": projectToolsAndStacks.toUpperCase(),
                        "projects.$.projectSourceCodeLink": projectSourceCodeLink,
                        "projects.$.aboutTheProject": projectAbout,
                    }
            }
        )
            .then(skillupdated => {
                if (skillupdated) {
                    res.redirect('/account');
                }
            })
            .catch(err => {
                console.log(err);
            })
    }

};

// /postAccountDeleteProject/projectId ->post
exports.postAccountDeleteProject = (req, res, next) => {
    const userId = req.session.userId;
    const projectId = req.params.projectId;
    User.updateOne(
        {_id: userId},
        {$pull: {projects: {_id: projectId}}}
    )
        .then(skillDeleted => {
            if (skillDeleted) {
                res.redirect('/account');
            }
        })
        .catch(err => {
            console.log(err);
        })
};

// /postCommentToProject/projectId ->post
exports.postCommentToProject = (req, res, next) => {
    const fromUserId = req.session.userId;
    const projectId = req.params.projectId;
    const commentText = req.body.commentText;
    User.findOne({_id: fromUserId}, {"personalInformation.name": 1, "personalInformation.personelImageLink": 1})
        .then(user => {
            if (user) {
                User.updateOne(
                    {"projects._id": projectId},
                    {
                        $push:
                            {
                                "projects.$.comments":
                                    {
                                        commentText: commentText,
                                        fromUserId: fromUserId,
                                        fromUserName: user.personalInformation.name,
                                        fromUserImageLink: user.personalInformation.personelImageLink

                                    }
                            }
                    }
                )
                    .then(commentAdded => {
                        if (commentAdded) {
                            res.redirect('/single-project/' + projectId);
                        }
                    })
                    .catch(err => {
                        console.log(err);
                    })
            }
        })
        .catch(err => {
            console.log(err);
        })


};

// /delete ->get
exports.getDelete = (req, res, next) => {
    res.render("delete", {
        token: req.session.token,
        authenticationNotRequired: false
    });
};

// /profile ->get
exports.getProfile = (req, res, next) => {
    const sessionUserId = req.session.userId;
    const userId = req.params.userId;
    User.findOne({_id: userId})
        .then(user => {
            if (user) {
                res.render("profile", {
                    token: req.session.token,
                    authenticationNotRequired: true,
                    user: user,
                    sessionUserId: sessionUserId
                });
            }

        })
};

// /messageForm/toUserId ->get
exports.getMessageForm = (req, res, next) => {
    const toUserId = req.params.toUserId;
    const fromUserId = req.session.userId;
    User.findOne({_id: toUserId}, {"personalInformation.name": 1})
        .then(toUser => {
            if (toUser) {
                res.render("messageForm", {
                    toUser: toUser,
                    token: req.session.token,
                    authenticationNotRequired: false
                })
            }
        })
        .catch(err => {
            console.log(err);
        })

};

// /postMessageForm/toUserId ->get
exports.postMessageForm = (req, res, next) => {
    const toUserId = req.params.toUserId;
    const fromUserId = req.session.userId;
    const messageTitle = req.body.messagetitle;
    const messageText = req.body.messageText;

    User.findById({_id: fromUserId}, {"personalInformation.name": 1})
        .then(fromUser => {
            console.log(fromUser);
            if (fromUser) {
                User.findByIdAndUpdate({_id: toUserId})
                    .then(user => {
                        user.messages.push(
                            {
                                title: messageTitle,
                                messageText: messageText,
                                fromUserId: fromUserId,
                                fromUserName: fromUser.personalInformation.name,
                                date: new Date().toLocaleString('en-GB')
                            })
                        return user.save()
                    })
                    .then(user => {
                        if (user) {
                            res.redirect('/profile/' + toUserId)
                        }
                    })
                    .catch(err => {
                        console.log(err);
                    })
            }
        })


};

// /indox ->get
exports.getInbox = (req, res, next) => {
    const userId = req.session.userId;
    User.findOne({_id: userId})
        .then(user => {
            if (user) {
                res.render("inbox", {
                    token: req.session.token,
                    authenticationNotRequired: false,
                    user: user
                });
            }

        })
};

// /message ->get
exports.getInboxMessage = (req, res, next) => {
    const messageId = req.params.messageId;
    const userId = req.session.userId;
    User.findOne({messages: {$elemMatch: {_id: messageId}}}, {"messages.$": 1})
        .then(message => {
            User.updateOne(
                {_id: userId, "messages._id": messageId},
                {
                    $set:
                        {
                            "messages.$.messageRead": true
                        }
                }
            )
                .then(messageReadUpdated => {
                    if (messageReadUpdated) {
                        res.render("inboxMessage", {
                            token: req.session.token,
                            authenticationNotRequired: false,
                            message: message.messages[0]
                        });
                    }
                })
                .catch(err => {
                    console.log(err);
                })
        })
        .catch(err => {
            console.log(err);
        })

};

// /message ->get
exports.getMessage = (req, res, next) => {
    const inboxPageStatus = req.query.inboxPage;
    res.render("message", {
        inboxPage: inboxPageStatus,
        signupPage: false,
        token: req.session.token,
        authenticationNotRequired: false
    });
};

// /single-project/projectId ->get
exports.getSingleProject = (req, res, next) => {
    const projectId = req.params.projectId;
    const userId = req.session.userId;
    User.findOne({"projects._id": projectId})
        .then(user => {
            let loadedUser = user;
            if (user) {
                User.findOne({projects: {$elemMatch: {_id: projectId}}}, {"projects.$": 1})
                    .then(project => {
                        if (project) {
                            res.render("single-project", {
                                token: req.session.token,
                                authenticationNotRequired: true,
                                user: loadedUser,
                                project: project.projects[0],
                                authUser: userId
                            });
                        }
                    })
                    .catch(err => {
                        console.log(err)
                    })
            }
        })
        .catch(err => {
            console.log(err);
        })

};

//Account Page Buttons
// /account/edit/aboutme
exports.postAccountAboutMeEdit = (req, res, next) => {
    res.render("modal-form", {
        AccountAboutMe: true,
        token: req.session.token,
        authenticationNotRequired: false
    });
};




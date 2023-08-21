const express = require("express");
const router = express.Router();
const siteController = require("../controllers/site");
const isAuth = require('../util/is-auth')
const { body } = require('express-validator');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const fileStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './public/images');
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname + '-' + uuidv4())
    }
});
const fileFilter = (req, file, cb) => {
    if (
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/jpg' ||
      file.mimetype === 'image/jpeg'
    ) {
      cb(null, true);
    } else {
      cb(null, false);
    }
};
const upload = multer({storage: fileStorage, fileFilter: fileFilter});
// / ->get
router.get('/',siteController.getIndex);

// /projects ->get
router.get('/projects',siteController.getProjects);

// /account ->get
router.get('/account',isAuth,siteController.getAccount);

// /addPersonalInformationForm ->get
router.get('/addPersonalInformationForm',isAuth, siteController.addPersonalInformationForm);

// /addAboutMeForm ->get
router.get('/addAboutMeForm',isAuth,siteController.addAboutMeForm);

// /postAccountPersonalInformation ->post
router.post('/postAccountPersonalInformation',isAuth,upload.single('EPIImage'),
[
  body('EPIName', 'User Name must not be empty with alphabets allowed only!').isAlpha(['en-US'], { 'ignore': ' ' }).trim().notEmpty(),
  body('EPIAbilitiesAndExperiences', 'Abilities and Experiences must not be empty with alphabets allowed only!').isAscii().trim().notEmpty(),
  body('EPICity','City Name must not be empty with alphabets allowed only!').isAlpha(['en-US'], { 'ignore': ' ' }).trim().notEmpty(),
  body('EPICountry','Country Name must not be empty with alphabets allowed only!').isAlpha(['en-US'], { 'ignore': ' ' }).trim().notEmpty()
],siteController.postAccountPersonalInformation);

// /postAccountAboutMe ->post
router.post('/postAccountAboutMe',isAuth,
    [
        body('EPIAboutMe','About Me must not be empty!').trim().notEmpty()
    ],siteController.postAccountAboutMe);

// /postAccountAddSkill ->post
router.post('/postAccountAddSkill',isAuth,siteController.postAccountAddSkill);

// /postAccountEditSkill/skillId ->post
router.post('/postAccountEditSkill/:skillId',isAuth,siteController.postAccountEditSkill);

// /postAccountDeleteSkill/skillId
router.post('/postAccountDeleteSkill/:skillId',isAuth,siteController.postAccountDeleteSkill);

// /postAccountAddProject ->post
router.post('/postAccountAddProject',isAuth,upload.single('projectImage'),siteController.postAccountAddProject);

// /postAccountEditProject/projectId ->post
router.post('/postAccountEditProject/:projectId',isAuth,upload.single('projectImage'),siteController.postAccountEditProject);

// /postAccountDeleteProject/projectId
router.post('/postAccountDeleteProject/:projectId',isAuth,siteController.postAccountDeleteProject);

// /postCommentToProject/projectId ->post
router.post('/postCommentToProject/:projectId',isAuth,siteController.postCommentToProject);

// /delete ->get
router.get('/delete',isAuth,siteController.getDelete);

// /profile/userId ->get
router.get('/profile/:userId',siteController.getProfile);

// /messageForm/toUserId ->get
router.get('/messageForm/:toUserId',isAuth,siteController.getMessageForm);

// /postMessageForm/toUserId ->post
router.post('/postMessageForm/:toUserId',isAuth,siteController.postMessageForm);

// /inbox ->get
router.get('/inbox',isAuth,siteController.getInbox);

// /inboxMessage/messageId ->get
router.get('/inboxMessage/:messageId',isAuth,siteController.getInboxMessage);

// /message ->get
router.get('/message',siteController.getMessage);

// /single-project/projectId ->get
router.get('/single-project/:projectId',siteController.getSingleProject);

//Account Page Buttons
// /account/edit/aboutme
router.post('/account/edit/aboutme',siteController.postAccountAboutMeEdit);

module.exports = router;
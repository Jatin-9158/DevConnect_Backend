const express = require("express");
const { userAuth } = require("../middlewares/auth");
const User = require("../models/user");
const ConnectionRequest = require("../models/connectionRequest");
const userRouter = express.Router();
const natural = require("natural");
const TfIdf = natural.TfIdf;
const validator = require('validator');
const USER_SAFE_DATA = "firstName lastName photoURL gender age about skills";
const {sendCustomEmail} = require("../utils/sendEmail")
userRouter.get("/user/requests/received", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const receivedRequests = await ConnectionRequest.find({
      toUserId: loggedInUser._id,
      status: "interested"
    }).populate("fromUserId", USER_SAFE_DATA);

    const requestSenders = receivedRequests.map((item) => ({
      fromUser: item.fromUserId,      
      requestId: item._id.toString()  
    }));
    

    return res.status(200).json({
      message: "Request Received Fetched Successfully",
      data: requestSenders
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Something went wrong" });
  }
});

// ✅ GET: Connections
userRouter.get("/user/connections", userAuth, async (req, res) => {
  try {
    const loggedInUser = req.user;

    const connections = await ConnectionRequest.find({
      status: "accepted",
      $or: [
        { toUserId: loggedInUser._id },
        { fromUserId: loggedInUser._id }
      ]
    })
      .populate("fromUserId", USER_SAFE_DATA)
      .populate("toUserId", USER_SAFE_DATA);

    const userConnections = connections.map((item) =>
      item.fromUserId._id.toString() === loggedInUser._id.toString()
        ? item.toUserId
        : item.fromUserId
    );

    return res.status(200).json({
      message: "All Connections Fetched Successfully",
      data: userConnections
    });
  } catch (err) {
    return res.status(500).json({ message: err.message || "Something went wrong" });
  }
});

const getSkillOverlap = (skillsA, skillsB) => {
  const setA = new Set(skillsA || []);
  const setB = new Set(skillsB || []);
  return [...setA].filter(skill => setB.has(skill)).length;
};

const isDefaultAbout = (about) => {
  const defaults = [
    "hi", "hello", "i'm new", "i am new", "hi there", "just joined", "default", "development is not everyone's cup of tea"
  ];
  const normalized = (about || "").toLowerCase().trim();
  const matches = defaults.some(d => normalized.includes(d));
  return normalized.length < 10 || matches;
};

const getCosineSimilarity = (vecA, vecB) => {
  const allTerms = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  const terms = [...allTerms];

  const vectorA = terms.map(term => vecA[term] || 0);
  const vectorB = terms.map(term => vecB[term] || 0);

  const dotProduct = vectorA.reduce((acc, value, index) => acc + value * vectorB[index], 0);
  const magnitudeA = Math.sqrt(vectorA.reduce((acc, value) => acc + value * value, 0));
  const magnitudeB = Math.sqrt(vectorB.reduce((acc, value) => acc + value * value, 0));

  if (magnitudeA === 0 || magnitudeB === 0) return 0;

  return dotProduct / (magnitudeA * magnitudeB);
};

userRouter.get("/user/feed", userAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;
    limit = limit > 50 ? 50 : limit;
    const skip = (page - 1) * limit;

    const loggedInUser = req.user;
    const currentUser = await User.findById(loggedInUser._id).select(USER_SAFE_DATA);  

    if (!currentUser) {
      return res.status(400).json({ message: "User not found" });
    }

    const tipMessages = [];

    if (isDefaultAbout(currentUser.about)) {
      tipMessages.push("Write a more detailed 'about' section to help us recommend better connections.");
    }

    if (!currentUser.skills || currentUser.skills.length === 0) {
      tipMessages.push("Add a few skills to improve skill-based recommendations.");
    }

    const connections = await ConnectionRequest.find({
      $or: [
        { fromUserId: loggedInUser._id },
        { toUserId: loggedInUser._id }
      ]
    }).select("fromUserId toUserId");

    const excludedUserIds = new Set([
      ...connections.map(conn => conn.fromUserId.toString()),
      ...connections.map(conn => conn.toUserId.toString()),
      loggedInUser._id.toString(),
    ]);

    const candidates = await User.find({
      _id: { $nin: [...excludedUserIds] },
      about: { $exists: true },
      age: { $exists: true },
      skills: { $exists: true },
    }).select(USER_SAFE_DATA).lean();  

    const tfidf = new TfIdf();
    tfidf.addDocument(currentUser.about || "");

    const scoredUsers = candidates.map((user) => {
      tfidf.addDocument(user.about || "");
      const vecA = tfidf.listTerms(0).reduce((acc, term) => {
        acc[term.term] = term.tfidf;
        return acc;
      }, {});
      const vecB = tfidf.listTerms(1).reduce((acc, term) => {
        acc[term.term] = term.tfidf;
        return acc;
      }, {});

      const aboutSim = getCosineSimilarity(vecA, vecB) || 0;
      tfidf.documents.pop();

      const ageDiff = Math.abs(currentUser.age - user.age);
      const ageScore = 1 - Math.min(ageDiff / 30, 1);

      const genderScore = currentUser.gender === user.gender ? 1 : 0;

      const skillOverlap = getSkillOverlap(currentUser.skills, user.skills);
      const skillScore = Math.min(skillOverlap / 5, 1);

      const totalScore = (
        0.4 * aboutSim +
        0.2 * ageScore +
        0.2 * skillScore +
        0.2 * genderScore
      );

      return {
        ...user,
        score: totalScore
      };
    });

    const sortedUsers = scoredUsers
      .sort((a, b) => b.score - a.score)
      .slice(skip, skip + limit);

    const usersWithoutScore = sortedUsers.map(user => {
      const { score, ...userWithoutScore } = user;
      return userWithoutScore;
    });

    return res.status(200).json({
      message: "Recommended Users Fetched Successfully",
      tip: tipMessages.length > 0 ? tipMessages.join(" ") : undefined,
      data: usersWithoutScore
    });

  } catch (err) {

    return res.status(500).json({ message: err.message || "Something went wrong" });
  }
});
userRouter.post('/feedback', async (req, res) => {
   try{
    const { emailId, feedback } = req.body;
    if (!validator.isEmail(emailId)) {
      throw new Error('Please enter a valid email address.');
    }
    if (feedback.trim().length === 0) {
      throw new Error('Feedback cannot be empty.');
    }
    if (feedback.trim().length > 500) {
      throw new Error('Feedback is too long. Please keep it under 500 characters.');
    }
    await sendCustomEmail({
      to: emailId,
      subject: 'Thank You for Your Feedback on DevConnect!',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #6366f1;">Hey there 👋,</h2>
          <p>Thank you for taking the time to share your feedback with us! 💬</p>
          <p>We truly appreciate your input and will use it to improve DevConnect continuously.</p>
          <p>If you ever have more thoughts or ideas, don't hesitate to reach out.</p>
          <br/>
          <p>Warm regards,</p>
          <p><strong>The DevConnect Team</strong></p>
        </div>
      `
    });
    
    return res.status(200).json({ message: 'Feedback received' });
   }
   catch(err){
     return res.status(200).json({message: err.message || "Something went wrong"})
   }
});




module.exports = userRouter;

import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import fs from "fs";

const app = express();
const port = 3500;
var apiKey;
var apiURL;
var userID;
var poll = [];

//read in config file and poll JSON at startup
fs.readFile("./config.json", "utf8", (err, data) => {
  if (err) throw err;
  var config = JSON.parse(data);
  apiKey = config.jellyfinKey.valueOf();
  userID = config.jellyfinUserID.valueOf();
  apiURL = config.jellyfinURL.valueOf();
  if (config.loadJSON){
    fs.readFile(config.pollJSON, "utf8", (err, data) => {
      if (err) throw err;
      poll = JSON.parse(data);
      updateOptions();
      softZeroVotes(poll);
    });
  }
})

//Replace undefined vote indexes with 0. Needed to increment votes properly at startup. Doesn't erase non-zero votes
function softZeroVotes(poll){
  for (let i = 0; i < poll.length; i++){
    for (let k = 0; k < poll[i].options.length; k++){
     if (!poll[i].votes[k]){ 
      poll[i].votes[k] = 0;
     }
    }
  }
}

//Replace all vote counts with 0, including undefined counts.
function zeroVotes(poll){
  for (let i = 0; i < poll.length; i++){
    for (let k = 0; k < poll[i].options.length; k++){
      poll[i].votes[k] = 0;
    }
  }
}

app.use(express.static("public"))
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.render("./index.ejs", {
    poll: poll,
    apiURL: apiURL});
});

app.post("/submit", (req, res) => {
  console.log("");
  console.log("Ballot Recieved");

  //Tally votes from ballot
  for (let i = 0; i < Object.keys(req.body).length; i++){
    //Preserve this line for potential testing
    //console.log(Object.keys(req.body)[i] + " " + req.body[Object.keys(req.body)[i]]);
    for (let k = 0; k < req.body[Object.keys(req.body)[i]].length; k++){
      var questionNumber = Object.keys(req.body)[i].slice(1, Object.keys(req.body)[i].length); //get q#
      poll[questionNumber].votes[req.body[Object.keys(req.body)[i]][k]]++; //add vote
    }
  }
  res.redirect("/results");
});

app.get("/results", (req, res) => {
  res.render("./results.ejs", {poll: poll, apiURL: apiURL});
});

app.get("/search", async (req, res) => {
  res.render("search.ejs");
})

app.post("/search", async (req, res) => {
  try {
    console.log(req.body["searchBox"]);
    const result = await axios.get(apiURL + "/Search/Hints", {
        params: {
            api_key: apiKey,
            searchTerm: req.body["searchBox"],
        },
    });
    res.render("search.ejs", {content: result.data, poll: poll}); 
  } catch (error) {
      console.log(error.message)
      res.status(404).send(error.message);
  }
});

//Add new movies to lists
app.post("/add", async (req, res) => {
  poll[req.body["question"]].options.push(req.body["itemID"]);
  poll[req.body["question"]].votes.push(0);
  updateOptions();
  res.redirect("/search");
})

app.get("/manage", async (req, res) => {
  res.render("manage.ejs", {poll: poll});
})

//Remove items from list endpoint
app.post("/manage", async (req, res) => {
  console.log(req.body)

  //parse input to remove items from list
  for (let i = 0; i < Object.keys(req.body).length; i++){
    if (typeof req.body[Object.keys(req.body)[i]] === "object"){
      for (let k = 0; k < req.body[Object.keys(req.body)[i]].length; k++){
        //Listed out as multiple variables to make easier to follow.
        var questionNumber = Object.keys(req.body)[i].slice(1, Object.keys(req.body)[i].length); //get q#
        var itemToRemove = req.body[Object.keys(req.body)[i]][k];
        var itemToRemoveIndex = getIndex(questionNumber, itemToRemove);
        removeIndex(questionNumber, itemToRemoveIndex);

        console.log("Movies Removed");
        console.log(req.body[Object.keys(req.body)[i]][k]);
      }
    } else if (typeof req.body[Object.keys(req.body)[i]] === "string"){
      var questionNumber = Object.keys(req.body)[i].slice(1, Object.keys(req.body)[i].length);
      var itemToRemoveIndex = getIndex(questionNumber, req.body[Object.keys(req.body)[i]]);
      removeIndex(questionNumber, itemToRemoveIndex);
    }
  }
 
//

  res.redirect("/manage");
})

function getIndex(question, matchString){
  for (let i = 0; i < poll[question].options.length; i++){
    if (poll[question].options[i] === matchString){
      return i;
    }
  }
  console.log("Item not found");
  return null;
}

function removeIndex(question, killIndex){
  if (killIndex !== null){
    poll[question].options.splice(killIndex, 1);
    poll[question].info.splice(killIndex, 1);
    poll[question].votes.splice(killIndex, 1);
    poll[question].image.splice(killIndex, 1);
  } else {
    console.log("NO Item Removed")
  }
}

//Create a new poll list for movies
app.post("/create-list", async (req, res) => {
  console.log(req.body);
  let newPoll = {
    question: req.body.question,
    options: [],
    votes: [],
    info: [],
    image: [],
  }
  poll.push(newPoll);
  res.redirect("/manage");
})

//Remove existing poll list
app.post("/remove-list", async (req, res) => {
  console.log(req.body);
  poll.splice(req.body.question, 1);
  res.redirect("/manage");
})

//Endpoint to erase all votes
app.post("/reset", async (req, res) => {
  console.log(req.body);
  zeroVotes(poll);
  res.redirect("/results");
})

//Save current poll to JSON on disk. Decision to hard code file to simply development.
//Use-case of app doesn't justify adding more config to the file for where to save to disk for increased set-up complexity.
app.post("/save", async (req, res) => {
  console.log(req.body);
  console.log("Saving poll to disk");
  fs.writeFile("./save.json", JSON.stringify(poll),(err, data) => {
    if (err) throw err;
  })
  res.redirect("/results");
})

//Dump Jellyfin UserIDs to server output
app.get("/userID", async (req, res) => {
  try {
    const result = await axios.get(apiURL + "/Users", {
        params: {
            api_key: apiKey,
        },
    });
    console.log("**************************************")
    console.log("Dumping all userIDs from Jellyfin API")
    console.log("**************************************")
    for (let i = 0; i < result.data.length; i++){
      console.log(result.data[i].Name + " " + result.data[i].Id)
    }
    res.send("Request Processed. Check Server."); 
  } catch (error) {
      console.log(error.message)
      res.status(404).send(error.message);
  }
})

//Okies API Endpoints
app.get("/poll", async (req, res) => {
  let pollJSON = []
  for (let i = 0; i < poll.length; i++){
    pollJSON[i] = {
      question: poll[i].question,
      id: i,
      options: [],
    }
    for (let j = 0; j < poll[i].options.length; j++){
      let option = {
        title: poll[i].info[j].title,
        taglines: poll[i].info[j].taglines,
        description: poll[i].info[j].overview,
        communityRating: poll[i].info[j].communityRating,
        jellyfinID: poll[i].options[j],
        votes: poll[i].votes[j]
      }
      pollJSON[i].options.push(option);
    }
  }
  res.json(pollJSON);
})

//replace poll
app.put("/poll", async (req, res) => {
  let pollJSON = req.body;
  parsePollJSON(pollJSON);
  const success = {
    status: "complete",
  }
  res.json(success);
})

async function parsePollJSON(pollJSON){
  poll = [];
  //console.log(req.body);
  for (let i = 0; i < pollJSON.length; i++){
    poll[pollJSON[i].id] = {
      question: pollJSON[i].question,
      options: [],
      info: [],
      votes: [],
      image: [],
    }
    for (let j = 0; j < pollJSON[i].options.length; j++){
      poll[i].options.push(pollJSON[i].options[j].jellyfinID)
      poll[i].votes.push(pollJSON[i].options[j].votes)
    }
  }
  await updateOptions();
}

app.post("/nuke", async (req, res) => {
  poll = [];
  console.log(req);
  res.redirect("/manage");
});

app.post("/pollfile", async (req, res) => {
  console.log(req.body);
  await parsePollJSON(JSON.parse(req.body.pollText));
  res.redirect("/manage");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

//This function pulls metadata from Jellyfin API for movies in poll
async function updateOptions(){
  for (let i = 0; i < poll.length; i++){
    for (let k = 0; k < poll[i].options.length; k++){
      poll[i].info[k] = await getInfo(poll[i].options[k]);
      poll[i].image[k] = await getImages(poll[i].options[k])
    }
  }
}

//Hit jellyfin user library enpoint for basic movie data.
async function getInfo(libraryID){
  try {
      const result = await axios.get(apiURL + "/Users/" + userID + "/Items/" + libraryID, {
          params: {
              api_key: apiKey,
          },
  });
      var itemInfo = {
          title: result.data.Name,
          taglines: result.data.Taglines,
          overview: result.data.Overview,
          //critic: result.data.CriticRating,
          communityRating: result.data.CommunityRating,
      }

      //console.log(itemInfo)
  } catch (error) {
      console.log(error.message)
      //res.status(404).send(error.message);
      var itemInfo = {
          title: "Uh Oh",
          taglines: "",
          overview: "",
      }
  }

  //console.log(itemInfo);
  return itemInfo;
} 

//Hit jellyfin endpoint for link to public database image.
//For now, just pulls first remote primary image URL. Should probably revise to pull image directly from Jellyfin library db.
async function getImages(libraryID){
  try {
      const result = await axios.get(apiURL + "/Items/" + libraryID + "/RemoteImages", {
          params: {
              api_key: apiKey,
          },
  });

      var data = result.data;

      //filter down to only primary images
      var primaryImages = [];
      for (let i = 0; i < data.Images.length; i++){
          if (data.Images[i].Type == "Primary"){
              primaryImages.push(data.Images[i].Url);
          }
      }
      //console.log(primaryImages[0])
      return primaryImages[0]
      
  } catch (error) {
      console.log(error.message)
      return "UhOh.jpg";
  }
}
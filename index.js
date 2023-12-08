import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import fs from "fs";

const app = express();
const port = 3500;
var apiKey;
var apiURL;
var userID;
var poll;

fs.readFile("./config.json", "utf8", (err, data) => {
  if (err) throw err;
  var config = JSON.parse(data);
  apiKey = config.jellyfinKey.valueOf();
  userID = config.jellyfinUserID.valueOf();
  apiURL = config.jellyfinURL.valueOf();
  fs.readFile("./poll.json", "utf8", (err, data) => {
    if (err) throw err;
    poll = JSON.parse(data);
    updateOptions();
    zeroVotes(poll);
  });
})

function zeroVotes(poll){
  for (let i = 0; i < poll.length; i++){
    for (let k = 0; k < poll[i].options.length; k++){
      poll[i].votes[k] = 0;
    }
  }
}

app.use(express.static("public"))
app.use(bodyParser.urlencoded({ extended: true }));

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

app.post("/add", async (req, res) => {
  poll[req.body["question"]].options.push(req.body["itemID"]);
  poll[req.body["question"]].votes.push(0);
  updateOptions();
  res.redirect("/search");
})

app.get("/inspector", async (req, res) => {
  res.render("inspector.ejs");
})

app.post("/inspector", async (req, res) => {
  try {
    console.log(req.body["searchBox"]);
    const result = await axios.get(apiURL + "/Users/" + userID + "/Items/" + req.body["searchBox"], {
        params: {
            api_key: apiKey,
            //searchTerm: req.body["searchBox"],
        },
    });
    res.render("inspector.ejs", {content: JSON.stringify(result.data)}); 
  } catch (error) {
      console.log(error.message)
      res.status(404).send(error.message);
  }
});

app.get("/manage", async (req, res) => {
  res.render("manage.ejs", {poll: poll});
})

app.post("/manage", async (req, res) => {
  console.log(req.body)

  //remove items from list
  for (let i = 0; i < Object.keys(req.body).length; i++){
    //console.log(Object.keys(req.body)[i] + " " + req.body[Object.keys(req.body)[i]]);
    for (let k = 0; k < req.body[Object.keys(req.body)[i]].length; k++){
      var questionNumber = Object.keys(req.body)[i].slice(1, Object.keys(req.body)[i].length); //get q#
      poll[questionNumber].options = poll[questionNumber].options.filter(e => e !== req.body[Object.keys(req.body)[i]][k]);
      console.log(req.body[Object.keys(req.body)[i]][k]);
    }
  }

  res.render("manage.ejs", {poll: poll});
})

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

app.post("/remove-list", async (req, res) => {
  console.log(req.body);
  poll.splice(req.body.question, 1);
  res.redirect("/manage");
})

app.post("/reset", async (req, res) => {
  console.log(req.body);
  zeroVotes(poll);
  res.redirect("/results");
})

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

async function updateOptions(){
  for (let i = 0; i < poll.length; i++){
    for (let k = 0; k < poll[i].options.length; k++){
      poll[i].info[k] = await getInfo(poll[i].options[k]);
      poll[i].image[k] = await getImages(poll[i].options[k])
    }
  }
}

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

async function getImages(libraryID){
  try {
      const result = await axios.get(apiURL + "/Items/" + libraryID + "/RemoteImages", {
          params: {
              api_key: apiKey,
          },
  });
      //console.log(result.data);
      //var data = JSON.parse(result.data);
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
      //console.log(error.message)
      return "UhOh.jpg";
  }
}
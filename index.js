import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import fs from "fs";

const app = express();
const port = 3500;
var apiKey;
var userID;
var poll;

fs.readFile("./config.json", "utf8", (err, data) => {
  if (err) throw err;
  var config = JSON.parse(data);
  apiKey = config.jellyfinKey.valueOf();
  userID = config.jellyfinUserID.valueOf();
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
  res.render("./index.ejs", {poll: poll});
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
  res.render("./results.ejs", {poll: poll});
});

app.get("/search", async (req, res) => {
  res.render("search.ejs");
})

app.post("/search", async (req, res) => {
  try {
    console.log(req.body["searchBox"]);
    const result = await axios.get("https://jellyfin.eternaldisco.com/Search/Hints", {
        params: {
            api_key: apiKey,
            searchTerm: req.body["searchBox"],
        },
    });
    res.render("search.ejs", {content: result.data}); 
  } catch (error) {
      console.log(error.message)
      res.status(404).send(error.message);
  }
});

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
      const result = await axios.get("https://jellyfin.eternaldisco.com/Users/" + userID + "/Items/" + libraryID, {
          params: {
              api_key: apiKey,
          },
  });

      var itemInfo = {
          title: result.data.Name,
          taglines: result.data.Taglines,
          overview: result.data.Overview,
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
      const result = await axios.get("https://jellyfin.eternaldisco.com/Items/" + libraryID + "/RemoteImages", {
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
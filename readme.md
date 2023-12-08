# Okies: Movie Chooser
A program to make it easier to pick movies to watch in a group. Make a list of the movies you're interested in watching, and then vote on which movies everyone is willing to watch.

## Installing

If you'd like to run or customize your own server.

### Prereqs
- A current version of NodeJS installed
- NPM installed
- For docker installations: Docker and Docker Compose
- An instance of Jellyfin, an API Key, and a UserID (for grabbing metadata and cover art).


### Installing with docker compose (Recommended):
1. Clone the repository.
    > git clone https://git-site/this-repository
2. Open the folder in terminal, and install npm packages
    > npm i
3. Adjust the docker-compose.yml file as needed.
4. Run docker compose in the root folder of your copied repository.
    > docker compose up -d
5. Access the web app in your web browser. (http://localhost:PORT/)

### Installing without containerization:
1. Clone the repository.
    > git clone https://git-site/this-repository
2. Open the folder in terminal, and install npm packages
    > npm i
3. Run node to start the server in the root folder of your copied repository.
    > node ./index.js
4. Access the web app in your web browser. (http://localhost:3500/)

## Set up through web-interface

1. Create config.json in the directory of the repository. Add your API_Key, UserID, and jellyfinURL. Set loadJSON to false.

    >{  
    >&nbsp;&nbsp;&nbsp;&nbsp;"jellyfinKey": "YOUR_JELLYFIN_API_KEY",  
    >&nbsp;&nbsp;&nbsp;&nbsp;"jellyfinUserID": "YOUR_JELLYFIN_USERID"
    >&nbsp;&nbsp;&nbsp;&nbsp;"jellyfinURL": "https://YOUR_JELLYFIN_SERVER_URL"  
    >&nbsp;&nbsp;&nbsp;&nbsp;"loadJSON": false
    >}

2. Go to hostname:PORT/manage;

3. Create a new list.

4. Click Add Items to Lists or Go to http://localhost:3500/search.

5. Search for items from your library by name, select list # from the dropdown (will be 0 if you only have one list), and then click Add.

6. When finished adding, you can vote at http://localhost:3500/


## Manual Setup
1. Create config.json file with a Jellyfin API key and UserID.

    >{  
    >&nbsp;&nbsp;&nbsp;&nbsp;"jellyfinKey": "YOUR_JELLYFIN_API_KEY",  
    >&nbsp;&nbsp;&nbsp;&nbsp;"jellyfinUserID": "YOUR_JELLYFIN_USERID"
    >&nbsp;&nbsp;&nbsp;&nbsp;"jellyfinURL": "https://YOUR_JELLYFIN_SERVER_URL"  
    >&nbsp;&nbsp;&nbsp;&nbsp;"loadJSON": true,
    >&nbsp;&nbsp;&nbsp;&nbsp;"pollJSON": "LOCATION_OF_POLL_JSON"
    >}

2. Create a poll.json file with your movies.

    >[  
    &nbsp;&nbsp;&nbsp;&nbsp;{  
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;    "question": "The writing here appears as a header above the movie choices",  
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"options": ["ID of Option 1", "ID of Option 2", "ID of Option 3"],  
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"votes": [],  
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"info": [],  
    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"image": []  
    &nbsp;&nbsp;&nbsp;&nbsp;}  
    ]

    - You can have more than one question block. Even with only one question block, the outermost brackets, [ ], are needed.
    - the votes, info, and image fields must exist and be lists. Anything in these fields will be overwritten by API calls.

### Where do I find IDs?

Boot up the server and navigate to localhost:PORT/search. The search box will search your Jellyfin user library to help you find Movie IDs. You can also directly add to existing lists from the search page.
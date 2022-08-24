import axios from "axios";
import { JSDOM } from "jsdom";
import * as fs from "fs";
import prompt from "prompt";

const options = {
  credentials: "include",
  headers: {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:102.0) Gecko/20100101 Firefox/102.0",
    Accept: "*/*",
    "Accept-Language": "en-GB,en;q=0.5",
    "X-Requested-With": "XMLHttpRequest",
    "Alt-Used": "www.pingpocket.fr",
    "Sec-Fetch-Dest": "empty",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Site": "same-origin",
  },
  referrer: "https://www.pingpocket.fr/",
  method: "GET",
  mode: "cors",
};

const getPlayers = async () => {
  const clubID = "07620040";
  const url = `https://www.pingpocket.fr/app/fftt/clubs/${clubID}/licencies?SORT=OFFICIAL_RANK`;

  const reponse = await axios(url, options);

  const dom = new JSDOM(reponse.data);
  const document = dom.window.document;
  const players = [];
  const players_name = [];
  const player_points = [];
  const player_licensesId = [];

  const playerNames = Array.from(document.querySelectorAll("li.arrow a p"));

  // Parse the player names and lastnames.
  playerNames.forEach((player, index) => {
    if (index % 2 === 0) {
      const name = player.textContent.split(" ")[0];
      const lastname = player.textContent.split(" ")[1];

      players_name.push({
        name: name,
        lastname: lastname,
      });
    } else return;
  });

  // Prints the player licenses id.
  Array.from(document.querySelectorAll("li.arrow a")).forEach((element) => {
    const playerUrl = element.href;
    const playerLicenseId = playerUrl.split("/")[4].split("?")[0];
    player_licensesId.push(playerLicenseId);
  });

  // Prints the player points.
  for (let i = 0; i < player_licensesId.length; i++) {
    const playerPoints = await getPlayerPoints(player_licensesId[i]);
    player_points.push(playerPoints);
  }

  players_name.forEach(({ name, lastname }, index) => {
    players.push({
      name: name,
      lastname: lastname,
      points: player_points[index],
      license: player_licensesId[index],
    });
  });

  return players;
};

const getPlayerPoints = async (id) => {
  const url = `https://www.pingpocket.fr/app/fftt/licencies/${id}?CLUB_ID=07620040`;

  const reponse = await axios(url, options);

  const dom = new JSDOM(reponse.data);
  const document = dom.window.document;

  let playerStats = {
    classement: 0,
    start: 0,
    officiels: 0,
    allProgression: 0,
    monthlyProgression: 0,
  };

  const playerProgressionMensuel = Array.from(document.querySelectorAll("li.item-container small"));

  playerProgressionMensuel.forEach((element, index) => {
    if (index === 0) {
      playerStats.classement = element.textContent;
    }
    if (index === 1) {
      playerStats.officiels = element.textContent;
    }
    if (index === 2) {
      playerStats.start = element.textContent;
    }
    if (index === 3) {
      playerStats.monthlyProgression = element.textContent;
    }
    if (index === 4) {
      playerStats.allProgression = element.textContent;
    } else return;
  });

  return playerStats;
};

// Create a new file with the players data.
// add decorations on rows and columns.
const createFile = async () => {
  const players = await getPlayers();

  try {
    const file = fs.createWriteStream("players.csv");
    file.on("error", (err) => {
      console.log(err);
    });
    file.write("Nom, Prénom, Classement, Points Début Saison, Points Fin Saison, Progression \n");
    players.forEach((player) => {
      file.write(
        `${player.name},${player.lastname},${player.points.classement},${player.points.start},${player.points.officiels},${player.points.allProgression}\n`
      );
    });
    file.end();

    console.log("File created");
  } catch (err) {
    console.log(err);
  }

  // style the first row
};



// await createFile();

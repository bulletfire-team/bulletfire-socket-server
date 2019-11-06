let connectionInfos = require("./db.js");

let http = require("http");
let server = http.createServer(function(req, res){ // lancement du serveur
  res.writeHead("200");
  res.end("Good");
});

const crypto = require("crypto");

let io = require("socket.io")(server, {pingInterval: 500}); // creation d'un socket

let squads = []; // Liste des escouades

let squadIdG = 0; // id squad

let usersConnected = []; // Liste des joueurs connectés

let searchingPlayersRank = []; // Liste des joueurs qui recherchent une partie
let searchingSquadsRank = []; // Liste des escouades qui recherchent une partie

let searchingPlayersQuick = []; // Liste des joueurs qui recherchent une partie
let searchingSquadsQuick = []; // Liste des escouades qui recherchent une partie

let searchingPlayersTest = []; // Liste des joueurs qui recherchent une partie
let searchingSquadsTest = []; // Liste des escouades qui recherchent une partie

let games = []; // Liste des parties qui ont été composées
let curGameId = 0;

/* ###   Items   ### */
let weaponSkinPrice = [
  {
    "weapIndex" : 0,
    "skins" : [
      
    ]
  },
  {
    "weapIndex" : 1,
    "skins" : [
      {
        "skinIndex" : 0,
        "price" : 1000
      },
      {
        "skinIndex" : 1,
        "price" : 2000
      }
    ]
  },
  {
    "weapIndex" : 2,
    "skins" : [
      
    ]
  },
  {
    "weapIndex" : 3,
    "skins" : [
      
    ]
  },
  {
    "weapIndex" : 4,
    "skins" : [
      
    ]
  },
  {
    "weapIndex" : 5,
    "skins" : [
      
    ]
  },
  {
    "weapIndex" : 6,
    "skins" : [
      
    ]
  }
];

let characterSkinPrice = [
  {
    "index" : 1,
    "price" : 1000
  },
  {
    "index" : 2,
    "price" : 2000
  },
  {
    "index" : 3,
    "price" : 3000
  },
  {
    "index" : 4,
    "price" : 4000
  }
];

let emotePrice = [
  {
    "index" : 17,
    "price" : 1000
  },
  {
    "index" : 18,
    "price" : 1000
  },
  {
    "index" : 19,
    "price" : 1000
  },
  {
    "index" : 20,
    "price" : 1000
  }
];

let sentencePrice = [
  {
    "index" : 1,
    "price" : 1000
  },
  {
    "index" : 2,
    "price" : 1000
  },
  {
    "index" : 3,
    "price" : 1000
  },
  {
    "index" : 4,
    "price" : 1000
  },
  {
    "index" : 5,
    "price" : 1000
  }
];

let equipmentSkinPrice = [
  {
    "equipIndex" : 0,
    "skins" : [
      {
        "skinIndex" : 0,
        "price" : 1000
      }
    ]
  }
];

let tagPrice = [
  {
    "index" : 0,
    "price" : 1000
  }
];

// Every items are composed by at least 2 numbers
// The first represents the item type :
// 1 : weapon skin
// 2 : character skin
// 3 : player avatar
// 4 : emote
// 5 : sentence
// [ 6 : equipment skin ]
// [ 7 : tags ]

// The second represents the item index
// Except for the weapon skin and the equipment skin
// Here it represents the weapon or the equipment which hav the skin
// And a third number represents the skin index
let chestItems = [
  { // Common
    "proba" : 0.6,
    "items" : [
      {
        "proba" : 0.6,
        "items" : [
          [4,1]  
        ]
      },
      {
        "proba" : 0.25,
        "items" : [
          [4,2]  
        ]
      },
      {
        "proba" : 0.1,
        "items" : [
          [4,3]  
        ]
      },
      {
        "proba" : 0.05,
        "items" : [
          [4,4]  
        ]
      }
    ]
  },
  { // Rare
    "proba" : 0.25,
    "items" : [
      {
        "proba" : 0.6,
        "items" : [
          [4,5]  
        ]
      },
      {
        "proba" : 0.25,
        "items" : [
          [4,6]  
        ]
      },
      {
        "proba" : 0.1,
        "items" : [
          [4,7]  
        ]
      },
      {
        "proba" : 0.05,
        "items" : [
          [4,8]  
        ]
      }
    ]
  },
  { // Epic
    "proba" : 0.1,
    "items" : [
      {
        "proba" : 0.6,
        "items" : [
          [4,9]  
        ]
      },
      {
        "proba" : 0.25,
        "items" : [
          [4,10]  
        ]
      },
      {
        "proba" : 0.1,
        "items" : [
          [4,11]  
        ]
      },
      {
        "proba" : 0.05,
        "items" : [
          [4,12]  
        ]
      }
    ]
  },
  { // Legendary
    "proba" : 0.05,
    "items" : [
      {
        "proba" : 0.6,
        "items" : [
          [4,13]  
        ]
      },
      {
        "proba" : 0.25,
        "items" : [
          [4,14]  
        ]
      },
      {
        "proba" : 0.1,
        "items" : [
          [4,15]  
        ]
      },
      {
        "proba" : 0.05,
        "items" : [
          [4,16]  
        ]
      }
    ]
  }
];

io.on("connection", socket => {

	let mysql = require("mysql");
	let user = null; // variable de "vérification" l'utilisateur
	let mysquad = null; // id de son escouade
  let friends = []; // Liste des amis de ce joueur

  // Connexion du Joueur
	socket.on('connexion', infoCompte => {
		  // defini une variable
		  infoCompte = JSON.parse(infoCompte);
  		hashpassword = crypto.createHash('sha256').update(infoCompte.pwd, 'utf8').digest('hex');
      connection(infoCompte, hashpassword, socket);		
  });

  // Connexion a partir d'un hash
  socket.on('hashconnexion', infoCompte => {
      infoCompte = JSON.parse(infoCompte);
      connection(infoCompte, infoCompte.pwd, socket);
      /*
      let con = new mysql.createConnection(connectionInfos);
      con.connect(function(err) {
          if (err) throw err;
          con.query('SELECT * FROM Player WHERE mail = ? AND pwd = ?', [infoCompte.mail, infoCompte.pwd], function(err, result){ //requete recuperation données à verifier
    				if(err) throw err;

    				if (result.length <= 0){ // cas où l'on obtient aucune information
    					socket.emit('ErrorCon'); // erreur de connexion (mail ou pwd incorrect)
    				}else {
    					user = result[0]; // cas unique : trouver un utilisateur car pas de compte avec mail & pwd similaire
    					user.socketid = socket.id;
                        user.matchId = -1;
                        user.gameType = -1;
    					con.query("SELECT Weapon_ID, Skin_ID FROM UnlockedWeaponSkin WHERE Player_Pseudo = ?", [user.nickname], function(err, res) {
    						if(err) throw err;
    						result[0].unlockweapskin = res;
    						con.query("SELECT Skin_ID FROM UnlockedCharacterSkin WHERE Player_Pseudo = ?", [user.nickname], function(err, re) {
    							if(err) throw err;
    							result[0].unlockcharskin = re;
    							usersConnected.push(user); // ajout du user dans la liste des joueurs connectés
    							socket.emit('SuccesCon', result[0]); // connexion reussie + envoie des données de l'utilisateur
    						});
				     });
			      }
		     });
      });
      */
  });

  function connection (infoCompte, hashpassword, socket) {
    let con = new mysql.createConnection(connectionInfos);// defini une variable
    con.connect(function(err){
        if(err) throw err; // envoi message err + arrêt total
        
        con.query('SELECT * FROM Player WHERE mail = ? AND pwd = ?', [infoCompte.mail, hashpassword], function(err, result){ //requete recuperation données à verifier
          if(err) throw err;

          if (result.length <= 0){ // cas où l'on obtient aucune information
            socket.emit('ErrorCon'); // erreur de connexion (mail ou pwd incorrect)
          }else {
            user = result[0]; // cas unique : trouver un utilisateur car pas de compte avec mail & pwd similaire
            user.socketid = socket.id;
            user.matchId = -1;
            user.gameType = -1;
            con.query("SELECT Weapon_ID, Skin_ID FROM UnlockedWeaponSkin WHERE Player_Pseudo = ?", [user.nickname], function(err, res) {
              if(err) throw err;
              result[0].unlockweapskin = res;
              con.query("SELECT Skin_ID FROM UnlockedCharacterSkin WHERE Player_Pseudo = ?", [user.nickname], function(err, re) {
                if(err) throw err;
                result[0].unlockcharskin = re;
                con.query("SELECT Emote_ID FROM UnlockedEmote WHERE Player_Pseudo = ?", [user.nickname], function(err, res) {
                  if(err) throw err;
                  result[0].unlockemote = res;
                  con.query("SELECT Avatar_ID FROM UnlockedAvatar WHERE Player_Pseudo = ?", [user.nickname], function(err, res) {
                    if(err) throw err;
                    result[0].unlockavatar = res;
                    usersConnected.push(user); // ajout du user dans la liste des joueurs connectés
                    socket.emit('SuccesCon', result[0]); // connexion reussie + envoie des données de l'utilisateur    
                  });
                });
              });
            });
          }
        });
     });
  }

  // Modification des infos du joueur
  socket.on('update', infoCompte => {
	    infoCompte = JSON.parse(infoCompte);
		  if(user === null) return ; // permet "d'assurer" que l'utilisateur ne se connecte pas avec des identifiants trafiqués
	    let con = new mysql.createConnection(connectionInfos);// defini une variable
		  con.connect(function(err){
	      if(err) throw err;
  			con.query('UPDATE Player SET  kda= ?, killnb = ?, playtime = ?, winrate = ?, accuracy = ?, headshotrate = ?, icon = ? WHERE mail = ? ', [infoCompte.kda, infoCompte.killnb, infoCompte.playtime, infoCompte.winrate, infoCompte.accuracy, infoCompte.headshotrate, infoCompte.icon, user.mail], function(err, result){
  				if(err) throw err;
  				socket.emit('SuccesUpdate', result[0]);
  			});
		  });
  });

	// Achat d'un skin d'arme
	socket.on("BuyWeapSkin", info => {
		if(user == null) return;
		info = JSON.parse(info);
    let weapon = weaponSkinPrice.filter(w => w.weapIndex == info.Weapon_ID);
    if(weapon.length != 1) return;
    let skin = weapon[0].skins.filter(s => s.skinIndex == info.Skin_ID);
    if(skin.length != 1) return;
		let price = skin[0].price;
		if(user.money < price){
			return;
		}
		let con = new mysql.createConnection(connectionInfos);
		con.connect(function (err) {
			if(err) throw err;
			con.query("INSERT INTO UnlockedWeaponSkin (Player_Pseudo, Weapon_ID, Skin_ID) VALUES ?", [[[user.nickname, info.Weapon_ID, info.Skin_ID]]], function(err, result) {
				if(err) throw err;
				if(result.affectedRows != 0) {
					con.query("UPDATE Player SET money -= ? WHERE nickname = ?", [price, user.nickname], function(err, result){
						if(err) throw err;
						user.money -= price;
					});
				}
			});
		});
	});

  // Achat d'une emote
  socket.on("BuyEmote", (emoteId) => {
    if(user == null) return;
    let price = emotePrice.filter(p => p.index == emoteId);
    if(price.length != 1) return;
    price = price[0].price;
    if(user.money < price) return;
    let con = mysql.createConnection(connectionInfos);
    con.connect(function (err) {
      if(err) throw err;
      con.query("INSERT INTO UnlockedEmote (Player_Pseudo, Emote_ID) VALUES ?", [[[user.nickname, emoteId]]], function(err, result) {
        if(err) throw err;
        if(result.affectedRows != 0) {
          con.query("UPDATE Player SET money -= ? WHERE nickname = ?", [price, user.nickname], function(err, result) {
            if(err) throw err;
            user.money -= price;
          });
        }
      });
    });
  });

	// Achat d'un skin de personnage
	socket.on("BuyCharSkin", (skinId) => {
		if(user == null) return;
		let price = characterSkinPrice.filter(p => p.index == skinId);
    if(price.NetworkReader.Length != 1) return;
    price = price[0].price;
		if(user.money < price) {
			return;
		}
		let con = mysql.createConnection(connectionInfos);
		con.connect(function(err) {
			if(err) throw err;
			con.query("INSERT INTO UnlockedCharacterSkin (Player_Pseudo, Skin_ID) VALUES ?", [[[user.nickname, skinId]]], function(err, result) {
				if(err) throw err;
				if(result.affectedRows != 0) {
					con.query("UPDATE Player SET money = money - ? WHERE nickname = ?", [price, user.nickname], function(err, result) {
						if(err) throw err;
						user.money -= price;
					});
				}
			});
		});
	});

  // Achat d'une Réplique
  socket.on("BuyQuote", (sentenceId) => {
    if(user == null) return;
    let price = sentencePrice.filter(p => p.index == sentenceId);
    if(price.length != 1) return;
    price = price[0].price;
    if(user.money < price) return;
    let con = mysql.createConnection(connectionInfos);
    con.connect(function (err) {
      if(err) throw err;
      con.query("INSERT INTO UnlockedSentence (Player_Pseudo, Sentence_ID) VALUES ?", [[[user.nickname, sentenceId]]], function(err, result) {
        if(err) throw err;
        if(result.affectedRows != 0) {
          con.query("UPDATE Player SET money = money - ? WHERE nickname = ?", [price, user.nickname], function(err, result) {
            if(err) throw err;
            user.money -= price;
          });
        }
      });
    });
  });

	// Ouverture d'un coffre
	socket.on("OpenBox", () => {
		if(user == null) return;
		if(user.NbCoffres <= 0) return;

		let con = mysql.createConnection(connectionInfos);
		con.connect(function(err){
			if(err) throw err;
			con.query("UPDATE Player SET NbCoffres = NbCoffres - 1 WHERE nickname = ?", [user.nickname], function(err, result){
				if(err) throw err;
        let nb = Math.floor((Math.random() * 100) + 1);
        
        let item = null;
        
        if(nb <= 60) {
          // Common
          item = openBox(0);
        }else if(nb <= 85) {
          // Rare
          item = openBox(1);
        }else if(nb <= 95) {
          // Epic
          item = openBox(2);
        }else if(nb <= 100) {
          // Legendary
          item = openBox(3);
        }

        if(item == null) return;

        // If the player already has this item we give him some money by putting -1 in item
        switch(item[0]) {
          case 1 :
            // Weapon skin
            con.query("SELECT * FROM UnlockedWeaponSkin WHERE Player_Pseudo = ? AND Weapon_ID = ? AND Skin_ID = ?", [user.nickname, item[1], item[2]], function(err, res) {
              if(err) throw err;
              if(res.length > 0) {
                item[0] = -1;
              }else{
                con.query("INSERT INTO UnlockedWeaponSkin (Player_Pseudo, Weapon_ID, Skin_ID) VALUES ?", [[[user.nickname, item[1], item[2]]]], function(err, result){
                  if(err) throw err;
                });
              }
            });
            break;
          case 2 :
            // Character skin
            con.query("SELECT * FROM UnlockedCharacterSkin WHERE Player_Pseudo = ? AND Skin_ID = ?", [user.nickname, item[1]], function(err, res) {
              if(err) throw err;
              if(res.length > 0) {
                item[0] = -1;
              }else{
                con.query("INSERT INTO UnlockedCharacterSkin (Player_Pseudo, Skin_ID) VALUES ?", [[[user.nickname, item[1]]]], function(err, result){
                  if(err) throw err;
                });
              }
            });
            break;
          case 3 :
            // Player avatar
            con.query("SELECT * FROM UnlockedAvatar WHERE Player_Pseudo = ? AND Avatar_ID = ?", [user.nickname, item[1]], function(err, res) {
              if(err) throw err;
              if(res.length > 0) {
                item[0] = -1;
              }else{
                con.query("INSERT INTO UnlockedAvatar (Player_Pseudo, Avatar_ID) VALUES ?", [[[user.nickname, item[1]]]], function(err, result){
                  if(err) throw err;
                });
              }
            });
            break;
          case 4 :
            // emote
            con.query("SELECT * FROM UnlockedEmote WHERE Player_Pseudo = ? AND Emote_ID = ?", [user.nickname, item[1]], function(err, res) {
              if(err) throw err;
              if(res.length > 0) {
                item[0] = -1;
              }else{
                con.query("INSERT INTO UnlockedEmote (Player_Pseudo, Emote_ID) VALUES ?", [[[user.nickname, item[1]]]], function(err, result){
                  if(err) throw err;
                });
              }
            });
            break;
          case 5 :
            // sentence
            con.query("SELECT * FROM UnlockedSentence WHERE Player_Pseudo = ? AND Sentence_ID = ?", [user.nickname, item[1]], function(err, res) {
              if(err) throw err;
              if(res.length > 0) {
                item[0] = -1;
              }else{
                con.query("INSERT INTO UnlockedSentence (Player_Pseudo, Sentence_ID) VALUES ?", [[[user.nickname, item[1]]]], function(err, result){
                  if(err) throw err;
                });
              }
            });
            break;
        }

        if(item[0] == -1) {
          con.query("UPDATE Player SET money = money + 1000 WHERE nickname = ?", [user.nickname], function(err, res) {
            if(err) throw err;
          });
        }

        socket.emit("openchest", {"chest" : item});

			});
		});
	});

  function openBox (type) {
    let nb2 = Math.floor((Math.random() * 100) + 1);
    let result = chestItems[type].items.some(items => {
      if(nb2 <= (items.proba * 100)){
        let nbItem = Math.floor(Math.random() * items.items.length + 1) - 1;
        let item = items.items[nbItem];
        return item;
      }else{
        return false;
      }
    });
    return result;
  }

  // Modification des infos d'un joueur par l'hote de la partie
  socket.on('updatefromhost', gameStat => {
	    gameStat = JSON.parse(gameStat);
      if(user == null) return;
	    let con = new mysql.createConnection(connectionInfos);// defini une variable
      if(mysquad != null) {
          var s = sqauds.filter(u => u.id == mysquad);
          if(s.length <= 0) return;
          var squad = s[0];
          if(squad.matchId != -1) {
              var g = games.filter(u => u.id == squad.matchId);
              if(g.length <= 0) return;
              var game = g[0];
              if(game.hasBegin && game.host == user){
                  con.connect(function (err){
                      if(err) throw err;
                      con.query("UPDATE Player SET killnb = killnb + ?, nbassist = nbassist + ?, nbdeath = nbdeath + ?, gamePlayed = gamePlayed + 1, gameWin = gameWin + ? WHERE nickname = ?", [gameStat.nbKill, gameStat.nbAssist, gameStat.nbDeath, gameStat.win, gameStat.pseudo], function(err, result) {
                          if(err) throw err;
                          return;
                      });
                  });
              }else{
                  return;
              }
          }else{
              return;
          }
      }else {
          if(user.matchId != -1) {
              var g = games.filter(u => u.id == user.matchId);
              if(g.length <= 0) return;
              var game = g[0];
              if(game.hasBegin && game.host == user){
                  con.connect(function (err){
                      if(err) throw err;
                      con.query("UPDATE Player SET killnb = killnb + ?, nbassist = nbassist + ?, nbdeath = nbdeath + ?, gamePlayed = gamePlayed + 1, gameWin = gameWin + ? WHERE nickname = ?", [gameStat.nbKill, gameStat.nbAssist, gameStat.nbDeath, gameStat.win, gameStat.pseudo], function(err, result) {
                          if(err) throw err;
                          return;
                      });
                  });
              }
          }else{
              return;
          }
      }
  });

  // Fin de la partie par l'hote de la partie
  socket.on('endgame', gameStat => {
      if(user == null) return;
      if(mysquad != null) {
          var s = sqauds.filter(u => u.id == mysquad);
          if(s.length <= 0) return;
          var squad = s[0];
          if(squad.matchId != -1) {
              var g = games.filter(u => u.id == squad.matchId);
              if(g.length <= 0) return;
              var game = g[0];
              if(game.hasBegin && game.host == user){
                  game.blueTeam.forEach(e => {
                      e.isSearching = false;
                      e.matchId = -1;
                  });
                  game.redTeam.forEach(e => {
                      e.isSearching = false;
                      e.matchId = -1;
                  });
                  games = games.filter(u => u.id != game.id);
              }else{
                  return;
              }
          }else{
              return;
          }
      }else {
          if(user.matchId != -1) {
              var g = games.filter(u => u.id == user.matchId);
              if(g.length <= 0) return;
              var game = g[0];
              if(game.hasBegin && game.host == user){
                  game.blueTeam.forEach(e => {
                      e.isSearching = false;
                      e.matchId = -1;
                  });
                  game.redTeam.forEach(e => {
                      e.isSearching = false;
                      e.matchId = -1;
                  });
                  games = games.filter(u => u.id != game.id);
			}
          }else{
              return;
          }
      }
  });

	// Demande du tableau des scores
	socket.on("getleaderboard", page => {
		if(user == null) return;
		let con = new mysql.createConnection(connectionInfos);
		con.connect(function(err) {
			if(err) throw err;
			con.query("SELECT rank, nickname FROM Player ORDER BY rank DESC LIMIT ?, ?", [(page-1)*10, 10], function(err, result){
				if(err) throw err;
				let res = [];
				result.forEach(e => {
					res.push({nickname : e.nickname, rank : e.rank});
				});
				socket.emit("receiveleaderboard", {friends : res});
			});
		});
	});

  // Deconnexion du joueur
  socket.on('disconnect', () => {
    if(user == null) return;
    if(friends != null) {
      friends.forEach(e => {
        let f = usersConnected.filter(u => u.nickname == e.nickname);
        if(f.length > 0) {
            io.to(f[0].socketid).emit("FriendDisconnection", {nickname : user.nickname, isConnected : false});
        }
      });
    }
    detag();
    leaveSquad();
    usersConnected = usersConnected.filter(u => u != user);
  });

  function detag() {
      if(mysquad != null) {

      }else{
          if(user.isSearching){
              if(user){
                console.log("toto");
              }
          }
      }
  }

  /*###  Chat  ###*/
  socket.on("sendpersonalmessage", messageInfo => {
      if(user == null) return;
      messageInfo = JSON.parse(messageInfo);
	    console.log("Send message : " + messageInfo);
      let con = new mysql.createConnection(connectionInfos);
      con.connect(function(err) {
          if(err) throw err;
          con.query("INSERT INTO Chat (`Receiver`, `Sender`, Message) VALUES ?", [[[messageInfo.Receiver, user.nickname, messageInfo.Message]]], function(err, result){
              if(err) throw err;
              if(result.affectedRows == 0) {
                  socket.emit("NoUserFoundSPM");
                  return;
              }else{
                  socket.emit("SPMSuccess", messageInfo);
                  let us = usersConnected.filter(u => u.nickname == messageInfo.Receiver);
                  if(us.length > 0) {
                    console.log("Send msg to " + us[0].nickname);
                      io.to(us[0].socketid).emit("NewPersonalMessage", {Receiver : us[0].nickname, Sender : user.nickname, Message : messageInfo.Message});
                  }else{
                    console.log("User not connected");
                  }
              }

          });
      });
  });

  socket.on("sendsquadmessage", messageInfo => {
      if(user == null) return;
      messageInfo = JSON.parse(messageInfo);
      if(mysquad == null){
          socket.emit("nosquad");
          return;
      }
      let sq = squads.filter(u => u.id == mysquad);
      if(sq.length > 0) {
          sq = sq[0];
          messageInfo.Sender = user.nickname;
          messageInfo.Icon = user.icon;
          sq.players.forEach(e => {
              if(e.hasJoin){
                  io.to(e.user.socketid).emit("NewSquadMessage", messageInfo);
              }
          });
      }
  });

  socket.on("getchat", () => {
      if(user == null) return;
      let con = mysql.createConnection(connectionInfos);
      con.connect(function(err) {
          if(err) throw err;
          con.query("SELECT * FROM Chat WHERE `Sender` = ? OR `Receiver` = ?", [user.nickname, user.nickname], function(err, result){
              if(err) throw err;
              socket.emit("getchat", {messages : result});
          });
      });
  });

  /* ###   Gestion des amis   ### */
  /*
      Structure d'un ami :
      friend = {
          nickname : string,
          isConnected : boolean
      };
  */

  // Evenement : Envoi d'une requête d'ami
  socket.on('sendFriendRequest', pseudo => {
      if(user === null) return ; // permet "d'assurer" que l'utilisateur ne se connecte pas avec des identifiants trafiqués
  		let con = new mysql.createConnection(connectionInfos);// defini une variable
  		con.connect(function(err){

  			if(err) throw err; // envoi message err + arrêt total

  			if(friends.includes(pseudo)){
  				socket.emit("AlreadyFriend"); // Les joueurs sont déjà amis
  			}

  			con.query('INSERT INTO Friend VALUES ? ', [[[user.nickname , pseudo, 0]]], function(err, result){ // triple "[]" uniquement pour les INSERT
  				if(err) throw err;
  				if (result.affectedRows === 0){
  					socket.emit("NoUserFoundSFR"); // Si le joueur n'existe pas
  				} else {
  					socket.emit("SendFriendRequestSuccess"); // OK
  					let f = usersConnected.filter(u => u.nickname == pseudo);
  					if (f.length > 0){
  					    io.to(f[0].socketid).emit("NewFriendRequest", {user : user.nickname}/* par soucis de désérialsiation*/); //envoi "direct" d'invitation
  					}
  				}
  			});
  		});
  });

  // Evenement : Acceptation d'une requête d'ami
  socket.on('acceptFriendRequest', pseudo => {
	    if(user === null) return ; // permet "d'assurer" que l'utilisateur ne se connecte pas avec des identifiants trafiqués
      let con = new mysql.createConnection(connectionInfos);// defini une variable
  		con.connect(function(err){

  			if(err) throw err; // envoi message err + arrêt total

  			con.query('UPDATE Friend SET request = ? WHERE nickname1 = ? AND nickname2 = ?', [1, pseudo, user.nickname], function(err, result){
  				if(err) throw err;
  				if (result.affectedRows === 0){
  					socket.emit("NoRequestFound", result); // Si la requête n'existe pas
  				} else {
  				    let f = usersConnected.filter(u => u.nickname == pseudo);
  				    if (f.length > 0){
  					     io.to(f[0].socketid).emit("FriendConnection", {user : user.nickname, isConnected : true}); //accepter l'invitation
                 socket.emit("FriendConnection", {user : pseudo, isConnected : true});
  				    }
  				}
  			});
  		});
  });

  // Evenement : Refus d'une requête d'ami
  socket.on('refuseFriendRequest', pseudo => {
      if(user === null) return ; // permet "d'assurer" que l'utilisateur ne se connecte pas avec des identifiants trafiqués
  		let con = new mysql.createConnection(connectionInfos);// defini une variable
  		con.connect(function(err){

  			if(err) throw err; // envoi message err + arrêt total

  		    con.query('DELETE FROM Friend WHERE nickname1 = ? AND nickname2 = ? AND request = ?', [pseudo, user.nickname, 0], function(err, result){
  				if(err) throw err;
  				if (result.affectedRows !== 0){
  					socket.emit("RefuseFriendRequestSuccess", result); // OK
  				}
  			});
  		});
  });

  // Evenement : Supprimer un amis
  socket.on('deleteFriend', pseudo => {
      if(user === null) return ; // permet "d'assurer" que l'utilisateur ne se connecte pas avec des identifiants trafiqués
      let con = new mysql.createConnection(connectionInfos);// defini une variable
      con.connect(function(err){

        if(err) throw err; // envoi message err + arrêt total

          con.query('DELETE FROM Friend WHERE ((nickname1 = ? AND nickname2 = ?) OR (nickname2 = ? AND nickname1 = ?)) AND request = ?', [pseudo, user.nickname, pseudo, user.nickname, 1], function(err, result){
          if(err) throw err;
          if (result.affectedRows !== 0){
            socket.emit("DeleteFriendSuccess", result); // OK
          }
        });
      });
  });

  // Evenement : Affichage des requêtes reçues
  socket.on('getFriendRequests', () => {
      if(user === null) return ; // permet "d'assurer" que l'utilisateur ne se connecte pas avec des identifiants trafiqués
      let con = new mysql.createConnection(connectionInfos);// defini une variable
      con.connect(function(err){

        if(err) throw err; // envoi message err + arrêt total

          con.query('SELECT nickname1 FROM Friend WHERE nickname2 = ? AND request = ?', [user.nickname, 0], function(err, result){
          if(err) throw err;
          if (result.length >= 0){
            let res = [];
            result.forEach(e => {
              res.push({nickname : e.nickname1});
            });
            socket.emit("OnReceiveFriendRequests", {friends : res}); // Envoi de la liste des requêtes
          }
        });
      });
  });

  // Evenement : Affichage des amis
  socket.on('getFriend', () => {
    if(user === null) return ; // permet "d'assurer" que l'utilisateur ne se connecte pas avec des identifiants trafiqués
  	let con = new mysql.createConnection(connectionInfos);// defini une variable
  	con.connect(function(err){
  		if(err) throw err; // envoi message err + arrêt total
  		  con.query('SELECT nickname1, nickname2, icon FROM Friend f, Player p WHERE (f.nickname1 = ? AND f.nickname2 = p.nickname) OR (f.nickname2 = ? AND f.nickname1 = p.nickname) AND request = ?', [user.nickname, user.nickname, 1], function(err, result){
  				if(err) throw err;
  				if (result.length >= 0){
  					result.forEach(e => {
  						if(e.nickname1 !== user.nickname){
						    let f = usersConnected.filter(u => u.nickname == e.nickname1);
                let fri = {nickname : e.nickname1, isConnected : (f.length > 0), icon : e.icon};
                if(f.length > 0) {
                  io.to(f[0].socketid).emit("FriendConnection", {nickname : user.nickname, isConnected : true, icon : user.icon});
                }
                friends.push(fri);
  						}
  						if(e.nickname2 !== user.nickname){
  						    let f = usersConnected.filter(u => u.nickname == e.nickname2);
  						    let fri = {nickname : e.nickname2, isConnected : (f.length > 0), icon : e.icon};
                  if(f.length > 0) {
                    io.to(f[0].socketid).emit("FriendConnection", {nickname : user.nickname, isConnected : true, icon : user.icon});
                  }
                  friends.push(fri);
  						}
  					});
  					socket.emit("OnReceiveFriends", {friends : friends}); // Envoi de la liste des amis
  				}
  			});
  		});
  });


  /* ###   Gestion des escouades   ### */

  /*
  Structure d'une escouade :
	squad = {
		id : int,
		players : [
			{
				user : user,
				hasJoin : true,
				isLeader : true
			},
			{
				user : user,
				hasJoin : true,
				isLeader : false
			},
			{
				user : user,
				hasJoin : false,
				isLeader : false
			}
		]
  };
  */

  // Evenement : Invitation dans une escouade
  socket.on('inviteFriendIntoSquad', pseudo => {
      if(user === null) return ; // permet "d'assurer" que l'utilisateur ne se connecte pas avec des identifiants trafiqués
      let f = friends.filter(u => u.nickname == pseudo); //récuperation de l'ami parmi "Friends"
      if(f.length > 0){
          if(f[0] != null){
              let friendco = usersConnected.filter(u => u.nickname == pseudo);
              if(mysquad === null){
                  squads.push({id : squadIdG, isSearching : false, gameType : -1, matchId : -1, players : [{user : user, hasJoin : true, isLeader : true}, {user : friendco[0], hasJoin : false, isLeader : false}]});
                  mysquad = squadIdG;
                  squadIdG ++;
                  socket.emit("OnCreateSquad", {friends : [{nickname : user.nickname}]});
                  io.to(friendco[0].socketid).emit("ReceiveSquadRequest", {nickname : user.nickname, squadId : mysquad});
              }
             else {
                  let s = squads.filter(u => u.id == mysquad);
                  if(s.length <= 0) {
                      mysquad = null;
                      return;
                  }
                  if (s[0].players[0].user.nickname == user.nickname){
                      if(!s[0].isSearching){
                          if(s[0].players.length < 5){ // Maximum 5 pers en squad
                              s[0].players.push({user : friendco[0], hasJoin : false, isLeader : false});
                              socket.emit("InviteFriendIntoSquadSuccess");
                              io.to(friendco[0].socketid).emit("ReceiveSquadRequest", {nickname : user.nickname, squadId : mysquad});
                          }
                      }
                  }
              }
          }
          else {
              socket.emit("FriendNotConnected"); // Si le joueur n'est pas connecté
          }
      }
      else {
          socket.emit("NotAFriendIFIS"); // Si les joueurs ne sont pas amis
      }
  });

  // Evenement : Acceptation d'une invitation dans une escouade
  socket.on('acceptSquadInvitation', squadId => {
      if(user === null) return ; // permet "d'assurer" que l'utilisateur ne se connecte pas avec des identifiants trafiqués
      let s = squads.filter(u => u.id == squadId);
      if (s.length > 0){
         var correct = false;
         let players = [];
         s[0].players.forEach(e =>{
             players.push({nickname : e.user.nickname, icon : e.user.icon});
             if(e.user.nickname == user.nickname){
                 e.hasJoin = true;
                 correct = true;
             }
          });
          if(correct){
              mysquad = squadId;
             socket.emit("OnJoinSquad", {friends : players} );
              s[0].players.forEach(e =>{
                  if(e.user.nickname != user.nickname && e.hasJoin == true){
                      io.to(e.user.socketid).emit("NewUserInSquad", {nickname : user.nickname, icon : user.icon});
                  }
              });
          }
       }
       else{
          socket.emit("NoSquadFound"); // Si l'escouade n'existe pas
       }

  });

  // Evenement : Refus d'une invitation dans une escouade
  socket.on('refuseSquadRequest', squadId => {
    if(user === null) return ; // permet "d'assurer" que l'utilisateur ne se connecte pas avec des identifiants trafiqués
      let s = squads.filter(u => u.id == squadId);
      if (s.length > 0){
         s[0].players = s[0].players.filter(u => u.user.nickname != user.nickname); // Retrait "de soi-même" de la liste de joueurs de squad
         if(s[0].players.length == 1){
             let so = s[0].players[0].socketid;
             io.to(so).emit("DeleteSquad");
             squads = squads.filter(u => u != s[0]);
         }
         socket.emit("RefuseSquadRequestSuccess");
       }
       else {
          socket.emit("NoSquadFound"); // Si l'escouade n'existe pas
       }
  });

  // Evenement : Virer un joueur d'une escouade
  socket.on('kickUserFromSquad', pseudo => {
      if(user === null) return ; // permet "d'assurer" que l'utilisateur ne se connecte pas avec des identifiants trafiqués
      let s = squads.filter(u => u.id == mysquad);
      if(s.length <= 0){

          return;
      }
      if(s[0].isSearching){
          socket.emit("SquadMatchMaking");
          return;
      }
      if (s[0].players[0].user.nickname == user.nickname){
          let userViree = s[0].players = s[0].players.filter(u => u.user.nickname == pseudo);
          s[0].players = s[0].players.filter(u => u.user.nickname != pseudo);
          socket.emit("KickUserFromSquadSuccess");
          io.to(userViree.socketid).emit("OnKicked");
          s[0].players.forEach(e =>{
              if(e.hasJoin == true){
                  io.to(e.user.socketid).emit("OnUserKicked", {nickname : userViree.nickname});
              }
          });
          if(s[0].players.length == 1){
             let so = s[0].players[0].socketid;
             io.to(so).emit("DeleteSquad");
             squads = squads.filter(u => u != s[0]);
         }

      }
      else{
          socket.emit("NotSquadAdmin");
      }
  });

  // Evenement : Quitter une escouade
  socket.on('leaveSquad', () => {
      if(user === null) return ; // permet "d'assurer" que l'utilisateur ne se connecte pas avec des identifiants trafiqués
      leaveSquad(user, mysquad);
  });

  function leaveSquad (curuser, cursquad) {
      if(cursquad != null){
      let s = squads.filter(u => u.id == cursquad);
      if (s.length > 0){
          if(s[0].isSearching){
              socket.emit("SquadMatchMaking");
              return;
          }
         s[0].players = s[0].players.filter(u => u.user.nickname != user.nickname);// Retrait "de soi-même" de la liste de joueurs de squad
         mysquad = null;
         socket.emit("LeaveSquadSucces");
         s[0].players.forEach(e =>{
                  if(e.user.nickname != user.nickname && e.hasJoin == true){
                      io.to(e.user.socketid).emit("UserLeaveSquad", {nickname : user.nickname});
                  }
              });
          if(s[0].players[0].isLeader == false){
              s[0].players[0].isLeader = true;
              s[0].players.forEach(e =>{
                  if(e.user.nickname != user.nickname && e.hasJoin == true){
                      io.to(e.user.socketid).emit("ChangeLeader", {nickname : s[0].players[0].user.nickname});
                  }
              });
          }
          if(s[0].players.length == 1){
             let so = s[0].players[0].socketid;
             io.to(so).emit("DeleteSquad");
             squads = squads.filter(u => u != s[0]);
         }
      }
      else {
          socket.emit("NotInASquad");
          }
      }
  }

  /* ###   Matchmaking   ### */

  // Evenement : Lancer la recherche de partie
  socket.on('startmatchmaking', gameType => {
      if(user === null) return ; // permet "d'assurer" que l'utilisateur ne se connecte pas avec des identifiants trafiqués
      if(mysquad != null) {
          let s = squads.filter(u => u.id == mysquad);
          if(s > 0){
              let squad = s[0];
              if(squad.players[0].user == user){
                  if(!squad.isSearching){
                      let waituser = squad.players.filter(u => !u.hasJoin);
                      if(waituser.length == 0){
                          squad.players.forEach(e => {
                              socket.emit("MMStartMatchMaking");
                          });
                          squad.isSearching = true;
                          findPlayers(squad, 2, gameType);
                      }else{
                          socket.emit("MMWaitingPlayers");
                      }
                  }else{
                      socket.emit("MMAlreadySearching");
                  }
              }else{
                  socket.emit("MMNotLeader");
              }
          }
      }else {
          socket.emit("MMStartMatchMaking");
          findPlayers(user, 1, gameType);
      }
  });

  socket.on('startmatchmakingtest', gameStruct => {
      if(user == null) return;
      gameStruct = JSON.parse(gameStruct);
      console.log("Start MM test");
      if(mysquad != null) {
          console.log("squad");
          let s = squads.filter(u => u.id == mysquad);
          if(s > 0){
              let squad = s[0];
              if(squad.players[0].user == user){
                  if(!squad.isSearching){
                      let waituser = squad.players.filter(u => !u.hasJoin);
                      if(waituser.length == 0){
                          squad.players.forEach(e => {
                              socket.emit("MMStartMatchMaking");
                          });
                          squad.isSearching = true;
                          findPlayersTest(squad, 2, gameStruct);
                      }else{
                          socket.emit("MMWaitingPlayers");
                      }
                  }else{
                      socket.emit("MMAlreadySearching");
                  }
              }else{
                  socket.emit("MMNotLeader");
              }
          }
      }else {
          console.log("user");
          socket.emit("MMStartMatchMaking");
          findPlayersTest(user, 1, gameStruct);
      }
  });

  // Evenement : Stopper la recherche de partie
  socket.on('stopmatchmaking', () => {
      if(user === null) return ; // permet "d'assurer" que l'utilisateur ne se connecte pas avec des identifiants trafiqués
      if(mysquad != null) {
          let s = squads.filter(u => u.id == mysquad);
          if(s > 0){
              let squad = s[0];
              if(squad.players[0].user == user){
                  if(squad.isSearching){
                      if(squad.gameType == 1) {
                          searchingSquadsRank = searchingSquadsRank.filter(u => u != squad);
                      }else if(squad.gameType == 2) {
                          searchingSquadsQuick = searchingSquadsQuick.filter(u => u != squad);
                      }else if (squad.gameType == 3) {
                          searchingSquadsTest = searchingSquadsTest.filter(u => u != squad);
                      }

                      squad.players.forEach(e => {
                          socket.emit("MMStopMatchMaking");
                      });
                      squad.isSearching = false;
                  }else{
                      socket.emit("MMNotSearching");
                  }
              }else{
                  socket.emit("MMNotLeader");
              }
          }
      }else {
          if(user.gameType == 1) {
              searchingPlayersRank = searchingPlayersRank.filter(u => u != user);
          }else if(user.gameType == 2) {
              searchingPlayersQuick = searchingPlayersQuick.filter(u => u != user);
          }else if(user.gameType == 3) {
              searchingPlayersTest = searchingPlayersTest.filter(u => u != user);
          }
          user.isSearching = false;
          socket.emit("MMStopMatchMaking");
      }
  });

  // Evenement : l'hote a cree la partie
  socket.on('hostready', gameNetId => {
      if(user == null) return;
      let gameId = -1;
      if(mysquad != null) {
          let s = squads.filter(u => u.id == mysquad);
          if(s.length < 1) return;
          let squad = s[0];
          gameId = squad.matchId;
      }else{
          gameId = user.matchId;
      }
      if(gameId == -1) return;
      let g = games.filter(u => u.id == gameId);
      if(g.length < 1) return;
      let game = g[0];
      if(game.host != user) return;
      game.redTeam.forEach(e => {
          if(e.isSquad) {
              e.elem.players.forEach(f => {
                  if(f.user != user) {
                      io.to(e.elem.socketid).emit("MMGetNetGame", {matchId : gameNetId, isRed : true});
                  }
              });
          }else{
              if(e.elem != user){
                  io.to(e.elem.socketid).emit("MMGetNetGame", {matchId : gameNetId, isRed : true});
              }
          }
      });
      game.blueTeam.forEach(e => {
          if(e.isSquad) {
              e.elem.players.forEach(f => {
                  if(f.user != user) {
                      io.to(e.elem.socketid).emit("MMGetNetGame", {matchId : gameNetId, isRed : false});
                  }
              });
          }else{
              if(e.elem != user){
                  io.to(e.elem.socketid).emit("MMGetNetGame", {matchId : gameNetId, isRed : false});
              }
          }
      });
  });
});

function findPlayers (elem, type, gameType) {
    var nb = 0;
    if(type == 1){
        nb = 1;
    }else{
        nb = elem.players.length;
    }
    let redTeam = [];
    let blueTeam = [];
    redTeam.push({elem : elem, isSquad : (type == 1)});
    let redTeamNb = nb;
    let blueTeamNb = 0;
    let i = 0;
    let j = 0;
    let searchingPlayers = null;
    let searchingSquads = null;
    if(gameType == 1) {
        searchingPlayers = searchingPlayersRank;
        searchingSquads = searchingSquadsRank;
    }else if(gameType == 2){
        searchingPlayers = searchingPlayersQuick;
        searchingSquads = searchingSquadsQuick;
    }else{
        return;
    }
    while(redTeamNb != 4 && (searchingSquads.length > i || searchingPlayers.length > j)){
        var left = 4 - redTeamNb;
        if(left > 1 && searchingSquads.length > i){
            // Find squad
            if(searchingSquads[i].players.length <= left){
                redTeam.push({elem : searchingSquads[i], isSquad : true});
                redTeamNb += searchingSquads[i].players.length;
            }
            i++;
        }else{
            // Find player
            redTeam.push({elem : searchingPlayers[j], isSquad : false});
            redTeamNb++;
            j++;
        }
    }

    while(blueTeamNb != 4 && (searchingSquads.length > i || searchingPlayers.length > j)){
        var left = 4 - blueTeamNb;
        if(left > 1 && searchingSquads.length > i){
            // Find squad
            if(searchingSquads[i].players.length <= left){
                blueTeam.push(searchingSquads[i]);
                blueTeamNb += searchingSquads[i].players.length;
            }
            i++;
        }else{
            // Find player
            blueTeam.push(searchingPlayers[j]);
            blueTeamNb++;
            j++;
        }
    }
    if(blueTeamNb == 4 && redTeamNb == 4){
        // Si on a reussi a former les équipes on choisit un hote
        let host = null;
        redTeam.forEach(e => {
            if(!e.isSquad){
                host = e.elem;
            }
        });
        if(host == null) {
            blueTeam.forEach(e => {
                if(!e.isSquad){
                    host = e.elem;
                }
            });
        }
        if(host == null) {
            host = redTeam[0].elem.players[0].user;
        }
        var gameId = curGameId;
        curGameId++;
        // Une fois que l'on a l'hote on envoi a tous le monde
        games.push({redTeam : redTeam, blueTeam : blueTeam, hasBegin : false, host : host, id : gameId, type : gameType});
        redTeam.forEach(e => {
            if(e.isSquad) {
                e.elem.matchId = gameId;
                e.elem.gameType = gameType;
                e.elem.players.forEach(f => {
                    if(f.user == host) {
                        io.to(e.elem.socketid).emit("MMFoundGame", {host : true, gameId : gameId, nbPlayer : 5, isRed : true});
                    }else{
                        io.to(e.elem.socketid).emit("MMFoundGame", {host : false, gameId : gameId, nbPlayer : 5, isRed : true});
                    }
                });
            }else{
                e.elem.matchId = gameId;
                e.elem.gameType = gameType;
                if(e.elem == host){
                    io.to(e.elem.socketid).emit("MMFoundGame", {host : true, gameId : gameId, nbPlayer : 5, isRed : true});
                }else{
                    io.to(e.elem.socketid).emit("MMFoundGame", {host : false, gameId : gameId, nbPlayer : 5, isRed : true});
                }
            }
        });
        blueTeam.forEach(e => {
            if(e.isSquad) {
                e.elem.matchId = gameId;
                e.elem.gameType = gameType;
                e.elem.players.forEach(f => {
                    if(f.user == host) {
                        io.to(e.elem.socketid).emit("MMFoundGame", {host : true, gameId : gameId, nbPlayer : 5, isRed : false});
                    }else{
                        io.to(e.elem.socketid).emit("MMFoundGame", {host : false, gameId : gameId, nbPlayer : 5, isRed : false});
                    }
                });
            }else{
                e.elem.matchId = gameId;
                e.elem.gameType = gameType;
                if(e.elem == host){
                    io.to(e.elem.socketid).emit("MMFoundGame", {host : true, gameId : gameId, nbPlayer : 5, isRed : false});
                }else{
                    io.to(e.elem.socketid).emit("MMFoundGame", {host : false, gameId : gameId, nbPlayer : 5, isRed : false});
                }
            }
        });
    }else{
        elem.gameType = gameType;
        // Si on a pas reussi a former les equipes on ajoute le joueur ou l'escouade dans une des listes de recherche
        if(gameType == 1) {
            if(type == 1) {
                searchingPlayersRank.push(elem);
            }else{
                searchingSquadsRank.push(elem);
            }
        }else if (gameType == 2) {
            if(type == 1) {
                searchingPlayersQuick.push(elem);
            }else{
                searchingSquadsQuick.push(elem);
            }
        }

    }
}

/*
gameStruct :
  {
    nbPlayer : int,
  }
*/

function findPlayersTest (elem, type, gameStruct) {
    var nb = 0;
    if(type == 1){
        nb = 1;
    }else{
        nb = elem.players.length;
    }
    let redTeam = [];
    let blueTeam = [];
    redTeam.push({elem : elem, isSquad : (type != 1)});
    let redTeamNb = nb;
    let blueTeamNb = 0;
    let i = 0;
    let j = 0;
    let nbPlayerPerTeam = gameStruct.nbPlayer / 2;
    console.log("playerstest : " + searchingPlayersTest.length);
    let searchingSquads = searchingSquadsTest.filter(u => u.gameStruct.nbPlayer == gameStruct.nbPlayer);
    let searchingPlayers = searchingPlayersTest.filter(u => u.gameStruct.nbPlayer == gameStruct.nbPlayer);
    while(redTeamNb != nbPlayerPerTeam && (searchingSquads.length > i || searchingPlayers.length > j)){
        var left = nbPlayerPerTeam - redTeamNb;
        if(left > 1 && searchingSquads.length > i){
            // Find squad
            if(searchingSquads[i].players.length <= left){
                redTeam.push({elem : searchingSquads[i], isSquad : true});
                redTeamNb += searchingSquads[i].players.length;
            }
            i++;
        }else{
            // Find player
            redTeam.push({elem : searchingPlayers[j], isSquad : false});
            redTeamNb++;
            j++;
        }
    }
    console.log("squads : " + searchingSquads.length);
    console.log("players : " + searchingPlayers.length);

    i = 0;
    j = 0;
    while(blueTeamNb != nbPlayerPerTeam && (searchingSquads.length > i || searchingPlayers.length > j)){
        var left = nbPlayerPerTeam - blueTeamNb;
        if(left > 1 && searchingSquads.length > i){
            // Find squad
            if(searchingSquads[i].players.length <= left){
            if(redTeam.filter(u => u.elem == searchingSquads[i]).length > 0) {
                if(searchingSquads[i].players.length <= left){
                    blueTeam.push({elem : searchingSquads[i], isSquad : true});
                    blueTeamNb += searchingSquads[i].players.length;
                }
            }
			}
            i++;
        }else{
            // Find player
            if(redTeam.filter(u => u.elem == searchingPlayers[j]).length == 0){
                blueTeam.push({elem : searchingPlayers[j], isSquad : false});
                blueTeamNb++;
            }
            j++;
        }
    }
    console.log("blue : " + blueTeamNb);
    console.log("red : " + redTeamNb);
    console.log("need : " + nbPlayerPerTeam);
    if(blueTeamNb == nbPlayerPerTeam && redTeamNb == nbPlayerPerTeam){
        // Si on a reussi a former les équipes on choisit un hote
        let host = null;
        redTeam.forEach(e => {
            if(!e.isSquad){
                host = e.elem;
            }
        });
        if(host == null) {
            blueTeam.forEach(e => {
                if(!e.isSquad){
                    host = e.elem;
                }
            });
        }
        if(host == null) {
            host = redTeam[0].elem.players[0].user;
        }
        var gameId = curGameId;
        curGameId++;
        // Une fois que l'on a l'hote on envoi a tous le monde
        games.push({redTeam : redTeam, blueTeam : blueTeam, hasBegin : false, host : host, id : gameId, type : 3});
        redTeam.forEach(e => {
            if(e.isSquad) {
                searchingSquadsTest = searchingSquadsTest.filter(u => u.elem != e.elem);
                e.elem.matchId = gameId;
                e.elem.gameType = 3;
                e.elem.players.forEach(f => {
                    if(f.user == host) {
                        io.to(e.elem.socketid).emit("MMFoundGame", {host : true, gameId : gameId, nbPlayer : gameStruct.nbPlayer, isRed : true});
                    }else{
                        io.to(e.elem.socketid).emit("MMFoundGame", {host : false, gameId : gameId, nbPlayer : gameStruct.nbPlayer, isRed : true});
                    }
                });
            }else{
                searchingPlayersTest = searchingPlayersTest.filter(u => u.elem != e.elem);
                e.elem.matchId = gameId;
                e.elem.gameType = 3;
                if(e.elem == host){
                    io.to(e.elem.socketid).emit("MMFoundGame", {host : true, gameId : gameId, nbPlayer : gameStruct.nbPlayer, isRed : true});
                }else{
                    io.to(e.elem.socketid).emit("MMFoundGame", {host : false, gameId : gameId, nbPlayer : gameStruct.nbPlayer, isRed : true});
                }
            }
        });
        blueTeam.forEach(e => {
            if(e.isSquad) {
                searchingSquadsTest = searchingSquadsTest.filter(u => u.elem != e.elem);
                e.elem.matchId = gameId;
                e.elem.gameType = 3;
                e.elem.players.forEach(f => {
                    if(f.user == host) {
                        io.to(e.elem.socketid).emit("MMFoundGame", {host : true, gameId : gameId, nbPlayer : gameStruct.nbPlayer, isRed : false});
                    }else{
                        io.to(e.elem.socketid).emit("MMFoundGame", {host : false, gameId : gameId, nbPlayer : gameStruct.nbPlayer, isRed : false});
                    }
                });
            }else{
                searchingPlayersTest = searchingPlayersTest.filter(u => u.elem != e.elem);
                e.elem.matchId = gameId;
                e.elem.gameType = 3;
                if(e.elem == host){
                    io.to(e.elem.socketid).emit("MMFoundGame", {host : true, gameId : gameId, nbPlayer : gameStruct.nbPlayer, isRed : false});
                }else{
                    io.to(e.elem.socketid).emit("MMFoundGame", {host : false, gameId : gameId, nbPlayer : gameStruct.nbPlayer, isRed : false});
                }
            }
        });
    }else{
        elem.gameType = 3;
        // Si on a pas reussi a former les equipes on ajoute le joueur ou l'escouade dans une des listes de recherche
        elem.gameStruct = gameStruct;
        if(type == 1) {
            searchingPlayersTest.push(elem);
        }else{
            searchingSquadsTest.push(elem);
        }
        console.log("add to wait list");
    }
}

server.listen(8100, '0.0.0.0');


import express from 'express';
import http from 'http';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

import { loadData, mint, saveData, withdrawFromProject  } from './utils.js';
import { config } from './config.js';


// load the environment variables from the .env file
dotenv.config({
  path: '.env'
});

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const TOTAL = 7;

app.get('/', async (req, res) => {
  res.send(JSON.stringify(0));
});

app.post('/play', async (req, res) => {
  try {
    const wallet = req.body.wallet;
    const token =  req.body.token;
    const scores = req.body.score;
 
    const score = parseFloat(scores);
    
    const data = loadData();

    let database = data.db;
    let nebulaBase = data.nebula;
    let dumBase = data.dum;
    let snekBase = data.snek;
    let adaBase = data.ada;

    const index = database.findIndex((obj) => obj.wallet === wallet);

    if (index === -1) {
      res.send(JSON.stringify(501));
      return;
    } else if (!((token === "nebula" && database[index].nebula > score && database[index].ada > 1 )
        || (token === "dum" && database[index].dum > score && database[index].ada > 1 )
        || (token === "snek" && database[index].snek > score && database[index].ada > 1 )
      )) {
        res.send(JSON.stringify(401));      
        return;
    }

    let result = [];
    for (let i = 0; i < 5; i++) {
      let a =  new Array(TOTAL).fill(0);
      for (let j = 0; j < 3; j++) {
        let rand, num;
        do {
          rand = Math.random();
          num = Math.floor(1000 * rand) % TOTAL; 
        } while(a[num] == 1)
        result.push(num);
        a[num] = 1;
      }
    }
    console.log("Result: ", result);

    let count = 0;
    // Reward Logic
    for (let i = 0; i < 15; i++) {
      if (result[i] === 0)  count++
    }
    
    const getAmount = score * 12 * count / 10;
    console.log("Get Amount:  ", getAmount);

    if (token === "nebula") { 
      database[index].nebula -= score;
      database[index].ada -= 1;
      database[index].nebula += getAmount;
      nebulaBase -= getAmount;
      adaBase += 1;
    }

    if (token === "dum") { 
      database[index].ada -= 1;
      database[index].dum -= score;
      database[index].dum += getAmount;
      dumBase -= getAmount;
      adaBase += 0.5;
    }

    if (token === "snek") { 
      database[index].ada -= 1;
      database[index].snek -= score;
      database[index].snek += getAmount;
      snekBase -= getAmount;
      adaBase += 0.5;
    }

    const dataResult = {
      db: database,
      nebula: nebulaBase,
      dum: dumBase,
      snek: snekBase,
      ada: adaBase,
    }

    console.log("Result: ", result);

    saveData(dataResult);

    res.send(JSON.stringify(result ? result : -200))
    
    return;
  } catch (error) {
    console.log(error, ">>>> Error in Playing Game")
  }
});

app.post('/getAmount', async (req, res) => {
  const wallet = req.body.wallet;
  console.log("Wallet Address: ", req.body.wallet);
 
  const data = loadData();
  const database = data.db;
  const index = database.findIndex((obj) => obj.wallet === wallet);

  if (index === -1) {
    res.send(JSON.stringify(-100));
  } else {
    const result = database[index];
    res.send(JSON.stringify(result ? result : -200));
  }
});

app.post('/depositFund', async (req, res) => {
  const wallet = req.body.wallet;
  const nScore = req.body.nebula;
  const dScore = req.body.dum;
  const sScore = req.body.snek;
  const aScore = req.body.ada;
 
  const data = loadData();
  console.log("DATA:  ", data);
  let database = data.db;
  const index = database.findIndex((obj) => obj.wallet === wallet);

  if (index === -1) {
    const newData = {
      wallet: wallet,
      nebula: parseFloat(nScore),
      dum: parseFloat(dScore),
      snek: parseFloat(sScore),
      ada: parseFloat(aScore)
    };
    database.push(newData);
    const dataResult = {
      db: database,
      nebula: data.nebula,
      dum: data.dum,
      snek: data.snek,
      ada: data.ada,
    }
    saveData(dataResult);
    res.send(JSON.stringify(200));
  
  } else {
    database[index] = {
      wallet: wallet,
      nebula: database[index].nebula + parseFloat(nScore),
      dum: database[index].dum + parseFloat(dScore),
      snek: database[index].snek + parseFloat(sScore),
      ada: database[index].ada + parseFloat(aScore)
    }
    const dataResult = {
      db: database,
      nebula: data.nebula,
      dum: data.dum,
      snek: data.snek,
      ada: data.ada,
    }
    saveData(dataResult);

    res.send(JSON.stringify(200));
  }
});

app.post('/withdrawFund', async (req, res) => {
  const wallet = req.body.wallet;
  const nScore = req.body.nebula;
  const dScore = req.body.dum;
  const sScore = req.body.snek;
  const aScore = req.body.ada;
 
  const data = loadData();
  console.log("Data:", data);
  let database = data.db;
  const index = database.findIndex((obj) => obj.wallet === wallet);

  if (index === -1) {
    
    res.send(JSON.stringify(-100));
  
  } else {
    if (database[index].nebula < parseFloat(nScore)) {
      console.log("Nebula Amount Exceed");
      res.send(JSON.stringify(-100));
      return;
    }

    if (database[index].dum < parseFloat(dScore)) {
      console.log("Dum Amount Exceed");
      res.send(JSON.stringify(-100));
      return;
    }

    if (database[index].snek < parseFloat(sScore)) {
      console.log("Snek Amount Exceed");
      res.send(JSON.stringify(-100));
      return;
    }
    
    if (database[index].ada <= parseFloat(aScore)) {
      console.log("ADA Amount Exceed");
      res.send(JSON.stringify(-100));
      return;
    }

      
    // await mint();
    // await sendAdaFromProject("addr_test1vzpwq95z3xyum8vqndgdd9mdnmafh3djcxnc6jemlgdmswcve6tkw", 1);
    const preResult = await withdrawFromProject("addr_test1vzpwq95z3xyum8vqndgdd9mdnmafh3djcxnc6jemlgdmswcve6tkw", 1, 1, 1, 1)
    
    if (preResult != undefined) {
      database[index] = {
        wallet: wallet,
        nebula: database[index].nebula - parseFloat(nScore),
        dum: database[index].dum - parseFloat(dScore),
        snek: database[index].snek - parseFloat(sScore),
        ada: database[index].ada - parseFloat(aScore)
      }
  
      const dataResult = {
        db: database,
        nebula: data.nebula,
        dum: data.dum,
        snek: data.snek,
        ada: data.ada,
      }
      saveData(dataResult);
    }

    res.send(JSON.stringify(200));
  }
});


// make server listen on some port
((port = process.env.APP_PORT || 5000) => {
  server.listen(port, () => {
    console.log(`>> Listening on port ${port}`);
    return;
  });
})();

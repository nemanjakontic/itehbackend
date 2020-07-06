const express = require("express");
const multer = require("multer");
const mongoose = require("mongoose");
const request = require("request");

const Nekretnina = require('../models/nekretnina');

const router = express.Router();

const TIPOVI = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg'
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isValid = TIPOVI[file.mimetype];
    let error = new Error("Invalid!");
    if(isValid) {
      error = null;
    }
    cb(error, "backend/images");
  },
  filename: (req, file, cb) => {
    // const name = file.originalname.toLowerCase().split(' ').join('-');
    // console.log("File: " + file);
    // const ext = TIPOVI[file.mimetype];
    // console.log("file.mimeType: " + file.mimetype);
    // console.log("ext: " + ext);
    // cb(null, name + '-' + Date.now() + '.' + ext);//
    cb(null, file.originalname);
  }
});

const proveriAuth = require("../middleware/proveri-auth");

router.get("/api/nekretnine", (req, res, next)=>{
  Nekretnina.find().then(documents => {
    // console.log(documents);
    res.status(200).json({
      message: 'Uspesno!',
      nekretnine: documents
    });
  }).catch(error => {
    res.status(500).json({
      message: "Neuspesno povlacenje nekretnina"
    })
  });;
});

router.post("/api/nekretnine/pretraga", (req, res, next) => {
  const parametri = req.body.valueParametri;
  let kvOd = parametri.kvadraturaOd;
  let kvDo = parametri.kvadraturaDo;
  let cenaOd = parametri.cenaOd;
  let cenaDo = parametri.cenaDo;
  let query = {};

  if (cenaOd && cenaDo){
    query.cena = {$gte: +cenaOd, $lte: +cenaDo};
  }else{
    if (cenaOd) query.cena = {$gte: +cenaOd};
    if (cenaDo) query.cena = {$lte: +cenaDo};
  }

  if (kvOd && kvDo){
    query.kvadratura = {$gte: +kvOd, $lte: +kvDo};
  }else{
    if (kvOd) query.kvadratura = {$gte: +kvOd};
    if (kvDo) query.kvadratura = {$lte: +kvDo};
  }

  Nekretnina.find(query).then(nekretnine => {
    // console.log(nekretnine);
    res.status(200).json({
      nekretnine: nekretnine,
      poruka: "Uspesna pretraga"
    });
  });
});

router.post("/api/nekretnine", proveriAuth, multer({storage: storage}).single("slika") ,  (req, res, next) => {
  const url = req.protocol + '://' + req.get("host");
  // console.log("Url: " + url);
  console.log(req.file);
  const nekretnina = new Nekretnina({
    naslov: req.body.naslov,
    opis: req.body.opis,
    kvadratura: req.body.kvadratura,
    cena: req.body.cena,
    slika: url + "/images/" + req.file.filename,
    // slika: req.body.slika,
    user: req.userData.userId
  });
  console.log(nekretnina);
  nekretnina.save().then(result => {
    res.status(201).json({
      message: 'Nekretnina dodata u bazu!',
      nekretninaResponse: {
        id: result._id,
        naslov: result.naslov,
        opis: result.opis,
        kvadratura: result.kvadratura,
        cena: result.cena,
        user: result.user,
        slika: result.slika
      }
    });
  }).catch(error => {
    res.status(500).json({
      message: "Kreiranje oglasa neuspesno"
    })
  });
  // next();
});

router.delete("/api/nekretnine/:id", proveriAuth, (req, res, next) => {
  Nekretnina.deleteOne({_id: req.params.id, user: req.userData.userId}).then(result => {
    console.log(result);
    if(result.n > 0) {
      res.status(200).json({message: 'Deletion successful!'});
    } else {
      res.status(401).json({message: 'Not authorized!'});
    }
  }).catch(error => {
    res.status(500).json({
      message: "Greska u brisanju nekretnine"
    })
  });;
});

router.get("/api/nekretnine/:id", (req, res, next) => {
  Nekretnina.findById(req.params.id).then(nekretnina => {
    if(nekretnina){
      res.status(200).json(nekretnina);
    }else{
      res.status(404).json({message: 'Page not found!'});
    }
  }).catch(error => {
    res.status(500).json({
      message: "Povlacenje jednog posta neuspesno"
    })
  });;
});

router.put("/api/nekretnine/:id", multer({storage: storage}).single("slika"), proveriAuth,  (req, res, next) => {
  console.log("req.file: " + req.file);
  let imagepath = req.body.slika;
  console.log("image path: " + imagepath);
  if(req.file) {
    console.log("usao u req.file");
    const url = req.protocol + '://' + req.get("host");
    imagepath = url + "/images/" + req.file.filename;
    console.log("image path2: " + imagepath);
  }
  const nekretnina = new Nekretnina({
    _id: req.body.id,
    naslov: req.body.naslov,
    opis: req.body.opis,
    cena: req.body.cena,
    kvadratura: req.body.kvadratura,
    slika: imagepath,
    user: req.userData.userId
  });
  console.log("napravljena nekretnina: " + nekretnina);
  console.log("userData: " + req.userData.userId);
  Nekretnina.updateOne({_id: nekretnina._id, user: mongoose.Types.ObjectId(req.userData.userId)}, nekretnina).then(result => {
    console.log(result);
    if(result.n > 0) {
      res.status(200).json({message: 'Update successful!', slika: nekretnina.slika});
    } else {
      res.status(401).json({message: 'Not authorized!'});
    }
  }).catch(error => {
    res.status(500).json({
      message: "Izmena neuspesna"
    })
  });
});

// router.get("/api/nekretnine/kursnaLista", (req, res, next)=>{
//   request('http://api.kursna-lista.info/e0b09586c14dac20c229651fefa4798f/kursna_lista/json', {json: true}, (err, res, body) => {
//     res.status(200).json({
//       message: 'Uspesno!',
//       kursnaLista: body
//     });
//   }).catch(error => {
//     res.status(500).json({
//       message: "Neuspesno povlacenje nekretnina"
//     })
//   });
// });

module.exports = router;

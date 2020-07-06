const mongoose = require('mongoose');

const nekretninaSchema = mongoose.Schema({
  naslov: String,
  opis: String,
  kvadratura: Number,
  cena: Number,
  slika: {type: String, required: true},
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true}
});

module.exports = mongoose.model("Nekretnina", nekretninaSchema);

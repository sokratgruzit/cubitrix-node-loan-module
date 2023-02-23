require("dotenv").config();

async function test(req, res) {
  try {
    let data = "Goga shitty programmer";
    
    console.log(req);

    res.status(200).json(data);
  } catch (e) {
    console.log(e);
    return res.status(400).json({ "message": e });
  }
}

module.exports = {
  test
};

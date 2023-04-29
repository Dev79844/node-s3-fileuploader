const express = require('express')
const morgan = require('morgan')
require('dotenv').config()
const fileParser = require('./fileparser')

const app = express()

app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(morgan('dev'))

app.get('/', (req, res) => {
    res.send(`
      <h2>File Upload With <code>"Node.js"</code></h2>
      <form action="/api/upload" enctype="multipart/form-data" method="post">
        <div>Select a file: 
          <input type="file" name="file" multiple="multiple" />
        </div>
        <input type="submit" value="Upload" />
      </form>
  
    `);
  });

app.post("/api/upload", async(req,res) => {
    await fileParser(req)
    .then(data => {
        res.status(200).json({message:"successful", data})
    })
    .catch(err => {
        res.status(400).json({message: "An error occured",err})
    })
})

app.listen(process.env.PORT, () => {
    console.log(`Server started on port ${process.env.PORT}`);
})
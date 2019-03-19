const express = require('express');
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');
const path = require('path');
const nodemailer = require('nodemailer');
const _ = require('lodash');
const fs = require('fs');
const Multer = require('multer');
const Parse = require('csv-parse');

const app = express();

// View engine setup
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

// Static folder
app.use('/public', express.static(path.join(__dirname, 'public')));

// Body Parser Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.render('contact');
});

const usersGroup = [
  {email: 'mvplang@gmail.com', userName: 'zitan'},
  {email: 'mvplanggit@gmail.com', userName: 'erdan'}
]

//We will call this once Multer's middleware processed the request
//and stored file in req.files.fileFormFieldName
const data = [];

function parseFile(req, res, next){
    var filePath = req.file.path;
    console.log(filePath);
    function onNewRecord(record){
        console.log(record);
        data.push(record);
    }

    function onError(error){
        console.log(error)
    }

    function done(linesRead){
        console.log(data)
    }

    var columns = false; 
    parseCSVFile(filePath, columns, onNewRecord, onError, done);
}

function parseCSVFile(sourceFilePath, columns, onNewRecord, handleError, done){
    var source = fs.createReadStream(sourceFilePath);

    var linesRead = 0;

    var parser = Parse({
        delimiter: ',', 
        columns
    });

    parser.on("readable", function(){
        var record;
        while (record = parser.read()) {
            linesRead++;
            onNewRecord(record);
        }
    });

    parser.on("error", function(error){
        handleError(error)
    });

    parser.on("end", function(){
        done(linesRead);
    });

    source.pipe(parser);
}


app.post('/send', (req, res) => {
  const {email, password, message} = req.body;

  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: email, // generated ethereal user
        pass: password  // generated ethereal password
    },
    tls:{
      rejectUnauthorized:false
    }
  });

  _.forEach(usersGroup, user => {

      const output = `
        <h3>Hi ${user.userName}</h3>
        <p>${message}</p>
      `;

      // setup email data with unicode symbols
      let mailOptions = {
          from: email, // sender address
          to: user.email, // list of receivers
          subject: 'Node Contact Request', // Subject line
          text: 'Hello world?', // plain text body
          html: output // html body
      };

      // send mail with defined transport object
      transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
              return console.log(error);
          }
          console.log('Message sent: %s', info.messageId);   
          console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

          res.render('contact', {msg:'Email has been sent'}); 
      });
  })
});

app.post('/send_users', [Multer({dest:'./uploads'}).single('file'), parseFile]);

app.listen(3000, () => console.log('Server started...'));
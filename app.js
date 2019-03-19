const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');
const path = require('path');
const nodemailer = require('nodemailer');
const _ = require('lodash');
const multer = require('multer');
const destination = './uploads';

const app = express();
const upload = multer();
const storage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, destination);
  },
  filename: function (req, file, callback) {
    callback(null, file.originalname);
  }
});
const uploadMultiple = multer({ storage : storage }).array('userPhoto',2);
let filePaths;

// View engine setup
app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

// Static foldermulter
app.use('/public', express.static(path.join(__dirname, 'public')));

// Body Parser Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.render('contact');
});

app.post('/send', (req, res) => {
  const {email, password, message, usersGroup, subject, header} = req.body;

  const users = JSON.parse(usersGroup);
  // create reusable transporter object using the default SMTP transport
  const transporter = nodemailer.createTransport({
    host: 'smtpout.secureserver.net',
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

  _.forEach(users, (user, index) => {

      const output = `
        <p>${header} ${user.username},</p>
        <p>${message}</p>
      `;

      // setup email data with unicode symbols
      const mailOptions = {
          from: email, // sender address
          to: user.email, // list of receivers
          subject: subject, // Subject line
          html: output, // html body
          attachments: filePaths
      };

      // send mail with defined transport object
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('fail: ',error)
            io.sockets.emit('sent', {index: index + 1, state: 'Fail'});
            return;
        }

        // only needed when using pooled connections
        transporter.close();
        io.sockets.emit('sent', {index: index + 1, state: 'Success'});
    });
  })
});

app.post('/send_users', upload.single('file'), async (req, res) => {
  try {
    const csvFile = req.file.buffer.toString();
    const rows = csvFile.split('\n');
    const result = [];

    for (let row of rows) {
      const columns = row.replace(/\r/g, '').split(',');
      if(!_.isEmpty(columns[0])){
        result.push({email: columns[0], username: columns[1]});
      }
    }

    io.sockets.emit('emaillist',{ users: JSON.stringify(result)});
  } catch (err) {
    console.log(err);
  }
});

app.post('/upload_files', (req, res) => {
    uploadMultiple(req,res,function(err) {
        if(err) {
            return res.end("Error uploading file.");
        }
        filePaths = req.files;
    });
});

const server = app.listen(3000, () => console.log('Server started...'));
const io = require('socket.io').listen(server);

io.sockets.on('connection', function(socket) {
   socket.on('disconnect', function() {
      fs.readdir(destination, (err, files) => {
        if (err) throw err;

        for (const file of files) {
          fs.unlink(path.join(destination, file), err => {
            if (err) throw err;
          });
        }
      });
   });
});
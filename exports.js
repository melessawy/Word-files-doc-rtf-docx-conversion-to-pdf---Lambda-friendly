const https = require('https');
const path = require('path');
const fs = require('fs');
var async = require('async');
const {writeFileSync} = require('fs');
const lambdafs = require('lambdafs');
const {execSync} = require('child_process');
var AWS = require('aws-sdk');

const inputPath = path.join( '/opt', 'lo.tar.br'); 
//const outputPath = '/tmp/';
const bucketName = 'doc-conversion1';

exports.handler = async (event, context) => {
  console.log(execSync('ls -alh /opt').toString('utf8'));

  try {
    // Decompressing
    let decompressed = {
      file: await lambdafs.inflate(inputPath)
    };
 
    console.log('output brotli de:----', decompressed); 
  } catch (error) {
    console.log('Error brotli de:----', error);
  }
 
  try {
    console.log(execSync('ls -alh /opt').toString('utf8')); 
  } catch (e) {
    console.log(e);
  }

  var body = "";
  //S3 put event
  console.log(event.Records[0].s3.object)
  body = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
  
  // doc file name without the folder path
  docname = body.substr(body.lastIndexOf("/")+1, body.length) 
  // pdf file name to be used 
  pdfname = docname.substr(0, docname.lastIndexOf(".")) + ".pdf"; 
  
  console.log('s3 bucket file name from event:', body);

  // get file from s3 bucket
  var s3fileName = body;
  var s3 = new AWS.S3({apiVersion: '2006-03-01'});
  
  // s3 getObject function
  var getObject = function(key) {
      return new Promise(function(success, reject) {
          s3.getObject(
              { Bucket: bucketName, Key: key },
              function (error, data) {
                  if(error) {
                      reject(error);
                  } else {
                      success(data);
                  }
              }
          );
      });
  }
  
  // execute s3 getObject
  let fileData = await getObject(s3fileName);
  // file data acquired
  console.log("File Data from s3 getObject command - below")
  console.log(fileData)
  // create a random file name for the lambda conversion process
  // to bypass errors occuring when a doc file with lenghty file name is uploaded
  lambdafile="/tmp/"+Math.floor(Math.random() * (999999 - 000001) + 000001)

    try{  
      fs.writeFileSync(lambdafile, fileData.Body);
    } catch(err) {
      // An error occurred
      console.error('file write:', err);
    }
	
	// Libreoffice conversion command
    const convertCommand = `export HOME=/tmp && /tmp/lo/instdir/program/soffice.bin --headless --norestore --invisible --nodefault --nofirststartwizard --nolockcheck --nologo --convert-to "pdf:writer_pdf_Export" --outdir /tmp ${lambdafile}`;
    try {
      console.log(execSync(convertCommand).toString('utf8'));
	  console.log(1);
    } catch (e) {
      console.log(execSync(convertCommand).toString('utf8'));
	  console.log(2);
    }
    console.log(execSync('ls -alh /tmp').toString('utf8'));
	console.log(3);
	
	// function to upload the converted file to s3
    function uploadFile(buffer, fileName) {
     return new Promise((resolve, reject) => {
      s3.putObject({
       Body: buffer,
       Key: fileName,
       Bucket: bucketName,
      }, (error) => {
       if (error) {
        reject(error);
       } else {

        resolve(fileName);
       }
      });
     });
    }
	
	// find the converted file on lambda
    let fileParts = lambdafile+".pdf";
	// rad the converted file
    let fileB64data = fs.readFileSync(fileParts);
	// upload it back to s3 with the original doc file name .pdf
    await uploadFile(fileB64data, 'pdf/'+pdfname);
    
	console.log('new pdf converted and uploaded!!!');
};

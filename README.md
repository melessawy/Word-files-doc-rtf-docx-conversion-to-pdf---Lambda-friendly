# Word files (doc, rtf, docx) conversion to pdf using Lambda

This is a Node JS function that can be deployed as an AWS Lambda function, to convert most common Word file formats (including doc, docx and rtf) to pdf. I tested it on txt and worked fine too. It uses Libreoffice Lambda layer. 

## Steps:

1- Create an S3 bucket to hold your files.

2- Inside your bucket, add 3 subfolders: 

- 'docs' to hold your source Word files
- 'pdf' to hold your resulted pdf during the conversion process (will be deleted once the conversion is done, which means that this folder will be empty most of the time)
- 'history' to keep a historical copy of all converted pdf files

3- Update the S3 bucket name inside exports.js (mine is named 'doc-conversion1').

4- Create a Lambda function (from scratch). For the run-time, choose 'Node.js 12.x'.

5- Add a LibreOffice Layer to function. There are two layers that are compatible with Node.js 12 - both are copied below. I used the first one.

- Layer 1: arn:aws:lambda:us-east-1:764866452798:layer:libreoffice-brotli:1

- Layer 2: arn:aws:lambda:us-east-1:764866452798:layer:libreoffice-gzip:1

(for extra reading on those layers: https://github.com/shelfio/libreoffice-lambda-layer)

6- Set Lambda's execution timeout to the maximum time available (to ensure it can handle large files).

7- Set Lambda's memory to the maximum, for the same above reason.

8- Go back to your S3 bucket, update its events (under properties). You will need to add a Put event with the below details:

- Name: you can use any name
- Event: Put
- Prefix: docs/
- Send to: Lambda function
- Lambda: choose your function's name from the list

9- Download this repository to your local system. Unzip the folder node_modules.zip

10- Make sure that your folder has the below structure:


.

|__ Word-to-pdf-conversion-using-Lambda

                                      |__fonts
                                  
                                          |__<font files>
                                      
                                      |___node-modules
                                  
                                          |__<subfolders holding all the modules>
                                      
                                      |___export.js
                                  
                                      |___package.json
                                  
                                      |___package-lock.json


11- Zip your folder and upload it to lambda as a package (don't enter the code manually inside Lambda editor).

--------------------------------------------------------------------------------------------------------

If everything is allright, you should be able to test the function now. Upload a file to your s3 bucket's subfolder 'docs', the function will be triggered, a conversion will happen inside the 'pdf' subfolder, and the final converted pdf will be moved to the 'history' subfolder. 

For any issues, check AWS Cloudwatch log. It can be confusing but I learnt a lot from it.

Happy converting!

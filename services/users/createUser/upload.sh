zip -r createUser.zip .
aws lambda update-function-code --function-name createUser --zip-file fileb://createUser.zip

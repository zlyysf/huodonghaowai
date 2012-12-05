var assert = require('assert');
var util = require('util');
var handy = require('../lib/handy');


function showHelp(){
  console.log('to encrypt , input: node thisFile.js encrypt "plaintext"');
  console.log('to decrypt , input: node thisFile.js decrypt "encrypted text"');
}


var toEncryptSign = "encrypt";
var toDecryptSign = "decrypt";
var isToEncrypt = false;
var isToDecrypt = false;

if (process.argv.length < 4){
  showHelp();
  return;
}

var action = process.argv[2];
var srcText = process.argv[3];
if(toEncryptSign == action){
  isToEncrypt = true;
}else if(toDecryptSign == action){
  isToDecrypt = true;
}else{
  showHelp();
  return;
}
var destText ;
if (isToEncrypt){
  destText = handy.encrypt(srcText);
  console.log("encrypted text="+destText);
  return;
}else if (isToDecrypt){
  destText = handy.decrypt(srcText);
  console.log("decrypted text="+destText);
  return;
}

showHelp();
return;






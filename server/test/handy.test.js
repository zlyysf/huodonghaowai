/*
 * unit tests for notification.js
 */

var assert = require('assert');
var util = require('util');

var config = require('../lib/config');
var handy = require('../lib/handy');
var tool = require('../lib/tool');
//var logger = require('../lib/logger');





function test_doHttpPostForm(){
    handy.doHttpPostForm({host:'localhost',port:80,path:'/t17requestVars.php',
      postForm:{a:'/var/tmp/aaa~.jpg',b:'123 qwe'}},function(err, retDataObj){
        if (err) {
          handy.handleError({err:err});
          return;
        }
        util.log("retDataObj.data=\n"+retDataObj.data);
    });//doHttpPostForm
};//test_doHttpPostForm


function test_arrayIndexOf(){
  var i = handy.arrayIndexOf({ary:['111','aaa'],item:'aaa'});//arrayIndexOf
  assert.ok(i>=0);
  var i = handy.arrayIndexOf({ary:['111','aaa'],item:'111'});//arrayIndexOf
  assert.ok(i>=0);
};//test_arrayIndexOf


function test_formatDate(){
  var dt1 = new Date();
  var dt1time = dt1.getTime();
  var sDt1time = dt1time + '';
  var dt2time = Number(sDt1time);
  var dt2 = new Date(dt2time);
  assert.ok(dt2time == dt1time);

  var dt3time = Number(dt1time);
  assert.ok(dt3time == dt1time);

  var r = handy.formatDate({dt:dt2,needUTC:true,needSeparateChar:false,needSecondPart:false});
  console.log("r="+r);
  var r = handy.formatDate({dt:dt2,needUTC:true,needSeparateChar:false,needSecondPart:true,needMsPart:true});
  console.log("r="+r);
  var r = handy.formatDate({dt:dt2time,needUTC:true,needSeparateChar:false,needSecondPart:true,needMsPart:true});
  console.log("r="+r);
};//test_formatDate


function test_formatNumberWithGivenLength(){
  var s1 = '  123';
  var s2 = '0000123';
  var i3 = 123;
  var r ;
  var length = 9;
  r = handy.formatNumberWithGivenLength({number:s1,length:length,complementInRight:false,complementChar:'0'});
  console.log("r="+r);
  r = handy.formatNumberWithGivenLength({number:s2,length:length,complementInRight:false,complementChar:'0'});
  console.log("r="+r);
  r = handy.formatNumberWithGivenLength({number:i3,length:length,complementInRight:false,complementChar:'0'});
  console.log("r="+r);

  i3 = 12345678;
  length = 6;
  r = handy.formatNumberWithGivenLength({number:i3,length:length, needCutWhenExceed:true,cutInLow:true,  complementInRight:false,complementChar:'0'});
  console.log("should be 123456, r="+r);
  r = handy.formatNumberWithGivenLength({number:i3,length:length, needCutWhenExceed:true,cutInLow:false,  complementInRight:false,complementChar:'0'});
  console.log("should be 345678, r="+r);

};//test_formatNumberWithGivenLength


function test_generateZsetScoreFromDate(){
  util.log("test_generateZsetScoreFromDate entered.");
  var precisionInMs = 10*60*1000; //10 minute
  var digitLenOfLowOrderSeq = 9;

  var dateInMs = new Date().getTime();
  var lowSeqPart = 1234;
  var r = handy.generateZsetScoreFromDate({timeInMs:dateInMs, precisionInMs:precisionInMs, lowOrderSeq:lowSeqPart, digitLenOfLowOrderSeq:digitLenOfLowOrderSeq});
  console.log("r="+r);

  lowSeqPart = 123456789;
  r = handy.generateZsetScoreFromDate({timeInMs:dateInMs, precisionInMs:precisionInMs, lowOrderSeq:lowSeqPart, digitLenOfLowOrderSeq:digitLenOfLowOrderSeq});
  console.log("r="+r);
};//test_generateZsetScoreFromDate


function test_removeNullFieldFor1Level(){
  util.log("test_removeNullFieldFor1Level entered.");

  var o1 = {a1:null, a2:false, a3:undefined, a4:'12'};
  var r = handy.removeNullFieldFor1Level(o1);
  console.log("r="+util.inspect(r,false,100));

  o1 = {a1:null, a3:undefined};
  r = handy.removeNullFieldFor1Level(o1);
  console.log("r="+util.inspect(r,false,100));
};//test_removeNullFieldFor1Level

function test_convertToBool(){
  util.log("test_convertToBool entered.");

  var p1;
  var r;
  r = handy.convertToBool(p1);
  console.log("convert "+p1+"(type="+(typeof p1)+"), value="+util.inspect(r,false,100));

  p1=null;
  r = handy.convertToBool(p1);
  console.log("convert "+p1+"(type="+(typeof p1)+"), value="+util.inspect(r,false,100));

  p1='false';
  r = handy.convertToBool(p1);
  console.log("convert "+p1+"(type="+(typeof p1)+"), value="+util.inspect(r,false,100));

  p1='undefined';
  r = handy.convertToBool(p1);
  console.log("convert "+p1+"(type="+(typeof p1)+"), value="+util.inspect(r,false,100));

  p1='null';
  r = handy.convertToBool(p1);
  console.log("convert "+p1+"(type="+(typeof p1)+"), value="+util.inspect(r,false,100));

  p1='0';
  r = handy.convertToBool(p1);
  console.log("convert "+p1+"(type="+(typeof p1)+"), value="+util.inspect(r,false,100));

  p1='';
  r = handy.convertToBool(p1);
  console.log("convert "+p1+"(type="+(typeof p1)+"), value="+util.inspect(r,false,100));

};//test_convertToBool



function test_beNthPowerOf2(){
  util.log("test_beNthPowerOf2 entered.");

  var i = 1;
  var r = handy.beNthPowerOf2(i);
  console.log("i="+i+", r="+util.inspect(r,false,100));

  i = 2;
  r = handy.beNthPowerOf2(i);
  console.log("i="+i+", r="+util.inspect(r,false,100));

  i = 3;
  r = handy.beNthPowerOf2(i);
  console.log("i="+i+", r="+util.inspect(r,false,100));

  i = 4;
  r = handy.beNthPowerOf2(i);
  console.log("i="+i+", r="+util.inspect(r,false,100));

  i = 5;
  r = handy.beNthPowerOf2(i);
  console.log("i="+i+", r="+util.inspect(r,false,100));

  i = 6;
  r = handy.beNthPowerOf2(i);
  console.log("i="+i+", r="+util.inspect(r,false,100));

  i = 7;
  r = handy.beNthPowerOf2(i);
  console.log("i="+i+", r="+util.inspect(r,false,100));

  i = 8;
  r = handy.beNthPowerOf2(i);
  console.log("i="+i+", r="+util.inspect(r,false,100));

  i = 9;
  r = handy.beNthPowerOf2(i);
  console.log("i="+i+", r="+util.inspect(r,false,100));
};//test_beNthPowerOf2

function test_convertToDate(){
  var dt = new Date(1999,9,9,12,13,14,156);
  var time = dt.getTime();
  var time2 = time + 3*60*60*1000;
  var time3 = time + 7*24*60*60*1000;

  var dtB = handy.convertToDate(dt);
  var dtB1 = handy.convertToDate(time);
  var dtB2 = handy.convertToDate(time+"");
  assert.ok(dtB.getTime()==dtB1.getTime());
  assert.ok(dtB1.getTime()==dtB2.getTime());

  dtB1 = handy.convertToDate(time2);
  dtB2 = handy.convertToDate(time2+"");
  assert.ok(dtB1.getTime()==dtB2.getTime());

  dtB1 = handy.convertToDate(time3);
  dtB2 = handy.convertToDate(time3+"");
  assert.ok(dtB1.getTime()==dtB2.getTime());
};//test_convertToDate

//TO BE deleted
function test_DateLocalFromToUTC(){
  var dt0Local = new Date();
  var dt2Utc = handy.dateLocalToUTC(dt0Local);
  var dt3Local = handy.dateUTCtoLocal(dt2Utc);
  assert.ok(dt0Local.getTime()==dt3Local.getTime());

  var dtAutc = new Date(dt0Local.getUTCFullYear(), dt0Local.getUTCMonth(), dt0Local.getUTCDate(), dt0Local.getUTCHours(), dt0Local.getUTCMinutes(), dt0Local.getUTCSeconds(), dt0Local.getUTCMilliseconds());
  assert.ok(dtAutc.getTime()==dt2Utc.getTime());


  console.log("original local date:");
  var dt = dt0Local;
  console.log('toString=   '+dt.toString());
  console.log('toUTCString='+dt.toUTCString());

  console.log("utc date:");
  dt = dt2Utc;
  console.log('toString=   '+dt.toString());
  console.log('toUTCString='+dt.toUTCString());

  console.log("local 2 date:");
  dt = dt3Local;
  console.log('toString=   '+dt.toString());
  console.log('toUTCString='+dt.toUTCString());
};//test_DateLocalFromToUTC


function test_encryptDecrypt(){
  var s1 = "abc123";
  var s1e = handy.encrypt(s1);
  var s1ed = handy.decrypt(s1e);
  assert.ok(s1 == s1ed);
  console.log("s1="+s1+", s1e="+s1e+", s1ed="+s1ed);
  var s1d = handy.decrypt(s1);
  console.log("s1d="+util.inspect(s1d));

  var timeNowUtc = handy.getUTCNowTime();
  var tm1 = timeNowUtc + 24*60*60*1000;
  var tkn1 = tm1 +"M" + "abc@aaa.com";
  console.log("encrypt "+tkn1+"="+handy.encrypt(tkn1));

  tkn1 = tm1 +"M" + "lianyu.zhang@yasofon.com";
  console.log("encrypt "+tkn1+"="+handy.encrypt(tkn1));

  var tryDecryptErrstr = "tryDecryptErr";
  var tryDecryptErr = handy.decrypt(tryDecryptErrstr);
  console.log("tryDecryptErr="+util.inspect(tryDecryptErr));
};//test_encryptDecrypt



function test_unionArray(){
  var ary1 = ['a1',1];
  var ary21 = ['a2',2];
  var ary22 = ['a1',1];
  var ary23 = ['a1',1,'a2',2];
  var ary24 = [];
  var ary25 = null;
  var ary26 = ['1',2];
  var ary2,ary3;

  ary2 = ary21;
  ary3 = handy.unionArray({ary1:ary1, ary2:ary2});
  console.log("ary1="+util.inspect(ary1)+", ary2="+util.inspect(ary2)+", ary3="+util.inspect(ary3));

  ary2 = ary22;
  ary3 = handy.unionArray({ary1:ary1, ary2:ary2});
  console.log("ary1="+util.inspect(ary1)+", ary2="+util.inspect(ary2)+", ary3="+util.inspect(ary3));

  ary2 = ary23;
  ary3 = handy.unionArray({ary1:ary1, ary2:ary2});
  console.log("ary1="+util.inspect(ary1)+", ary2="+util.inspect(ary2)+", ary3="+util.inspect(ary3));

  ary2 = ary24;
  ary3 = handy.unionArray({ary1:ary1, ary2:ary2});
  console.log("ary1="+util.inspect(ary1)+", ary2="+util.inspect(ary2)+", ary3="+util.inspect(ary3));

  ary2 = ary25;
  ary3 = handy.unionArray({ary1:ary1, ary2:ary2});
  console.log("ary1="+util.inspect(ary1)+", ary2="+util.inspect(ary2)+", ary3="+util.inspect(ary3));

  ary2 = ary26;
  ary3 = handy.unionArray({ary1:ary1, ary2:ary2});
  console.log("ary1="+util.inspect(ary1)+", ary2="+util.inspect(ary2)+", ary3="+util.inspect(ary3));

};//test_unionArray


function test_copyFieldsDeepOnlyForObject(){
  var src1 = {a:1 , b:'b'};
  var dest1 = {a:2, c:3};
  console.log("origin dest1="+util.inspect(dest1,false,100));
  tool.copyFieldsDeepOnlyForObject({srcObj:src1, destObj:dest1, overrideSameName:false});
  console.log("dest1="+util.inspect(dest1,false,100));
  tool.copyFieldsDeepOnlyForObject({srcObj:src1, destObj:dest1, overrideSameName:true});
  console.log("dest1="+util.inspect(dest1,false,100));

  var src2 = {f1:1, f2:'b', f3:{f31:1, f32:'b'}, f4:{f41:{}}};
  var dest2 = {f1:'a', f5:5, f3:{f31:2, f33:'a'}};
  console.log("origin dest2="+util.inspect(dest2,false,100));
  tool.copyFieldsDeepOnlyForObject({srcObj:src2, destObj:dest2, overrideSameName:false});
  console.log("dest2="+util.inspect(dest2,false,100));
  tool.copyFieldsDeepOnlyForObject({srcObj:src2, destObj:dest2, overrideSameName:true});
  console.log("dest2="+util.inspect(dest2,false,100));

};//test_copyFieldsDeepOnlyForObject






//test_doHttpPostForm();
//test_arrayIndexOf();
//test_doHttpPostForm();
//test_formatDate();
//test_formatNumberWithGivenLength();
//test_generateZsetScoreFromDate();
//test_removeNullFieldFor1Level();
//test_convertToBool();
//test_beNthPowerOf2();
//test_convertToDate();
//test_DateLocalFromToUTC();
//test_encryptDecrypt();
//test_unionArray();
test_copyFieldsDeepOnlyForObject();